using System.Text.Json;
using System.Text.Json.Serialization;

namespace Grabbe.API.Infrastructure.ExternalClients.OpenLibrary;

/// <summary>
/// Model representing the root JSON response from the Open Library Search API.
/// </summary>
public class OpenLibrarySearchResponse
{
    [JsonPropertyName("docs")]
    public List<OpenLibrarySearchDoc>? Docs { get; set; }
}

/// <summary>
/// Model representing a single book document item returned in search queries.
/// </summary>
public class OpenLibrarySearchDoc
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("author_name")]
    public List<string>? AuthorName { get; set; }

    [JsonPropertyName("first_publish_year")]
    public int? FirstPublishYear { get; set; }

    [JsonPropertyName("number_of_pages_median")]
    public int? NumberOfPagesMedian { get; set; }

    [JsonPropertyName("cover_i")]
    public long? CoverI { get; set; }

    [JsonPropertyName("publisher")]
    public List<string>? Publisher { get; set; }

    [JsonPropertyName("ratings_average")]
    public double? RatingsAverage { get; set; }

    [JsonPropertyName("language")]
    public List<string>? Language { get; set; }
}

/// <summary>
/// Model representing a single Work resource returned from the Open Library Works API.
/// </summary>
public class OpenLibraryWorkResponse
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public JsonElement? Description { get; set; }

    [JsonPropertyName("covers")]
    public List<long>? Covers { get; set; }

    [JsonPropertyName("first_publish_date")]
    public string? FirstPublishDate { get; set; }

    [JsonPropertyName("subjects")]
    public List<string>? Subjects { get; set; }

    [JsonPropertyName("authors")]
    public List<OpenLibraryWorkAuthorLink>? Authors { get; set; }
}

/// <summary>
/// Model representing an author link structure within a Work details response.
/// </summary>
public class OpenLibraryWorkAuthorLink
{
    [JsonPropertyName("author")]
    public OpenLibraryAuthorKey? Author { get; set; }
}

/// <summary>
/// Model representing the author identifier object.
/// </summary>
public class OpenLibraryAuthorKey
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;
}

/// <summary>
/// Model representing the author response returned from the Open Library Author API.
/// </summary>
public class OpenLibraryAuthorResponse
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}
