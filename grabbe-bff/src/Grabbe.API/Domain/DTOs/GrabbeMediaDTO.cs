namespace Grabbe.API.Domain.DTOs;

// Contrato universal de saída do BFF
// Cada client externo (TMDB, Jikan, GBooks) mapeia sua resposta
// proprietária para esta estrutura padronizada, atuando como uma Camada Anti-Corrupção (ACL).
public class GrabbeMediaDTO
{
    public required string ExternalId { get; set; }
    public required string SourceApi { get; set; }  // "TMDB", "JIKAN", "GBOOKS"
    public required string Type { get; set; }       // "MOVIE", "SERIES", "ANIME", "MANGA", "BOOK", "GAME"
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? ReleaseDate { get; set; }        // Preferencialmente apenas o ano, ex: "2024"
    public List<string> Genres { get; set; } = new();
    public string? OriginalLanguage { get; set; }
    
    //Campos universais
    public double? CommunityScore { get; set; }               // Ex: 8.5 (escala de 0 a 10)
    public string? PublisherOrStudio { get; set; }             // Produtora, Estúdio ou Editora
    public string? FormattedConsumptionMetric { get; set; }    // Ex: "2h 49m", "24 min per ep", "450 pages"
    public int? TotalProgressUnits { get; set; }               // Episódios totais ou nº de páginas. Nulo para filmes.

    public List<string> AlternativeTitles { get; set; } = new();
    public List<MediaPersonDTO> KeyPeople { get; set; } = new();
}

/// Pessoa relevante atrelada mídia (diretor, ator, autor, etc.)
public class MediaPersonDTO
{
    public required string Name { get; set; }
    public required string Role { get; set; }
    public string? ImageUrl { get; set; }
}