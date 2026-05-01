using System.Text.Json.Serialization;

namespace Grabbe.API.Infrastructure.ExternalClients.TMDB;

// ==================== SEARCH RESPONSE ====================

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

    [JsonPropertyName("vote_average")]
    public double? VoteAverage { get; set; }
}

// ==================== DETAIL RESPONSE ====================

public class TmdbDetailResponse : TmdbResult
{
    [JsonPropertyName("genres")]
    public List<TmdbGenre>? GenresList { get; set; }

    [JsonPropertyName("number_of_episodes")]
    public int? NumberOfEpisodes { get; set; } // Apenas para Séries

    [JsonPropertyName("runtime")]
    public int? Runtime { get; set; } // Duração em minutos (Filmes)

    [JsonPropertyName("episode_run_time")]
    public List<int>? EpisodeRunTime { get; set; } // Duração de cada episódio (Séries)

    [JsonPropertyName("production_companies")]
    public List<TmdbProductionCompany>? ProductionCompanies { get; set; }

    // append_to_response=credits
    [JsonPropertyName("credits")]
    public TmdbCredits? Credits { get; set; }

    // append_to_response=alternative_titles
    [JsonPropertyName("alternative_titles")]
    public TmdbAlternativeTitlesWrapper? AlternativeTitlesWrapper { get; set; }
}

// ==================== SUB-MODELS ====================

public class TmdbGenre
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class TmdbProductionCompany
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class TmdbCredits
{
    [JsonPropertyName("cast")]
    public List<TmdbCastMember>? Cast { get; set; }

    [JsonPropertyName("crew")]
    public List<TmdbCrewMember>? Crew { get; set; }
}

public class TmdbCastMember
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("character")]
    public string? Character { get; set; }

    [JsonPropertyName("profile_path")]
    public string? ProfilePath { get; set; }

    [JsonPropertyName("order")]
    public int Order { get; set; }
}

public class TmdbCrewMember
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("job")]
    public string? Job { get; set; }

    [JsonPropertyName("profile_path")]
    public string? ProfilePath { get; set; }
}

public class TmdbAlternativeTitlesWrapper
{
    // Filmes usam "titles", Séries usam "results"
    [JsonPropertyName("titles")]
    public List<TmdbAlternativeTitle>? Titles { get; set; }

    [JsonPropertyName("results")]
    public List<TmdbAlternativeTitle>? Results { get; set; }
}

public class TmdbAlternativeTitle
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
}