using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.ExternalClients;

namespace Grabbe.API.Features.MediaSearch;

public class SearchAggregationService
{
    private readonly IEnumerable<IMediaProviderClient> _clients;

    public SearchAggregationService(IEnumerable<IMediaProviderClient> clients)
    {
        _clients = clients;
    }

    public async Task<IEnumerable<GrabbeMediaDTO>> SearchGlobalAsync(string query)
    {
        var searchTasks = _clients.Select(client => client.SearchAsync(query, string.Empty));
        
        var resultsArray = await Task.WhenAll(searchTasks);
        
        var unifiedResults = resultsArray.SelectMany(result => result).ToList();
        
        return unifiedResults;
    }

    public async Task<IEnumerable<GrabbeMediaDTO>> SearchByTypeAsync(string query, string type)
    {
        var normalizedType = type.ToUpper();
        
        // Encontra os provedores que suportam esse tipo de mídia (ex: "ANIME" -> Jikan)
        var validClients = _clients.Where(c => c.SupportedTypes.Contains(normalizedType));

        var searchTasks = validClients.Select(client => client.SearchAsync(query, normalizedType));
        var resultsArray = await Task.WhenAll(searchTasks);
        
        return resultsArray.SelectMany(result => result).ToList();
    }
}