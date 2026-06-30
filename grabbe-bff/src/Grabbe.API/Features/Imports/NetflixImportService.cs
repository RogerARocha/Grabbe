using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;

/// <summary>
/// Service to parse Netflix viewing history CSV files.
/// </summary>
public class NetflixImportService
{
    /// <summary>
    /// Parses a Netflix CSV history file, grouping episodes of series and extracting start/end dates.
    /// Uses a two-pass heuristic grouping to detect series and movies.
    /// </summary>
    /// <param name="filePath">The path to the uploaded CSV file.</param>
    /// <returns>A list of imported media entries.</returns>
    public List<ImportedMediaDto> ParseNetflixCsv(string filePath)
    {
        var importedList = new List<ImportedMediaDto>();
        var lines = File.ReadAllLines(filePath, Encoding.UTF8);

        if (lines.Length == 0) return importedList;

        // Skip header if present
        int startIndex = 0;
        if (lines[0].Contains("Title") && lines[0].Contains("Date"))
        {
            startIndex = 1;
        }

        var groups = new Dictionary<string, NetflixGroup>(StringComparer.OrdinalIgnoreCase);

        for (int i = startIndex; i < lines.Length; i++)
        {
            var line = lines[i];
            if (string.IsNullOrWhiteSpace(line)) continue;

            var columns = ParseCsvLine(line);
            if (columns.Count < 2) continue;

            var rawTitle = columns[0].Trim();
            var rawDate = columns[1].Trim();

            if (string.IsNullOrWhiteSpace(rawTitle)) continue;

            var parsedDate = ParseNetflixDate(rawDate);

            // Determine prefix and whether it is an episode
            var parts = rawTitle.Split(new[] { ": " }, StringSplitOptions.RemoveEmptyEntries);
            string prefix = parts.Length > 0 ? parts[0].Trim() : rawTitle;
            bool isEpisode = parts.Length >= 3 || HasSeriesIndicator(rawTitle);

            if (!groups.ContainsKey(prefix))
            {
                groups[prefix] = new NetflixGroup { Prefix = prefix };
            }

            var group = groups[prefix];
            if (parsedDate.HasValue)
            {
                group.Dates.Add(parsedDate.Value);
            }
            if (!group.RawTitles.Contains(rawTitle))
            {
                group.RawTitles.Add(rawTitle);
            }
            if (isEpisode)
            {
                group.HasEpisodeIndicator = true;
            }
        }

        foreach (var entry in groups.Values)
        {
            var distinctTitles = entry.RawTitles;
            var dates = entry.Dates;

            var sortedDates = dates.OrderBy(d => d).ToList();
            string? startDate = sortedDates.Count > 0 ? sortedDates.First().ToString("yyyy-MM-dd") : null;
            string? endDate = sortedDates.Count > 0 ? sortedDates.Last().ToString("yyyy-MM-dd") : null;

            bool isSeries = entry.HasEpisodeIndicator || distinctTitles.Count > 1;

            // If it is a series, the title is the prefix.
            // If it is a movie/single entry, the title is the full raw title.
            string title = isSeries ? entry.Prefix : (distinctTitles.Count > 0 ? distinctTitles[0] : entry.Prefix);

            importedList.Add(new ImportedMediaDto
            {
                Title = title,
                Type = isSeries ? "SERIES" : "MOVIE",
                Status = "COMPLETED",
                Score = 0,
                Progress = sortedDates.Count > 0 ? sortedDates.Count : 1,
                TotalProgressUnits = isSeries ? null : 1,
                StartDate = startDate,
                EndDate = endDate
            });
        }

        return importedList;
    }

    private class NetflixGroup
    {
        public required string Prefix { get; set; }
        public List<string> RawTitles { get; set; } = new();
        public List<DateTime> Dates { get; set; } = new();
        public bool HasEpisodeIndicator { get; set; }
    }

    private static bool HasSeriesIndicator(string rawTitle)
    {
        var lower = rawTitle.ToLowerInvariant();
        string[] indicators = {
            "temporada", "season", "seasons",
            "episódio", "episodio", "episode", "episodes",
            "minissérie", "minisérie", "miniseries",
            "parte", "part", "volume", "vol.", "vol",
            "capítulo", "capitulo", "chapter",
            "série", "series", "ep.", "epis.",
            "ova", "ona", "special", "especial"
        };
        
        var parts = rawTitle.Split(new[] { ": " }, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length >= 2)
        {
            for (int i = 1; i < parts.Length; i++)
            {
                var p = parts[i].Trim();
                if (int.TryParse(p, out _) || (p.Length > 0 && char.IsDigit(p[0])))
                {
                    return true;
                }
            }
        }

        return indicators.Any(ind => lower.Contains(ind));
    }

    private static DateTime? ParseNetflixDate(string rawDate)
    {
        if (string.IsNullOrWhiteSpace(rawDate)) return null;
        string[] formats = {
            "M/d/yy", "M/d/yyyy", "d/M/yy", "d/M/yyyy",
            "MM/dd/yyyy", "dd/MM/yyyy", "yyyy-MM-dd",
            "M/dd/yy", "MM/d/yy", "d/MM/yyyy", "dd/M/yyyy"
        };
        if (DateTime.TryParseExact(rawDate.Trim(), formats, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out DateTime parsedDate))
        {
            return parsedDate;
        }
        if (DateTime.TryParse(rawDate.Trim(), out DateTime fallbackDate))
        {
            return fallbackDate;
        }
        return null;
    }

    private static List<string> ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var current = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];

            if (inQuotes)
            {
                if (c == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"')
                    {
                        current.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuotes = false;
                    }
                }
                else
                {
                    current.Append(c);
                }
            }
            else
            {
                if (c == '"')
                {
                    inQuotes = true;
                }
                else if (c == ',')
                {
                    fields.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }
        }

        fields.Add(current.ToString());
        return fields;
    }
}
