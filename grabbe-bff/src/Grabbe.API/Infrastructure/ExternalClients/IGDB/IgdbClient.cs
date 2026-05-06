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
    private readonly string _accessToken;

    public string ProviderName => "IGDB";
    public string[] SupportedTypes => new[] { "GAME" };

    public IgdbClient(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://api.igdb.com/v4/");
        
        _clientId = config["IGDB:ClientId"] ?? throw new ArgumentNullException("IGDB:ClientId");
        _accessToken = config["IGDB:AccessToken"] ?? throw new ArgumentNullException("IGDB:AccessToken");
    }

    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        if (!SupportedTypes.Contains(type, StringComparer.OrdinalIgnoreCase))
            return Enumerable.Empty<GrabbeMediaDTO>();

        var apicalypseQuery = $@"
            search ""{query}"";
            fields name, summary, first_release_date, 
                   cover.image_id, genres.name, rating, alternative_names.name,
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
        if (!SupportedTypes.Contains(type, StringComparer.OrdinalIgnoreCase) || !int.TryParse(externalId, out int id))
            return null;

        var apicalypseQuery = $@"
            fields name, summary, first_release_date, 
                   cover.image_id, genres.name, rating, alternative_names.name,
                   involved_companies.developer, involved_companies.publisher, involved_companies.company.name;
            where id = {id};
        ";

        var games = await ExecuteIgdbQueryAsync(apicalypseQuery);
        
        var game = games?.FirstOrDefault();
        
        return game != null ? IgdbMapper.ToUniversalDto(game) : null;
    }

    // ── Helper centralizado para as chamadas HTTP ──
    private async Task<List<IgdbGameResponse>?> ExecuteIgdbQueryAsync(string query)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "games")
        {
            Content = new StringContent(query, Encoding.UTF8, "text/plain")
        };

        request.Headers.Add("Client-ID", _clientId);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);

        var response = await _httpClient.SendAsync(request);
        
        if (!response.IsSuccessStatusCode)
        {
            // Logar o erro aqui se necessário
            return null;
        }

        var contentStream = await response.Content.ReadAsStreamAsync();
        return await JsonSerializer.DeserializeAsync<List<IgdbGameResponse>>(contentStream);
    }
}