using System.Text.Json.Serialization;

namespace Grabbe.API.Infrastructure.ExternalClients.IGDB;

public record IgdbGameResponse(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("summary")] string Summary,
    [property: JsonPropertyName("first_release_date")] long? FirstReleaseDate,
    [property: JsonPropertyName("cover")] IgdbCover? Cover,
    [property: JsonPropertyName("genres")] List<IgdbGenre>? Genres,
    [property: JsonPropertyName("involved_companies")] List<IgdbInvolvedCompany>? InvolvedCompanies,
    [property: JsonPropertyName("rating")] double? Rating,
    [property: JsonPropertyName("alternative_names")] List<IgdbAlternativeName>? AlternativeNames
);

public record IgdbCover([property: JsonPropertyName("url")] string Url);
public record IgdbGenre([property: JsonPropertyName("name")] string Name);
public record IgdbAlternativeName([property: JsonPropertyName("name")] string Name);

public record IgdbInvolvedCompany(
    [property: JsonPropertyName("developer")] bool Developer,
    [property: JsonPropertyName("publisher")] bool Publisher,
    [property: JsonPropertyName("company")] IgdbCompany? Company
);

public record IgdbCompany([property: JsonPropertyName("name")] string Name);