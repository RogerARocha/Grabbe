namespace Grabbe.API.Infrastructure.Configuration;

public class ExternalApiOptions
{
    public const string SectionName = "ExternalApis";

    public string TmdbApiKey { get; set; } = string.Empty;
    public string GBooksApiKey { get; set; } = string.Empty;
}