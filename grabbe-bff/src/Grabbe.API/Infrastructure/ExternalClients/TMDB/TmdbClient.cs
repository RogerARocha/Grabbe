using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.Configuration;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using Grabbe.API.Infrastructure.ExternalClients.TMDB;

namespace Grabbe.API.Infrastructure.ExternalClients;

public class TmdbClient : IMediaProviderClient
{
    private readonly HttpClient _httpClient;

    public string ProviderName => "TMDB";
    public string[] SupportedTypes => new[] { "MOVIE", "SERIES" };

    public TmdbClient(HttpClient httpClient, IOptions<ExternalApiOptions> options)
    {
        _httpClient = httpClient;
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", options.Value.TmdbApiKey);
    }

    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        try
        {
            var endpoint = type == "SERIES" ? "search/tv" : "search/movie";

            var response = await _httpClient.GetFromJsonAsync<TmdbSearchResponse>(
                $"{endpoint}?query={Uri.EscapeDataString(query)}&language=en&page=1");

            if (response?.Results == null) return Array.Empty<GrabbeMediaDTO>();

            return response.Results
                .Where(media => !(media.OriginalLanguage == "ja" && media.GenreIds.Contains(16)))
                .Select(media => media.ToSearchDto(type));
        }
        catch (HttpRequestException)
        {
            return Array.Empty<GrabbeMediaDTO>();
        }
    }

    public async Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type)
    {
        try
        {
            var endpoint = type == "SERIES" ? $"tv/{externalId}" : $"movie/{externalId}";

            var response = await _httpClient.GetFromJsonAsync<TmdbDetailResponse>(
                $"{endpoint}?language=en&append_to_response=credits,alternative_titles");

            return response?.ToUniversalDto(type);
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }
}