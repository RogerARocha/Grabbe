using Grabbe.API.Domain.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace Grabbe.API.Infrastructure.ExternalClients.OpenLibrary;

/// <summary>
/// Extension and mapping methods to transform Open Library models to the universal <see cref="GrabbeMediaDTO"/> contract.
/// </summary>
public static class OpenLibraryMapper
{
    /// <summary>
    /// Maps an Open Library search document to the universal DTO contract.
    /// </summary>
    /// <param name="doc">The search result document item.</param>
    /// <returns>The mapped <see cref="GrabbeMediaDTO"/>.</returns>
    public static GrabbeMediaDTO ToUniversalDto(this OpenLibrarySearchDoc doc)
    {
        var externalId = doc.Key.Replace("/works/", "");

        return new GrabbeMediaDTO
        {
            ExternalId = externalId,
            SourceApi = "OPENLIBRARY",
            Type = "BOOK",
            Title = doc.Title ?? "Unknown Title",
            Description = null,
            CoverImageUrl = doc.CoverI.HasValue 
                ? $"https://covers.openlibrary.org/b/id/{doc.CoverI.Value}-L.jpg" 
                : null,
            ReleaseDate = doc.FirstPublishYear?.ToString(),
            OriginalLanguage = doc.Language?.FirstOrDefault(),
            Genres = doc.Publisher ?? new List<string>(),

            // Open Library uses a 0–5 star scale. Multiplying by 2 normalizes it to a 10-point scale.
            CommunityScore = doc.RatingsAverage.HasValue 
                ? Math.Round(doc.RatingsAverage.Value * 2, 1) 
                : null,

            PublisherOrStudio = doc.Publisher?.FirstOrDefault(),

            FormattedConsumptionMetric = doc.NumberOfPagesMedian.HasValue 
                ? $"{doc.NumberOfPagesMedian.Value} pages" 
                : null,

            TotalProgressUnits = doc.NumberOfPagesMedian,
            AlternativeTitles = new List<string>(),

            KeyPeople = doc.AuthorName?.Select(name => new MediaPersonDTO
            {
                Name = name,
                Role = "Author",
                ImageUrl = null
            }).ToList() ?? new List<MediaPersonDTO>()
        };
    }

    /// <summary>
    /// Maps an Open Library Work details payload to the universal DTO contract, combining it with resolved author names.
    /// </summary>
    /// <param name="work">The work details payload.</param>
    /// <param name="authorNames">The list of resolved author names.</param>
    /// <returns>The mapped <see cref="GrabbeMediaDTO"/>.</returns>
    public static GrabbeMediaDTO ToUniversalDto(this OpenLibraryWorkResponse work, List<string> authorNames)
    {
        var externalId = work.Key.Replace("/works/", "");
        
        string? description = null;
        if (work.Description.HasValue)
        {
            var descEl = work.Description.Value;
            if (descEl.ValueKind == JsonValueKind.String)
            {
                description = descEl.GetString();
            }
            else if (descEl.ValueKind == JsonValueKind.Object && descEl.TryGetProperty("value", out var valProp))
            {
                description = valProp.GetString();
            }
        }

        var coverId = work.Covers?.FirstOrDefault();

        return new GrabbeMediaDTO
        {
            ExternalId = externalId,
            SourceApi = "OPENLIBRARY",
            Type = "BOOK",
            Title = work.Title ?? "Unknown Title",
            Description = description,
            CoverImageUrl = coverId.HasValue && coverId.Value > 0
                ? $"https://covers.openlibrary.org/b/id/{coverId.Value}-L.jpg" 
                : null,
            ReleaseDate = ExtractYear(work.FirstPublishDate),
            OriginalLanguage = null, 
            Genres = work.Subjects ?? new List<string>(),

            CommunityScore = null,
            PublisherOrStudio = null,

            FormattedConsumptionMetric = null,
            TotalProgressUnits = null,
            AlternativeTitles = new List<string>(),

            KeyPeople = authorNames.Select(name => new MediaPersonDTO
            {
                Name = name,
                Role = "Author",
                ImageUrl = null
            }).ToList()
        };
    }

    private static string? ExtractYear(string? date)
    {
        if (string.IsNullOrWhiteSpace(date)) return null;
        for (int i = 0; i <= date.Length - 4; i++)
        {
            if (char.IsDigit(date[i]) && char.IsDigit(date[i + 1]) && char.IsDigit(date[i + 2]) && char.IsDigit(date[i + 3]))
            {
                return date.Substring(i, 4);
            }
        }
        return date.Length >= 4 ? date[..4] : date;
    }
}
