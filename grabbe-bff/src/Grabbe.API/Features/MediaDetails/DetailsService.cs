using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.ExternalClients;

namespace Grabbe.API.Features.MediaDetails;

/// <summary>
/// Resolves media detail requests to the correct external provider using a Strategy pattern.
/// At runtime, it selects the matching <see cref="IMediaProviderClient"/> implementation
/// from the DI-injected collection based on the caller-supplied <c>sourceApi</c> name.
/// </summary>
public class DetailsService
{
    private readonly IEnumerable<IMediaProviderClient> _clients;

    public DetailsService(IEnumerable<IMediaProviderClient> clients)
    {
        _clients = clients;
    }

    /// <summary>
    /// Dispatches a detail fetch to the provider that matches the given <paramref name="sourceApi"/> name.
    /// </summary>
    /// <param name="sourceApi">The provider name used to select the correct client (e.g., "TMDB").</param>
    /// <param name="type">The normalized media type passed through to the client (e.g., "SERIES").</param>
    /// <param name="externalId">The provider-specific unique identifier for the media item.</param>
    /// <returns>The populated <see cref="GrabbeMediaDTO"/>, or <c>null</c> if the provider is unrecognized or the item is not found.</returns>
    public async Task<GrabbeMediaDTO?> GetMediaDetailsAsync(string sourceApi, string type, string externalId)
    {
        var targetClient = _clients.FirstOrDefault(c =>
            c.ProviderName.Equals(sourceApi, StringComparison.OrdinalIgnoreCase));

        if (targetClient == null)
        {
            return null;
        }

        return await targetClient.GetDetailsAsync(externalId, type.ToUpper());
    }
}