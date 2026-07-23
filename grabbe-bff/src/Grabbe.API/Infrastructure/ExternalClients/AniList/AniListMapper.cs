using System.Text.RegularExpressions;
using Grabbe.API.Domain.DTOs;

namespace Grabbe.API.Infrastructure.ExternalClients.AniList;

/// <summary>
/// Extension methods for mapping AniList GraphQL response objects to the universal <see cref="GrabbeMediaDTO"/> contract.
/// </summary>
public static class AniListMapper
{
    private static readonly Regex HtmlTagRegex = new(@"<[^>]+>", RegexOptions.Compiled);

    /// <summary>
    /// Maps an AniList media item to a <see cref="GrabbeMediaDTO"/>.
    /// </summary>
    public static GrabbeMediaDTO ToUniversalDto(this AniListMedia item, string requestedType, string? overrideSourceApi = null)
    {
        var isManga = requestedType.Equals("MANGA", StringComparison.OrdinalIgnoreCase) || 
                      (item.Type != null && item.Type.Equals("MANGA", StringComparison.OrdinalIgnoreCase));

        var primaryTitle = item.Title?.UserPreferred 
                           ?? item.Title?.English 
                           ?? item.Title?.Romaji 
                           ?? item.Title?.Native 
                           ?? "Untitled";

        var totalUnits = isManga ? (item.Chapters ?? item.Volumes) : item.Episodes;

        var studioOrAuthor = isManga
            ? ExtractMangaAuthor(item.Staff)
            : item.Studios?.Nodes?.FirstOrDefault()?.Name;

        var rawDescription = item.Description;
        var cleanDescription = string.IsNullOrWhiteSpace(rawDescription)
            ? null
            : CleanHtmlDescription(rawDescription);

        var altTitles = new List<string>();
        if (!string.IsNullOrWhiteSpace(item.Title?.English) && item.Title.English != primaryTitle)
            altTitles.Add(item.Title.English);
        if (!string.IsNullOrWhiteSpace(item.Title?.Romaji) && item.Title.Romaji != primaryTitle)
            altTitles.Add(item.Title.Romaji);
        if (!string.IsNullOrWhiteSpace(item.Title?.Native) && item.Title.Native != primaryTitle)
            altTitles.Add(item.Title.Native);

        var keyPeople = item.Staff?.Edges?
            .Where(e => e.Node?.Name?.Full != null)
            .Select(e => new MediaPersonDTO
            {
                Name = e.Node!.Name!.Full!,
                Role = e.Role ?? "Staff"
            })
            .Take(10)
            .ToList() ?? new List<MediaPersonDTO>();

        return new GrabbeMediaDTO
        {
            ExternalId = item.Id.ToString(),
            SourceApi = overrideSourceApi ?? "ANILIST",
            Type = isManga ? "MANGA" : "ANIME",
            Title = primaryTitle,
            Description = cleanDescription,
            CoverImageUrl = item.CoverImage?.ExtraLarge ?? item.CoverImage?.Large ?? item.CoverImage?.Medium,
            ReleaseDate = item.StartDate?.Year?.ToString(),
            Genres = item.Genres ?? new List<string>(),
            OriginalLanguage = "ja",

            // AniList average score is 0-100, normalize to 0-10 scale
            CommunityScore = item.AverageScore.HasValue
                ? Math.Round(item.AverageScore.Value / 10.0, 1)
                : null,

            PublisherOrStudio = studioOrAuthor,

            FormattedConsumptionMetric = !isManga && item.Duration.HasValue
                ? $"{item.Duration.Value} min per ep"
                : null,

            TotalProgressUnits = totalUnits,
            AlternativeTitles = altTitles.Distinct().ToList(),
            KeyPeople = keyPeople
        };
    }

    private static string? ExtractMangaAuthor(AniListStaffConnection? staff)
    {
        if (staff?.Edges == null || !staff.Edges.Any()) return null;

        var authorEdge = staff.Edges.FirstOrDefault(e => 
            e.Role != null && (
                e.Role.Contains("Story", StringComparison.OrdinalIgnoreCase) ||
                e.Role.Contains("Art", StringComparison.OrdinalIgnoreCase) ||
                e.Role.Contains("Author", StringComparison.OrdinalIgnoreCase) ||
                e.Role.Contains("Original Creator", StringComparison.OrdinalIgnoreCase)
            )
        );

        return authorEdge?.Node?.Name?.Full ?? staff.Edges.FirstOrDefault()?.Node?.Name?.Full;
    }

    private static string CleanHtmlDescription(string input)
    {
        var text = input.Replace("<br>", "\n").Replace("<br/>", "\n").Replace("<br />", "\n");
        return HtmlTagRegex.Replace(text, string.Empty).Trim();
    }
}
