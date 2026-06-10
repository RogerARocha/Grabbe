using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.ExternalClients.Jikan;
using System.Net;
using System.Text.Json;

namespace Grabbe.API.Infrastructure.ExternalClients;

/// <summary>
/// <see cref="IMediaProviderClient"/> implementation for the Jikan API (unofficial MyAnimeList client).
/// Handles anime and manga. No authentication is required by the Jikan API.
/// </summary>
public class JikanClient : IMediaProviderClient
{
    private readonly HttpClient _httpClient;

    /// <inheritdoc/>
    public string ProviderName => "JIKAN";

    /// <inheritdoc/>
    public string[] SupportedTypes => new[] { "ANIME", "MANGA" };

    public JikanClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://api.jikan.moe/v4/");
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        var isManga = type == "MANGA";
        var endpoint = isManga ? "manga" : "anime";
        var url = $"{endpoint}?q={Uri.EscapeDataString(query)}";

        try
        {
            return await RetryHelper.ExecuteWithRetryAsync(
                async () => await FetchSearchAsync(url, isManga),
                maxRetries: 3,
                delayMilliseconds: 1000,
                shouldRetry: IsTransientFailure
            );
        }
        catch (ExternalProviderException)
        {
            // For searches, we gracefully return empty results rather than failing the whole flow
            return Array.Empty<GrabbeMediaDTO>();
        }
        catch (Exception)
        {
            return Array.Empty<GrabbeMediaDTO>();
        }
    }

    /// <inheritdoc/>
    public async Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type)
    {
        var isManga = type == "MANGA";
        var endpoint = isManga ? $"manga/{externalId}" : $"anime/{externalId}";

        return await RetryHelper.ExecuteWithRetryAsync(
            async () => await FetchDetailsAsync(endpoint, isManga),
            maxRetries: 3,
            delayMilliseconds: 1000,
            shouldRetry: IsTransientFailure
        );
    }

    private async Task<IEnumerable<GrabbeMediaDTO>> FetchSearchAsync(string url, bool isManga)
    {
        HttpResponseMessage response;
        try
        {
            response = await _httpClient.GetAsync(url);
        }
        catch (HttpRequestException ex)
        {
            throw new ExternalProviderException(ProviderName, null, "Failed to connect to the Jikan API server.", ex);
        }

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return Array.Empty<GrabbeMediaDTO>();
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new ExternalProviderException(ProviderName, response.StatusCode, $"Jikan search request failed with status {response.StatusCode}.");
        }

        var content = await response.Content.ReadAsStringAsync();
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        JikanSearchResponse? searchResponse;

        try
        {
            searchResponse = JsonSerializer.Deserialize<JikanSearchResponse>(content, options);
        }
        catch (JsonException ex)
        {
            throw new ExternalProviderException(ProviderName, response.StatusCode, "Invalid JSON payload returned from Jikan search.", ex);
        }

        if (searchResponse != null)
        {
            if (searchResponse.Status.HasValue && searchResponse.Status.Value != 200 && searchResponse.Status.Value != 201)
            {
                var statusCode = (HttpStatusCode)searchResponse.Status.Value;
                var errorMsg = searchResponse.Message ?? searchResponse.Error ?? "Jikan internal search API error";
                throw new ExternalProviderException(ProviderName, statusCode, $"Upstream search error inside JSON body: {errorMsg}");
            }
        }

        if (searchResponse?.Data == null)
        {
            return Array.Empty<GrabbeMediaDTO>();
        }

        return searchResponse.Data
            .Where(item => !IsExplicit(item))
            .Select(item => item.ToUniversalDto(isManga));
    }

    private async Task<GrabbeMediaDTO?> FetchDetailsAsync(string url, bool isManga)
    {
        HttpResponseMessage response;
        try
        {
            response = await _httpClient.GetAsync(url);
        }
        catch (HttpRequestException ex)
        {
            throw new ExternalProviderException(ProviderName, null, "Failed to connect to the Jikan API server.", ex);
        }

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new ExternalProviderException(ProviderName, response.StatusCode, $"Jikan detail request failed with status {response.StatusCode}.");
        }

        var content = await response.Content.ReadAsStringAsync();
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        JikanDetailResponse? detailResponse;

        try
        {
            detailResponse = JsonSerializer.Deserialize<JikanDetailResponse>(content, options);
        }
        catch (JsonException ex)
        {
            throw new ExternalProviderException(ProviderName, response.StatusCode, "Invalid JSON payload returned from Jikan detail.", ex);
        }

        if (detailResponse != null)
        {
            if (detailResponse.Status.HasValue && detailResponse.Status.Value != 200 && detailResponse.Status.Value != 201)
            {
                var statusCode = (HttpStatusCode)detailResponse.Status.Value;
                var errorMsg = detailResponse.Message ?? detailResponse.Error ?? "Jikan internal detail API error";
                throw new ExternalProviderException(ProviderName, statusCode, $"Upstream detail error inside JSON body: {errorMsg}");
            }
        }

        if (detailResponse?.Data == null)
        {
            throw new ExternalProviderException(ProviderName, response.StatusCode, "Jikan returned an empty details payload without error details.");
        }

        if (IsExplicit(detailResponse.Data))
        {
            return null; // Excluded explicit content
        }

        return detailResponse.Data.ToUniversalDto(isManga);
    }

    private static bool IsTransientFailure(Exception ex)
    {
        if (ex is ExternalProviderException providerEx)
        {
            return providerEx.StatusCode == null ||
                   providerEx.StatusCode == HttpStatusCode.TooManyRequests ||
                   ((int)providerEx.StatusCode >= 500 && (int)providerEx.StatusCode <= 599);
        }
        return false;
    }

    private static bool IsExplicit(JikanAnimeData item)
    {
        if (item.Genres == null) return false;
        return item.Genres.Any(g => 
            g.Name.Contains("hentai", StringComparison.OrdinalIgnoreCase) || 
            g.Name.Contains("pornograph", StringComparison.OrdinalIgnoreCase) ||
            g.Name.Contains("erotica", StringComparison.OrdinalIgnoreCase)
        );
    }
}