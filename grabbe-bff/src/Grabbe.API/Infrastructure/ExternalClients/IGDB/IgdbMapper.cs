using Grabbe.API.Domain.DTOs;

namespace Grabbe.API.Infrastructure.ExternalClients.IGDB;

public static class IgdbMapper
{
    public static GrabbeMediaDTO ToUniversalDto(IgdbGameResponse igdbGame)
    {
        return new GrabbeMediaDTO
        {
            ExternalId = igdbGame.Id.ToString(),
            SourceApi = "IGDB",
            Type = "GAME",
            Title = igdbGame.Name ?? "Unknown Title",
            Description = igdbGame.Summary,
            CoverImageUrl = BuildCoverUrl(igdbGame.Cover?.ImageId),
            ReleaseDate = ConvertUnixToDateString(igdbGame.FirstReleaseDate),
            Genres = igdbGame.Genres?.Select(g => g.Name).ToList() ?? new List<string>(),
            OriginalLanguage = null,
            CommunityScore = igdbGame.Rating.HasValue ? Math.Round(igdbGame.Rating.Value / 10.0, 1) : null,
            PublisherOrStudio = ExtractMainStudio(igdbGame.InvolvedCompanies),
            FormattedConsumptionMetric = null,
            TotalProgressUnits = null,
            AlternativeTitles = igdbGame.AlternativeNames?.Select(a => a.Name).ToList() ?? new List<string>(),
            KeyPeople = new List<MediaPersonDTO>() 
        };
    }

    private static string? BuildCoverUrl(string? imageId)
    {
        if (string.IsNullOrWhiteSpace(imageId)) return null;
        return $"https://images.igdb.com/igdb/image/upload/t_cover_big/{imageId}.jpg";
    }

    private static string? ConvertUnixToDateString(long? unixTimestamp)
    {
        if (!unixTimestamp.HasValue) return null;
        return DateTimeOffset.FromUnixTimeSeconds(unixTimestamp.Value).UtcDateTime.Year.ToString();
    }

    private static string? ExtractMainStudio(List<IgdbInvolvedCompany>? companies)
    {
        if (companies == null || !companies.Any()) return null;

        var mainCompany = companies.FirstOrDefault(c => c.Developer) 
                          ?? companies.FirstOrDefault(c => c.Publisher);

        return mainCompany?.Company?.Name;
    }
}