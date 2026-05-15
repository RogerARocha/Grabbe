using System.IO;
using System.Collections.Generic;
using System.Linq;

public class LetterboxdImportService
{
    public List<ImportedMediaDto> ParseLetterboxdCsv(string filePath)
    {
        var importedList = new List<ImportedMediaDto>();
        var lines = File.ReadAllLines(filePath).Skip(1); // Pula o cabeçalho

        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            // Divide por vírgula, mas lidando com o fato de que pode haver vírgulas dentro do nome do filme
            var columns = line.Split(','); 
            if (columns.Length < 5) continue;

            // O Letterboxd manda nota de 0 a 5. Se o Grabbe usa 0 a 10, multiplicamos por 2.
            _ = double.TryParse(columns[4].Replace(".", ","), out double rawScore);
            int grabbeScore = (int)(rawScore * 2); 

            importedList.Add(new ImportedMediaDto
            {
                // Pegamos a segunda coluna (Nome) e limpamos eventuais aspas duplas
                Title = columns[1].Replace("\"", "").Trim(),
                Type = "MOVIE",
                Status = "COMPLETED", // Se está no ratings.csv, foi assistido
                Score = grabbeScore,
                Progress = 1,
                TotalProgressUnits = 1,
                EndDate = columns[0] // A data que vem na primeira coluna do Letterboxd
            });
        }
        return importedList;
    }
}