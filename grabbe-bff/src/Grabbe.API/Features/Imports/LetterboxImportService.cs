using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;

public class LetterboxdImportService
{
    public List<ImportedMediaDto> ParseLetterboxdCsv(string filePath)
    {
        var importedList = new List<ImportedMediaDto>();
        var lines = File.ReadAllLines(filePath, Encoding.UTF8).Skip(1); // skip header

        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            var columns = ParseCsvLine(line);

            if (columns.Count < 5) continue;

            var title = columns[1].Trim();
            if (string.IsNullOrWhiteSpace(title)) continue;

            _ = double.TryParse(
                columns[4].Trim().Replace(',', '.'),
                System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture,
                out double rawScore);

            int grabbeScore = (int)Math.Round(rawScore * 2);

            importedList.Add(new ImportedMediaDto
            {
                Title = title,
                Type = "MOVIE",
                Status = "COMPLETED",
                Score = grabbeScore,
                Progress = 1,
                TotalProgressUnits = 1,
                EndDate = columns[0].Trim()
            });
        }

        return importedList;
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
                    // Peek ahead: "" inside a quoted field is an escaped quote character.
                    if (i + 1 < line.Length && line[i + 1] == '"')
                    {
                        current.Append('"');
                        i++; // consume the second quote
                    }
                    else
                    {
                        inQuotes = false; // closing quote
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

        // Append the last field (there is no trailing comma after it).
        fields.Add(current.ToString());

        return fields;
    }
}