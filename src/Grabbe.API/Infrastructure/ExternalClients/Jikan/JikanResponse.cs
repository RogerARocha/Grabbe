using System.Text.Json.Serialization;

namespace Grabbe.API.Infrastructure.ExternalClients.Jikan;

public class JikanSearchResponse
{
    [JsonPropertyName("data")]
    public List<JikanAnimeData>? Data { get; set; }
}

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

    [JsonPropertyName("aired")]
    public JikanAired? Aired { get; set; }

    [JsonPropertyName("genres")]
    public List<JikanGenre> Genres { get; set; } = new();
}

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