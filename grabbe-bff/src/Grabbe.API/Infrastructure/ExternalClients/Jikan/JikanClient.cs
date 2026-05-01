using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.ExternalClients.Jikan;
using System.Net.Http.Json;

namespace Grabbe.API.Infrastructure.ExternalClients;

public class JikanClient : IMediaProviderClient
{
    private readonly HttpClient _httpClient;

    public string ProviderName => "JIKAN";
    public string[] SupportedTypes => new[] { "ANIME", "MANGA" };

    public JikanClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        try
        {
            var isManga = type == "MANGA";
            var endpoint = isManga ? "manga" : "anime";

            var response = await _httpClient.GetFromJsonAsync<JikanSearchResponse>(
                $"{endpoint}?q={Uri.EscapeDataString(query)}");

            if (response?.Data == null) return Array.Empty<GrabbeMediaDTO>();

            return response.Data.Select(item => item.ToUniversalDto(isManga));
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
            var isManga = type == "MANGA";
            var endpoint = isManga ? $"manga/{externalId}" : $"anime/{externalId}";

            var response = await _httpClient.GetFromJsonAsync<JikanDetailResponse>(endpoint);

            return response?.Data?.ToUniversalDto(isManga);
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }
}