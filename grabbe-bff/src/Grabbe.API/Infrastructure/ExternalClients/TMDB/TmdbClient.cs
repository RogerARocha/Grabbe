using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.Configuration;
using System.Net.Http.Headers;
using Grabbe.API.Infrastructure.ExternalClients.TMDB;

namespace Grabbe.API.Infrastructure.ExternalClients;

/// <summary>
/// <see cref="IMediaProviderClient"/> implementation for The Movie Database (TMDB) API.
/// Handles movies and TV series. Authenticated via Bearer token in the Authorization header.
/// </summary>
public class TmdbClient : IMediaProviderClient
{
    private readonly HttpClient _httpClient;
    private readonly AppSettingsService _appSettingsService;

    /// <inheritdoc/>
    public string ProviderName => "TMDB";

    /// <inheritdoc/>
    public string[] SupportedTypes => new[] { "MOVIE", "SERIES" };

    public TmdbClient(HttpClient httpClient, AppSettingsService appSettingsService)
    {
        _httpClient = httpClient;
        _appSettingsService = appSettingsService;
    }

    private void EnsureAuthorizationHeader()
    {
        var apiKey = _appSettingsService.GetSetting("TMDB_API_KEY");
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey ?? string.Empty);
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        try
        {
            EnsureAuthorizationHeader();
            var endpoint = type == "SERIES" ? "search/tv" : "search/movie";

            var response = await _httpClient.GetFromJsonAsync<TmdbSearchResponse>(
                $"{endpoint}?query={Uri.EscapeDataString(query)}&language=en&page=1");

            if (response?.Results == null) return Array.Empty<GrabbeMediaDTO>();

            // Exclude Japanese-language animation (genre 16) from TMDB results.
            // These are anime titles that would be duplicated by the dedicated Jikan client.
            return response.Results
                .Where(media => !media.Adult) // Exclude adult content
                .Where(media => !(media.OriginalLanguage == "ja" && media.GenreIds.Contains(16)))
                .Select(media => media.ToSearchDto(type));
        }
        catch (HttpRequestException)
        {
            return Array.Empty<GrabbeMediaDTO>();
        }
    }

    /// <inheritdoc/>
    public async Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type)
    {
        return await RetryHelper.ExecuteWithRetryAsync(
            async () => await FetchDetailsAsync(externalId, type),
            maxRetries: 3,
            delayMilliseconds: 1000,
            shouldRetry: ex => ex is ExternalProviderException pEx && (pEx.StatusCode == null || pEx.StatusCode == System.Net.HttpStatusCode.TooManyRequests || (int)pEx.StatusCode >= 500)
        );
    }

    private async Task<GrabbeMediaDTO?> FetchDetailsAsync(string externalId, string type)
    {
        try
        {
            EnsureAuthorizationHeader();
            var endpoint = type == "SERIES" ? $"tv/{externalId}" : $"movie/{externalId}";

            var response = await _httpClient.GetFromJsonAsync<TmdbDetailResponse>(
                $"{endpoint}?language=en&append_to_response=credits,alternative_titles");

            if (response == null)
            {
                throw new ExternalProviderException(ProviderName, null, "TMDB returned an empty details payload.");
            }

            if (response.Adult)
            {
                return null; // Excluded adult content
            }

            return response.ToUniversalDto(type);
        }
        catch (HttpRequestException ex)
        {
            if (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }
            throw new ExternalProviderException(ProviderName, ex.StatusCode, "TMDB request failed.", ex);
        }
    }
}