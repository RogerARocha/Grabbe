using System.Net;

namespace Grabbe.API.Infrastructure.ExternalClients;

/// <summary>
/// Exception thrown when an external media provider (e.g. Jikan, TMDB, IGDB, GBooks) returns an error status code,
/// transient upstream exception, or fails to respond.
/// </summary>
public class ExternalProviderException : Exception
{
    /// <summary>
    /// The name of the external provider (e.g. "JIKAN", "TMDB").
    /// </summary>
    public string ProviderName { get; }

    /// <summary>
    /// The HTTP status code returned by the provider, if available.
    /// </summary>
    public HttpStatusCode? StatusCode { get; }

    public ExternalProviderException(string providerName, HttpStatusCode? statusCode, string message, Exception? innerException = null)
        : base($"{providerName} API error (Status: {statusCode}): {message}", innerException)
    {
        ProviderName = providerName;
        StatusCode = statusCode;
    }
}
