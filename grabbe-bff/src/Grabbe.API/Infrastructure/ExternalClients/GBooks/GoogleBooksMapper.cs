using Grabbe.API.Domain.DTOs;

namespace Grabbe.API.Infrastructure.ExternalClients.GBooks;

/// <summary>
/// Extension methods for mapping Google Books API response objects to the universal <see cref="GrabbeMediaDTO"/> contract.
/// </summary>
public static class GoogleBooksMapper
{
    /// <summary>
    /// Maps a Google Books volume item to a <see cref="GrabbeMediaDTO"/>.
    /// </summary>
    /// <param name="item">The raw Google Books volume item. Its <c>VolumeInfo</c> must not be null.</param>
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
            // Google Books returns HTTP image URLs; forcing HTTPS prevents mixed-content browser warnings.
            CoverImageUrl = info.ImageLinks?.Thumbnail?.Replace("http://", "https://"),
            ReleaseDate = ExtractYear(info.PublishedDate),
            OriginalLanguage = info.Language,
            Genres = info.Categories ?? new List<string>(),

            // Google Books uses a 0–5 star rating scale. Multiplying by 2 normalizes it to the
            // universal 0–10 scale used across all providers in GrabbeMediaDTO.
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

    private static string? ExtractYear(string? date)
    {
        if (string.IsNullOrWhiteSpace(date)) return null;
        return date.Length >= 4 ? date[..4] : date;
    }
}
