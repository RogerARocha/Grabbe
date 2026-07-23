using System.Net;
using System.Text;
using System.Text.Json;
using Grabbe.API.Domain.DTOs;

namespace Grabbe.API.Infrastructure.ExternalClients.AniList;

/// <summary>
/// <see cref="IMediaProviderClient"/> implementation for AniList GraphQL API.
/// Serves both Anime and Manga metadata with high performance and rate limit stability.
/// Also supports transparent lookup of legacy MyAnimeList IDs via <c>idMal</c>.
/// </summary>
public class AniListClient : IMediaProviderClient
{
    private readonly HttpClient _httpClient;

    /// <inheritdoc/>
    public string ProviderName => "ANILIST";

    /// <inheritdoc/>
    public string[] SupportedTypes => new[] { "ANIME", "MANGA" };

    private const string SearchQuery = @"
query ($search: String, $type: MediaType) {
  Page(page: 1, perPage: 15) {
    media(search: $search, type: $type, isAdult: false) {
      id
      idMal
      title { userPreferred english romaji native }
      type
      format
      status
      description
      startDate { year }
      episodes
      chapters
      volumes
      duration
      coverImage { extraLarge large medium }
      genres
      averageScore
      studios(isMain: true) { nodes { name } }
      staff(sort: [RELEVANCE], perPage: 5) {
        edges { role node { name { full } } }
      }
      isAdult
    }
  }
}";

    private const string DetailByIdQuery = @"
query ($id: Int, $type: MediaType) {
  Media(id: $id, type: $type) {
    id
    idMal
    title { userPreferred english romaji native }
    type
    format
    status
    description
    startDate { year }
    episodes
    chapters
    volumes
    duration
    coverImage { extraLarge large medium }
    genres
    averageScore
    studios(isMain: true) { nodes { name } }
    staff(sort: [RELEVANCE], perPage: 5) {
      edges { role node { name { full } } }
    }
    isAdult
  }
}";

    private const string DetailByIdMalQuery = @"
query ($idMal: Int, $type: MediaType) {
  Media(idMal: $idMal, type: $type) {
    id
    idMal
    title { userPreferred english romaji native }
    type
    format
    status
    description
    startDate { year }
    episodes
    chapters
    volumes
    duration
    coverImage { extraLarge large medium }
    genres
    averageScore
    studios(isMain: true) { nodes { name } }
    staff(sort: [RELEVANCE], perPage: 5) {
      edges { role node { name { full } } }
    }
    isAdult
  }
}";

    public AniListClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://graphql.anilist.co");
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Array.Empty<GrabbeMediaDTO>();
        }

        try
        {
            return await RetryHelper.ExecuteWithRetryAsync(
                async () => await FetchSearchAsync(query, type),
                maxRetries: 3,
                delayMilliseconds: 500,
                shouldRetry: IsTransientFailure
            );
        }
        catch (Exception)
        {
            // For search operations, return empty list gracefully rather than failing caller
            return Array.Empty<GrabbeMediaDTO>();
        }
    }

    /// <inheritdoc/>
    public async Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type)
    {
        if (!int.TryParse(externalId, out int id))
        {
            return null;
        }

        try
        {
            return await RetryHelper.ExecuteWithRetryAsync(
                async () => await FetchDetailsAsync(id, type),
                maxRetries: 3,
                delayMilliseconds: 500,
                shouldRetry: IsTransientFailure
            );
        }
        catch (Exception)
        {
            return null;
        }
    }

    private async Task<IEnumerable<GrabbeMediaDTO>> FetchSearchAsync(string query, string type)
    {
        var mediaType = NormalizeMediaType(type);
        var variables = new Dictionary<string, object?>
        {
            { "search", query }
        };

        if (mediaType != null)
        {
            variables["type"] = mediaType;
        }

        var requestBody = new
        {
            query = SearchQuery,
            variables
        };

        var responseContainer = await PostGraphQLAsync<AniListSearchDataContainer>(requestBody);
        var mediaList = responseContainer?.Data?.Page?.Media;

        if (mediaList == null || !mediaList.Any())
        {
            return Array.Empty<GrabbeMediaDTO>();
        }

        return mediaList
            .Where(item => item.IsAdult != true)
            .Select(item => item.ToUniversalDto(type));
    }

    private async Task<GrabbeMediaDTO?> FetchDetailsAsync(int id, string type)
    {
        var mediaType = NormalizeMediaType(type);

        // 1. Try querying by native AniList ID first
        var byIdVariables = new Dictionary<string, object?> { { "id", id } };
        if (mediaType != null) byIdVariables["type"] = mediaType;

        var byIdBody = new { query = DetailByIdQuery, variables = byIdVariables };
        var byIdResponse = await PostGraphQLAsync<AniListDetailDataContainer>(byIdBody);

        var media = byIdResponse?.Data?.Media;

        // 2. If not found by native AniList ID, try querying by MyAnimeList ID (idMal)
        if (media == null)
        {
            var byIdMalVariables = new Dictionary<string, object?> { { "idMal", id } };
            if (mediaType != null) byIdMalVariables["type"] = mediaType;

            var byIdMalBody = new { query = DetailByIdMalQuery, variables = byIdMalVariables };
            var byIdMalResponse = await PostGraphQLAsync<AniListDetailDataContainer>(byIdMalBody);

            media = byIdMalResponse?.Data?.Media;
        }

        if (media == null || media.IsAdult == true)
        {
            return null;
        }

        return media.ToUniversalDto(type);
    }

    private async Task<AniListGraphQLResponse<T>?> PostGraphQLAsync<T>(object payload)
    {
        var jsonContent = JsonSerializer.Serialize(payload);
        using var request = new HttpRequestMessage(HttpMethod.Post, "")
        {
            Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
        };

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request);
        }
        catch (HttpRequestException ex)
        {
            throw new ExternalProviderException(ProviderName, null, "Failed to connect to the AniList GraphQL API server.", ex);
        }

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new ExternalProviderException(ProviderName, response.StatusCode, $"AniList request failed with status {response.StatusCode}.");
        }

        var content = await response.Content.ReadAsStringAsync();
        try
        {
            return JsonSerializer.Deserialize<AniListGraphQLResponse<T>>(content);
        }
        catch (JsonException ex)
        {
            throw new ExternalProviderException(ProviderName, response.StatusCode, "Invalid JSON response payload returned from AniList API.", ex);
        }
    }

    private static string? NormalizeMediaType(string type)
    {
        if (string.IsNullOrWhiteSpace(type)) return null;
        if (type.Equals("MANGA", StringComparison.OrdinalIgnoreCase)) return "MANGA";
        if (type.Equals("ANIME", StringComparison.OrdinalIgnoreCase)) return "ANIME";
        return null;
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
}
