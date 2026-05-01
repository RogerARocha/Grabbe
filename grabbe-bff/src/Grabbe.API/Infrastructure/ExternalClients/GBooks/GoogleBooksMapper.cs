using Grabbe.API.Domain.DTOs;

namespace Grabbe.API.Infrastructure.ExternalClients.GBooks;

public static class GoogleBooksMapper
{
    // Extension method para mapear GoogleBooksItem -> GrabbeMediaDTO
    public static GrabbeMediaDTO ToUniversalDto(this GoogleBooksItem item)
    {
        var info = item.VolumeInfo!;

        return new GrabbeMediaDTO
        {
            ExternalId = item.Id,
            SourceApi = "GBOOKS",
            Type = "BOOK",
            Title = info.Title ?? "Unknown Title",
            Description = info.Description,
            CoverImageUrl = info.ImageLinks?.Thumbnail?.Replace("http://", "https://"),
            ReleaseDate = ExtractYear(info.PublishedDate),
            OriginalLanguage = info.Language,
            Genres = info.Categories ?? new List<string>(),

            // Google Books usa escala 0-5, normalizamos para 0-10
            CommunityScore = info.AverageRating.HasValue
                ? Math.Round(info.AverageRating.Value * 2, 1)
                : null,

            PublisherOrStudio = info.Publisher,

            FormattedConsumptionMetric = info.PageCount.HasValue
                ? $"{info.PageCount.Value} pages"
                : null,

            TotalProgressUnits = info.PageCount,
            AlternativeTitles = new List<string>(),

            KeyPeople = info.Authors?.Select(author => new MediaPersonDTO
            {
                Name = author,
                Role = "Author",
                ImageUrl = null
            }).ToList() ?? new List<MediaPersonDTO>()
        };
    }

    // ==================== HELPERS PRIVADOS ====================

    private static string? ExtractYear(string? date)
    {
        if (string.IsNullOrWhiteSpace(date)) return null;
        return date.Length >= 4 ? date[..4] : date;
    }
}
