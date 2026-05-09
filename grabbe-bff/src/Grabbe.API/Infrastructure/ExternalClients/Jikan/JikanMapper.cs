using Grabbe.API.Domain.DTOs;

namespace Grabbe.API.Infrastructure.ExternalClients.Jikan;

/// <summary>
/// Extension methods for mapping Jikan API response objects to the universal <see cref="GrabbeMediaDTO"/> contract.
/// </summary>
public static class JikanMapper
{
    /// <summary>
    /// Maps a Jikan anime or manga data item to a <see cref="GrabbeMediaDTO"/>.
    /// Jikan V4 returns the same <c>JikanAnimeData</c> shape for both search and detail endpoints,
    /// so a single extension method handles both call sites.
    /// </summary>
    /// <param name="item">The raw Jikan data item.</param>
    /// <param name="isManga">When <c>true</c>, maps manga-specific fields (chapters, serialization); otherwise maps anime fields (episodes, studio).</param>
    public static GrabbeMediaDTO ToUniversalDto(this JikanAnimeData item, bool isManga)
    {
        var totalUnits = isManga ? item.Chapters : item.Episodes;
        var airedDate = isManga ? item.Published?.From : item.Aired?.From;

        return new GrabbeMediaDTO
        {
            ExternalId = item.MalId.ToString(),
            SourceApi = "JIKAN",
            Type = isManga ? "MANGA" : "ANIME",
            Title = item.Title,
            Description = item.Synopsis,
            CoverImageUrl = item.Images?.Jpg?.ImageUrl,
            ReleaseDate = airedDate?.ToString("yyyy"),
            Genres = item.Genres.Select(g => g.Name).ToList(),

            CommunityScore = item.Score.HasValue
                ? Math.Round(item.Score.Value, 1)
                : null,

            PublisherOrStudio = isManga
                ? item.Serializations?.FirstOrDefault()?.Name
                : item.Studios?.FirstOrDefault()?.Name,

            FormattedConsumptionMetric = item.Duration,
            TotalProgressUnits = totalUnits,

            AlternativeTitles = item.Titles?
                .Where(t => t.Type != null && !t.Type.Equals("Default", StringComparison.OrdinalIgnoreCase))
                .Select(t => t.Title)
                .Distinct()
                .Take(10)
                .ToList() ?? new List<string>(),

            // TODO: KeyPeople is not available from the standard Jikan search/detail endpoint.
            // Populating it requires a separate call to /anime/{id}/characters, which is not currently implemented.
            KeyPeople = new List<MediaPersonDTO>()
        };
    }
}
