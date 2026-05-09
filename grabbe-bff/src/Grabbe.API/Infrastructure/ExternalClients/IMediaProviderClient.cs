using Grabbe.API.Domain.DTOs;

namespace Grabbe.API.Infrastructure.ExternalClients;

/// <summary>
/// Defines the contract for all external media provider integrations.
/// Each implementation encapsulates the HTTP communication and data mapping
/// for a specific third-party API (e.g., TMDB, Jikan, Google Books).
/// </summary>
public interface IMediaProviderClient
{
    /// <summary>The unique name identifying this provider (e.g., "TMDB", "JIKAN", "GBOOKS").</summary>
    string ProviderName { get; }

    /// <summary>The set of media types this provider can serve (e.g., ["MOVIE", "SERIES"]).</summary>
    string[] SupportedTypes { get; }

    /// <summary>
    /// Searches for media matching the given query string.
    /// </summary>
    /// <param name="query">The user's search term.</param>
    /// <param name="type">The normalized media type filter (e.g., "MOVIE"). Pass empty string for all types.</param>
    /// <returns>A collection of normalized <see cref="GrabbeMediaDTO"/> results.</returns>
    Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type);

    /// <summary>
    /// Fetches the full details for a specific media item.
    /// </summary>
    /// <param name="externalId">The provider-specific unique identifier for the media.</param>
    /// <param name="type">The normalized media type (e.g., "ANIME").</param>
    /// <returns>A fully-populated <see cref="GrabbeMediaDTO"/>, or <c>null</c> if not found.</returns>
    Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type);
}