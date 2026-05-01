using Grabbe.API.Domain.DTOs;

namespace Grabbe.API.Infrastructure.ExternalClients.Jikan;

public static class JikanMapper
{
    // Extension method unificado — Jikan V4 retorna o mesmo JikanAnimeData no search e no detail
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

            // A API do Jikan não retorna staff/cast no endpoint padrão.
            // Exigiria uma chamada extra (/anime/{id}/characters).
            KeyPeople = new List<MediaPersonDTO>()
        };
    }
}
