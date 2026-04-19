using System.Text.Json.Serialization;

namespace Grabbe.API.Infrastructure.ExternalClients.GBooks;

public class GoogleBooksSearchResponse
{
    [JsonPropertyName("items")]
    public List<GoogleBooksItem>? Items { get; set; }
}

public class GoogleBooksItem
{
    // O ID do Google Books já é uma string (ex: "zyTCAlFPjgYC")
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
}

public class GoogleBooksImageLinks
{
    [JsonPropertyName("thumbnail")]
    public string? Thumbnail { get; set; }
}