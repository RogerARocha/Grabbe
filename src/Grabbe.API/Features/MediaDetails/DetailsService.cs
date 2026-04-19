using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.ExternalClients;

namespace Grabbe.API.Features.MediaDetails;

public class DetailsService
{
    private readonly IEnumerable<IMediaProviderClient> _clients;

    public DetailsService(IEnumerable<IMediaProviderClient> clients)
    {
        _clients = clients;
    }

    public async Task<GrabbeMediaDTO?> GetMediaDetailsAsync(string sourceApi, string type, string externalId)
    {
        // Procura na lista de clientes injetados qual deles tem o nome correspondente (ex: "TMDB")
        var targetClient = _clients.FirstOrDefault(c => 
            c.ProviderName.Equals(sourceApi, StringComparison.OrdinalIgnoreCase));

        if (targetClient == null)
        {
            return null; // Provedor não encontrado
        }

        // Chama o método profundo apenas do cliente correto
        return await targetClient.GetDetailsAsync(externalId, type.ToUpper());
    }
}