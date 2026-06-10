namespace Grabbe.API.Domain.DTOs;

/// <summary>
/// The universal output contract of the BFF layer.
/// Each external client (TMDB, Jikan, Open Library) maps its proprietary API response
/// to this normalized structure, acting as an Anti-Corruption Layer (ACL) between
/// the frontend and third-party data sources.
/// </summary>
public class GrabbeMediaDTO
{
    /// <summary>The unique identifier from the originating external API.</summary>
    public required string ExternalId { get; set; }

    /// <summary>The name of the source API. Valid values: "TMDB", "JIKAN", "OPENLIBRARY".</summary>
    public required string SourceApi { get; set; }

    /// <summary>The normalized media type. Valid values: "MOVIE", "SERIES", "ANIME", "MANGA", "BOOK".</summary>
    public required string Type { get; set; }

    /// <summary>The primary display title.</summary>
    public required string Title { get; set; }

    /// <summary>A short synopsis or description. Null if not provided by the source API.</summary>
    public string? Description { get; set; }

    /// <summary>Fully-qualified URL for the cover art. Null if unavailable.</summary>
    public string? CoverImageUrl { get; set; }

    /// <summary>Release year extracted from the source date. Preferred format: "2024".</summary>
    public string? ReleaseDate { get; set; }

    /// <summary>List of genre names as provided by the source API.</summary>
    public List<string> Genres { get; set; } = new();

    /// <summary>ISO 639-1 language code of the original release (e.g., "en", "ja").</summary>
    public string? OriginalLanguage { get; set; }

    /// <summary>Normalized community score on a 0–10 scale. Sources using different scales (e.g., Google Books' 0–5) are remapped here.</summary>
    public double? CommunityScore { get; set; }

    /// <summary>Primary publisher, production studio, or distributor.</summary>
    public string? PublisherOrStudio { get; set; }

    /// <summary>
    /// A human-readable consumption length, formatted per media type.
    /// Examples: "2h 49m" for movies, "24 min per ep" for series, "450 pages" for books.
    /// </summary>
    public string? FormattedConsumptionMetric { get; set; }

    /// <summary>
    /// The total number of trackable units. Represents episodes for series/anime,
    /// pages for books/manga, and is <c>null</c> for movies (which have no incremental progress).
    /// </summary>
    public int? TotalProgressUnits { get; set; }

    /// <summary>Alternative or localized titles for this media item.</summary>
    public List<string> AlternativeTitles { get; set; } = new();

    /// <summary>Key people associated with this title (e.g., directors, actors, authors).</summary>
    public List<MediaPersonDTO> KeyPeople { get; set; } = new();
}

/// <summary>Represents a notable person associated with a media title (e.g., director, actor, author).</summary>
public class MediaPersonDTO
{
    /// <summary>Full display name of the person.</summary>
    public required string Name { get; set; }

    /// <summary>The person's role (e.g., "Director", "Author", or the character name for actors).</summary>
    public required string Role { get; set; }

    /// <summary>Profile image URL. Null if unavailable from the source API.</summary>
    public string? ImageUrl { get; set; }
}