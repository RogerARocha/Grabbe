using System.Xml.Linq;
using System.Collections.Generic;

public class MalImportService
{
    public List<ImportedMediaDto> ParseMalXml(string filePath)
    {
        var importedList = new List<ImportedMediaDto>();
        var doc = XDocument.Load(filePath);

        foreach (var anime in doc.Descendants("anime"))
        {
            // Map MAL's status strings to the canonical Grabbe status enum values.
            var malStatus = anime.Element("my_status")?.Value;
            var grabbeStatus = malStatus switch
            {
                "Completed"     => "COMPLETED",
                "Watching"      => "CONSUMING",
                "On-Hold"       => "ON HOLD",
                "Dropped"       => "DROPPED",
                "Plan to Watch" => "PLANNED",
                _               => "PLANNED"
            };

            _ = int.TryParse(anime.Element("my_score")?.Value, out int score);
            _ = int.TryParse(anime.Element("my_watched_episodes")?.Value, out int progress);
            _ = int.TryParse(anime.Element("series_episodes")?.Value, out int totalProgress);

            importedList.Add(new ImportedMediaDto
            {
                Title            = anime.Element("series_title")?.Value?.Trim(),
                Type             = "ANIME",
                Status           = grabbeStatus,
                Score            = score,
                Progress         = progress,
                TotalProgressUnits = totalProgress == 0 ? null : totalProgress,
                StartDate        = ParseMalDate(anime.Element("my_start_date")?.Value),
                EndDate          = ParseMalDate(anime.Element("my_finish_date")?.Value)
            });
        }

        return importedList;
    }

    private static string ParseMalDate(string dateStr)
    {
        if (string.IsNullOrWhiteSpace(dateStr) || dateStr.Contains("0000")) return null;
        return dateStr;
    }
}