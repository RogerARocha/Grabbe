using Grabbe.API.Domain.DTOs;

namespace Grabbe.API.Infrastructure.ExternalClients.TMDB;

public static class TmdbMapper
{
    private const string ImageBaseUrl = "https://image.tmdb.org/t/p/w500";
    private const string ProfileImageBaseUrl = "https://image.tmdb.org/t/p/w185";

    // Extension method para busca (TmdbResult retorna dados parciais)
    public static GrabbeMediaDTO ToSearchDto(this TmdbResult media, string type)
    {
        return new GrabbeMediaDTO
        {
            ExternalId = media.Id.ToString(),
            SourceApi = "TMDB",
            Type = type == "SERIES" ? "SERIES" : "MOVIE",
            Title = media.Title ?? media.Name ?? "Unknown Title",
            Description = string.IsNullOrWhiteSpace(media.Overview) ? null : media.Overview,
            CoverImageUrl = string.IsNullOrWhiteSpace(media.PosterPath)
                ? null
                : $"{ImageBaseUrl}{media.PosterPath}",
            ReleaseDate = ExtractYear(media.ReleaseDate ?? media.FirstAirDate),
            OriginalLanguage = media.OriginalLanguage,
            Genres = new List<string>(),
            CommunityScore = media.VoteAverage.HasValue
                ? Math.Round(media.VoteAverage.Value, 1)
                : null,
            TotalProgressUnits = null,
            PublisherOrStudio = null,
            FormattedConsumptionMetric = null
        };
    }

    // Extension method para detalhes (TmdbDetailResponse retorna dados completos)
    public static GrabbeMediaDTO ToUniversalDto(this TmdbDetailResponse media, string type)
    {
        var isSeries = type == "SERIES";

        return new GrabbeMediaDTO
        {
            ExternalId = media.Id.ToString(),
            SourceApi = "TMDB",
            Type = isSeries ? "SERIES" : "MOVIE",
            Title = media.Title ?? media.Name ?? "Unknown Title",
            Description = string.IsNullOrWhiteSpace(media.Overview) ? null : media.Overview,
            CoverImageUrl = string.IsNullOrWhiteSpace(media.PosterPath)
                ? null
                : $"{ImageBaseUrl}{media.PosterPath}",
            ReleaseDate = ExtractYear(media.ReleaseDate ?? media.FirstAirDate),
            OriginalLanguage = media.OriginalLanguage,
            Genres = media.GenresList?.Select(g => g.Name).ToList() ?? new List<string>(),
            CommunityScore = media.VoteAverage.HasValue
                ? Math.Round(media.VoteAverage.Value, 1)
                : null,
            PublisherOrStudio = media.ProductionCompanies?.FirstOrDefault()?.Name,
            FormattedConsumptionMetric = isSeries
                ? FormatEpisodeRunTime(media.EpisodeRunTime)
                : FormatMovieRuntime(media.Runtime),
            TotalProgressUnits = isSeries ? media.NumberOfEpisodes : null,
            AlternativeTitles = ExtractAlternativeTitles(media.AlternativeTitlesWrapper),
            KeyPeople = ExtractKeyPeople(media.Credits)
        };
    }

    // ==================== HELPERS PRIVADOS ====================

    private static string? ExtractYear(string? date)
    {
        if (string.IsNullOrWhiteSpace(date)) return null;
        return date.Length >= 4 ? date[..4] : date;
    }

    private static string? FormatMovieRuntime(int? runtimeMinutes)
    {
        if (runtimeMinutes is null or 0) return null;
        var h = runtimeMinutes.Value / 60;
        var m = runtimeMinutes.Value % 60;
        return h > 0 ? $"{h}h {m}m" : $"{m}m";
    }

    private static string? FormatEpisodeRunTime(List<int>? episodeRunTime)
    {
        if (episodeRunTime == null || episodeRunTime.Count == 0) return null;
        return $"{episodeRunTime[0]} min per ep";
    }

    private static List<string> ExtractAlternativeTitles(TmdbAlternativeTitlesWrapper? wrapper)
    {
        if (wrapper == null) return new List<string>();
        var source = wrapper.Titles ?? wrapper.Results;
        return source?.Select(t => t.Title).Distinct().Take(10).ToList() ?? new List<string>();
    }

    private static List<MediaPersonDTO> ExtractKeyPeople(TmdbCredits? credits)
    {
        if (credits == null) return new List<MediaPersonDTO>();

        var people = new List<MediaPersonDTO>();

        if (credits.Crew != null)
        {
            var directors = credits.Crew
                .Where(c => c.Job != null && c.Job.Equals("Director", StringComparison.OrdinalIgnoreCase))
                .Select(c => new MediaPersonDTO
                {
                    Name = c.Name,
                    Role = "Director",
                    ImageUrl = string.IsNullOrWhiteSpace(c.ProfilePath) ? null : $"{ProfileImageBaseUrl}{c.ProfilePath}"
                });
            people.AddRange(directors);
        }

        if (credits.Cast != null)
        {
            var actors = credits.Cast
                .OrderBy(c => c.Order)
                .Take(5)
                .Select(c => new MediaPersonDTO
                {
                    Name = c.Name,
                    Role = c.Character ?? "Actor",
                    ImageUrl = string.IsNullOrWhiteSpace(c.ProfilePath) ? null : $"{ProfileImageBaseUrl}{c.ProfilePath}"
                });
            people.AddRange(actors);
        }

        return people;
    }
}