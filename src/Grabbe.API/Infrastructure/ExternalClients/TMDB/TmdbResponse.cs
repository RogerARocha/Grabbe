using System.Text.Json.Serialization;

namespace Grabbe.API.Infrastructure.ExternalClients.TMDB;

public class TmdbSearchResponse
{
    [JsonPropertyName("results")]
    public List<TmdbResult>? Results { get; set; }
}

public class TmdbResult
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    // O TMDB usa "title" para Filmes e "name" para Séries (TV)
    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("overview")]
    public string? Overview { get; set; }

    [JsonPropertyName("poster_path")]
    public string? PosterPath { get; set; }

    // "release_date" para Filmes, "first_air_date" para Séries
    [JsonPropertyName("release_date")]
    public string? ReleaseDate { get; set; }

    [JsonPropertyName("first_air_date")]
    public string? FirstAirDate { get; set; }
    
    [JsonPropertyName("original_language")]
    public string? OriginalLanguage { get; set; }

    [JsonPropertyName("genre_ids")]
    public List<int> GenreIds { get; set; } = new();
}
public class TmdbDetailResponse : TmdbResult
{
    [JsonPropertyName("genres")]
    public List<TmdbGenre>? GenresList { get; set; }

    [JsonPropertyName("number_of_episodes")]
    public int? NumberOfEpisodes { get; set; } // Apenas para Séries
}

public class TmdbGenre
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}