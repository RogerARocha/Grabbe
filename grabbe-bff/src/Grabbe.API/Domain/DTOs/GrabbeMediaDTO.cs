namespace Grabbe.API.Domain.DTOs;

public class GrabbeMediaDTO
{
    public required string ExternalId { get; set; }
    public required string SourceApi { get; set; }
    public required string Type { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? ReleaseDate { get; set; }
    public List<string> Genres { get; set; } = new();
    public int? TotalProgress { get; set; }
}