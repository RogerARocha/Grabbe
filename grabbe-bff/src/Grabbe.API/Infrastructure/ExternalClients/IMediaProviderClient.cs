using Grabbe.API.Domain.DTOs;

namespace Grabbe.API.Infrastructure.ExternalClients;

public interface IMediaProviderClient
{
    string ProviderName { get; }

    string[] SupportedTypes { get; }

    // método principal para a barra de pesquisa
    Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type);

    // método para quando o usuário clicar na obra para ver mais detalhes
    Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type);
}