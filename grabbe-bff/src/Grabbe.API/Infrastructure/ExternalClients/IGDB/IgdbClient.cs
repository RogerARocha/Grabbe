using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.ExternalClients.IGDB;

namespace Grabbe.API.Infrastructure.ExternalClients;

public class IgdbClient : IMediaProviderClient
{
    private readonly HttpClient _httpClient;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private static string? _accessToken;
    private static DateTime _tokenExpiration = DateTime.MinValue;
    private static readonly SemaphoreSlim _tokenSemaphore = new SemaphoreSlim(1, 1);

    public string ProviderName => "IGDB";
    public string[] SupportedTypes => new[] { "GAME" };

    public IgdbClient(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://api.igdb.com/v4/");
        
        _clientId = config["IGDB:ClientId"] ?? throw new ArgumentNullException("IGDB:ClientId");
        _clientSecret = config["IGDB:ClientSecret"] ?? throw new ArgumentNullException("IGDB:ClientSecret");
    }

    private async Task EnsureAccessTokenAsync()
    {
        if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _tokenExpiration)
        {
            return;
        }

        await _tokenSemaphore.WaitAsync();
        try
        {
            if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _tokenExpiration)
            {
                return;
            }

            var requestParams = new Dictionary<string, string>
            {
                { "client_id", _clientId },
                { "client_secret", _clientSecret },
                { "grant_type", "client_credentials" }
            };

            var requestContent = new FormUrlEncodedContent(requestParams);
            var response = await _httpClient.PostAsync("https://id.twitch.tv/oauth2/token", requestContent);
            
            response.EnsureSuccessStatusCode();

            var contentStream = await response.Content.ReadAsStreamAsync();
            var tokenDoc = await JsonDocument.ParseAsync(contentStream);
            
            _accessToken = tokenDoc.RootElement.GetProperty("access_token").GetString();
            int expiresIn = tokenDoc.RootElement.GetProperty("expires_in").GetInt32();
            _tokenExpiration = DateTime.UtcNow.AddSeconds(expiresIn - 300);
        }
        finally
        {
            _tokenSemaphore.Release();
        }
    }

    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        if (!string.IsNullOrEmpty(type) && !SupportedTypes.Contains(type, StringComparer.OrdinalIgnoreCase))
            return Enumerable.Empty<GrabbeMediaDTO>();

        var apicalypseQuery = $@"
            search ""{query}"";
            fields name, summary, first_release_date, 
                   cover.url, genres.name, rating, alternative_names.name,
                   involved_companies.developer, involved_companies.publisher, involved_companies.company.name;
            limit 12;
        ";

        var games = await ExecuteIgdbQueryAsync(apicalypseQuery);
        
        if (games == null || !games.Any()) 
            return Enumerable.Empty<GrabbeMediaDTO>();

        return games.Select(IgdbMapper.ToUniversalDto);
    }

    public async Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type)
    {
        if ((!string.IsNullOrEmpty(type) && !SupportedTypes.Contains(type, StringComparer.OrdinalIgnoreCase)) || !int.TryParse(externalId, out int id))
            return null;

        var apicalypseQuery = $@"
            fields name, summary, first_release_date, 
                   cover.url, genres.name, rating, alternative_names.name,
                   involved_companies.developer, involved_companies.publisher, involved_companies.company.name;
            where id = {id};
        ";

        return await RetryHelper.ExecuteWithRetryAsync(
            async () =>
            {
                var games = await ExecuteIgdbQueryAsync(apicalypseQuery);
                var game = games?.FirstOrDefault();
                return game != null ? IgdbMapper.ToUniversalDto(game) : null;
            },
            maxRetries: 3,
            delayMilliseconds: 1000,
            shouldRetry: ex => ex is ExternalProviderException pEx && (pEx.StatusCode == null || pEx.StatusCode == System.Net.HttpStatusCode.TooManyRequests || (int)pEx.StatusCode >= 500)
        );
    }

    // ── Helper centralizado para as chamadas HTTP ──
    private async Task<List<IgdbGameResponse>?> ExecuteIgdbQueryAsync(string query)
    {
        await EnsureAccessTokenAsync();

        var request = new HttpRequestMessage(HttpMethod.Post, "games")
        {
            Content = new StringContent(query, Encoding.UTF8, "text/plain")
        };

        request.Headers.Add("Client-ID", _clientId);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request);
        }
        catch (HttpRequestException ex)
        {
            throw new ExternalProviderException(ProviderName, null, "Failed to connect to the IGDB API server.", ex);
        }
        
        if (!response.IsSuccessStatusCode)
        {
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }
            throw new ExternalProviderException(ProviderName, response.StatusCode, $"IGDB request failed with status code {response.StatusCode}.");
        }

        var contentStream = await response.Content.ReadAsStreamAsync();
        try
        {
            return await JsonSerializer.DeserializeAsync<List<IgdbGameResponse>>(contentStream);
        }
        catch (JsonException ex)
        {
            throw new ExternalProviderException(ProviderName, response.StatusCode, "Invalid JSON payload returned from IGDB.", ex);
        }
    }
}