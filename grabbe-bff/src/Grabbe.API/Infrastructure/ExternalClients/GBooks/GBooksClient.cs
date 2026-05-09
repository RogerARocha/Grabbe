using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.Configuration;
using Grabbe.API.Infrastructure.ExternalClients.GBooks;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;

namespace Grabbe.API.Infrastructure.ExternalClients;

/// <summary>
/// <see cref="IMediaProviderClient"/> implementation for the Google Books API.
/// The API key is appended as a query parameter on each request, as the Google Books API
/// does not support header-based authentication for public volume endpoints.
/// </summary>
public class GoogleBooksClient : IMediaProviderClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    /// <inheritdoc/>
    public string ProviderName => "GBOOKS";

    /// <inheritdoc/>
    public string[] SupportedTypes => new[] { "BOOK" };

    public GoogleBooksClient(HttpClient httpClient, IOptions<ExternalApiOptions> options)
    {
        _httpClient = httpClient;
        _apiKey = options.Value.GBooksApiKey;
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        try
        {
            var endpoint = $"volumes?q={Uri.EscapeDataString(query)}&key={_apiKey}&maxResults=10";

            var response = await _httpClient.GetFromJsonAsync<GoogleBooksSearchResponse>(endpoint);

            if (response?.Items == null) return Array.Empty<GrabbeMediaDTO>();

            return response.Items
                .Where(item => item.VolumeInfo != null)
                .Select(item => item.ToUniversalDto());
        }
        catch (HttpRequestException)
        {
            return Array.Empty<GrabbeMediaDTO>();
        }
    }

    /// <inheritdoc/>
    public async Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type)
    {
        try
        {
            var endpoint = $"volumes/{Uri.EscapeDataString(externalId)}?key={_apiKey}";

            var item = await _httpClient.GetFromJsonAsync<GoogleBooksItem>(endpoint);

            if (item?.VolumeInfo == null) return null;

            return item.ToUniversalDto();
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }
}