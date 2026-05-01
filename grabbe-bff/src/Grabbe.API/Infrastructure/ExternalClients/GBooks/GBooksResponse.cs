using System.Text.Json.Serialization;

namespace Grabbe.API.Infrastructure.ExternalClients.GBooks;

// ==================== SEARCH RESPONSE ====================

public class GoogleBooksSearchResponse
{
    [JsonPropertyName("items")]
    public List<GoogleBooksItem>? Items { get; set; }
}

// ==================== ITEM ====================

public class GoogleBooksItem
{
    // O ID do Google Books já é uma string (ex: "zyTCAlFPjgYC")
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("volumeInfo")]
    public GoogleBooksVolumeInfo? VolumeInfo { get; set; }
}

// ==================== VOLUME INFO ====================

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

// ==================== SUB-MODELS ====================

public class GoogleBooksImageLinks
{
    [JsonPropertyName("thumbnail")]
    public string? Thumbnail { get; set; }
}