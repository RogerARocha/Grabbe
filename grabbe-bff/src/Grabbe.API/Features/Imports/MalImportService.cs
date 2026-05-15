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
            // Mapeamento de Status do MAL para o padrão do Grabbe
            var malStatus = anime.Element("my_status")?.Value;
            var grabbeStatus = malStatus switch
            {
                "Completed" => "COMPLETED",
                "Watching" => "CONSUMING",
                "On-Hold" => "ON HOLD",
                "Dropped" => "DROPPED",
                "Plan to Watch" => "PLANNED",
                _ => "PLANNED"
            };

            _ = int.TryParse(anime.Element("my_score")?.Value, out int score);
            _ = int.TryParse(anime.Element("my_watched_episodes")?.Value, out int progress);
            _ = int.TryParse(anime.Element("series_episodes")?.Value, out int totalProgress);

            importedList.Add(new ImportedMediaDto
            {
                Title = anime.Element("series_title")?.Value?.Trim(),
                Type = "ANIME",
                Status = grabbeStatus,
                Score = score,
                Progress = progress,
                TotalProgressUnits = totalProgress == 0 ? null : totalProgress,
                StartDate = ParseMalDate(anime.Element("my_start_date")?.Value),
                EndDate = ParseMalDate(anime.Element("my_finish_date")?.Value)
            });
        }
        return importedList;
    }

    private string ParseMalDate(string dateStr)
    {
        // O MAL as vezes manda "0000-00-00" quando não há data
        if (string.IsNullOrWhiteSpace(dateStr) || dateStr.Contains("0000")) return null;
        return dateStr; 
    }
}