using System.Text.Json.Serialization;

namespace Grabbe.API.Infrastructure.ExternalClients.Jikan;

// ==================== SEARCH / DETAIL RESPONSES ====================

public class JikanSearchResponse
{
    [JsonPropertyName("data")]
    public List<JikanAnimeData>? Data { get; set; }
}

public class JikanDetailResponse
{
    [JsonPropertyName("data")]
    public JikanAnimeData? Data { get; set; }
}

// ==================== CORE DATA MODEL ====================

public class JikanAnimeData
{
    [JsonPropertyName("mal_id")]
    public int MalId { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("synopsis")]
    public string? Synopsis { get; set; }

    [JsonPropertyName("images")]
    public JikanImages? Images { get; set; }

    [JsonPropertyName("episodes")]
    public int? Episodes { get; set; }

    [JsonPropertyName("chapters")]
    public int? Chapters { get; set; }

    [JsonPropertyName("aired")]
    public JikanAired? Aired { get; set; }

    [JsonPropertyName("published")]
    public JikanAired? Published { get; set; }

    [JsonPropertyName("genres")]
    public List<JikanGenre> Genres { get; set; } = new();

    [JsonPropertyName("score")]
    public double? Score { get; set; }

    [JsonPropertyName("studios")]
    public List<JikanNamedEntry>? Studios { get; set; }

    [JsonPropertyName("serializations")]
    public List<JikanNamedEntry>? Serializations { get; set; }

    [JsonPropertyName("duration")]
    public string? Duration { get; set; }

    [JsonPropertyName("titles")]
    public List<JikanTitle>? Titles { get; set; }
}

// ==================== SUB-MODELS ====================

public class JikanImages
{
    [JsonPropertyName("jpg")]
    public JikanJpg? Jpg { get; set; }
}

public class JikanJpg
{
    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }
}

public class JikanAired
{
    [JsonPropertyName("from")]
    public DateTime? From { get; set; }
}

public class JikanGenre
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class JikanNamedEntry
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class JikanTitle
{
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
}