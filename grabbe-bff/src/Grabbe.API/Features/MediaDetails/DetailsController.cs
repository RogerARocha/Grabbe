using Microsoft.AspNetCore.Mvc;

namespace Grabbe.API.Features.MediaDetails;

/// <summary>Handles requests for detailed information on a specific media item.</summary>
[ApiController]
[Route("api/v1/[controller]")]
public class MediaController : ControllerBase
{
    private readonly DetailsService _detailsService;

    public MediaController(DetailsService detailsService)
    {
        _detailsService = detailsService;
    }

    /// <summary>
    /// Retrieves full details for a specific media item from its originating provider.
    /// </summary>
    /// <param name="sourceApi">The provider identifier (e.g., "TMDB", "JIKAN", "GBOOKS").</param>
    /// <param name="type">The normalized media type (e.g., "MOVIE", "ANIME").</param>
    /// <param name="id">The external identifier for the media item within its source API.</param>
    /// <returns>A data envelope containing the <see cref="Grabbe.API.Domain.DTOs.GrabbeMediaDTO"/>, or 404 if not found.</returns>
    [HttpGet("{sourceApi}/{type}/{id}")]
    public async Task<IActionResult> GetDetails(string sourceApi, string type, string id)
    {
        var result = await _detailsService.GetMediaDetailsAsync(sourceApi, type, id);

        if (result == null)
        {
            return NotFound(new { Error = "Media not found or provider is invalid." });
        }

        return Ok(new { Data = result });
    }
}