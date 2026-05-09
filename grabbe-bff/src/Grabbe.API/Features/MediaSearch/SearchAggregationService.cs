using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.ExternalClients;

namespace Grabbe.API.Features.MediaSearch;

/// <summary>
/// Orchestrates search requests across all registered media providers using a Scatter-Gather pattern.
/// All provider calls are issued in parallel via <c>Task.WhenAll</c> and the results
/// are merged into a single unified collection before being returned to the controller.
/// </summary>
public class SearchAggregationService
{
    private readonly IEnumerable<IMediaProviderClient> _clients;

    public SearchAggregationService(IEnumerable<IMediaProviderClient> clients)
    {
        _clients = clients;
    }

    /// <summary>
    /// Fans out a search query to all registered providers simultaneously and aggregates the results.
    /// </summary>
    /// <param name="query">The user's search term.</param>
    /// <returns>A merged, unordered collection of results from all providers.</returns>
    public async Task<IEnumerable<GrabbeMediaDTO>> SearchGlobalAsync(string query)
    {
        var searchTasks = _clients.Select(client => client.SearchAsync(query, string.Empty));
        var resultsArray = await Task.WhenAll(searchTasks);
        return resultsArray.SelectMany(result => result).ToList();
    }

    /// <summary>
    /// Routes a search query only to providers that support the specified media type,
    /// avoiding unnecessary network calls to irrelevant providers (e.g., skips Jikan for "MOVIE").
    /// </summary>
    /// <param name="query">The user's search term.</param>
    /// <param name="type">The normalized media type filter (e.g., "ANIME", "BOOK").</param>
    /// <returns>A merged collection of results from all compatible providers.</returns>
    public async Task<IEnumerable<GrabbeMediaDTO>> SearchByTypeAsync(string query, string type)
    {
        var normalizedType = type.ToUpper();
        var validClients = _clients.Where(c => c.SupportedTypes.Contains(normalizedType));

        var searchTasks = validClients.Select(client => client.SearchAsync(query, normalizedType));
        var resultsArray = await Task.WhenAll(searchTasks);

        return resultsArray.SelectMany(result => result).ToList();
    }
}