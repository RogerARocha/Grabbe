using Microsoft.AspNetCore.Mvc;

namespace Grabbe.API.Features.MediaSearch;

/// <summary>Handles media search requests and delegates to the aggregation service.</summary>
[ApiController]
[Route("api/v1/[controller]")]
public class SearchController : ControllerBase
{
    private readonly SearchAggregationService _searchService;

    public SearchController(SearchAggregationService searchService)
    {
        _searchService = searchService;
    }

    /// <summary>
    /// Searches for media across all supported providers, or within a specific type.
    /// </summary>
    /// <param name="query">The search term to look for.</param>
    /// <param name="type">Optional media type filter (e.g., "MOVIE", "ANIME"). Omit to search all providers.</param>
    /// <returns>A data envelope containing a list of matching <see cref="Grabbe.API.Domain.DTOs.GrabbeMediaDTO"/> items.</returns>
    [HttpGet]
    public async Task<IActionResult> GetSearch([FromQuery] string query, [FromQuery] string? type)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { Error = "Search query cannot be empty." });
        }

        IEnumerable<Grabbe.API.Domain.DTOs.GrabbeMediaDTO> results;

        if (string.IsNullOrWhiteSpace(type))
        {
            results = await _searchService.SearchGlobalAsync(query);
        }
        else
        {
            results = await _searchService.SearchByTypeAsync(query, type);
        }

        return Ok(new { Data = results });
    }
}