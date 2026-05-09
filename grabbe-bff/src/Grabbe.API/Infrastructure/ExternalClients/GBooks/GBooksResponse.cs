using System.Text.Json.Serialization;

namespace Grabbe.API.Infrastructure.ExternalClients.GBooks;

public class GoogleBooksSearchResponse
{
    [JsonPropertyName("items")]
    public List<GoogleBooksItem>? Items { get; set; }
}


public class GoogleBooksItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("volumeInfo")]
    public GoogleBooksVolumeInfo? VolumeInfo { get; set; }
}

public class GoogleBooksVolumeInfo
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("pageCount")]
    public int? PageCount { get; set; }

    [JsonPropertyName("publishedDate")]
    public string? PublishedDate { get; set; }

    [JsonPropertyName("imageLinks")]
    public GoogleBooksImageLinks? ImageLinks { get; set; }

    [JsonPropertyName("categories")]
    public List<string>? Categories { get; set; }

    [JsonPropertyName("averageRating")]
    public double? AverageRating { get; set; }

    [JsonPropertyName("publisher")]
    public string? Publisher { get; set; }

    [JsonPropertyName("authors")]
    public List<string>? Authors { get; set; }

    [JsonPropertyName("language")]
    public string? Language { get; set; }
}

public class GoogleBooksImageLinks
{
    [JsonPropertyName("thumbnail")]
    public string? Thumbnail { get; set; }
}