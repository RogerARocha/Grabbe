using Microsoft.AspNetCore.Mvc;

namespace Grabbe.API.Features.MediaSearch;

[ApiController]
[Route("api/v1/[controller]")] // A rota final será /api/v1/search
public class SearchController : ControllerBase
{
    private readonly SearchAggregationService _searchService;

    public SearchController(SearchAggregationService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSearch([FromQuery] string query, [FromQuery] string? type)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { Error = "A query de busca não pode estar vazia." });
        }

        IEnumerable<Grabbe.API.Domain.DTOs.GrabbeMediaDTO> results;

        // Se o tipo foi informado, busca roteado. Se não, busca em todos.
        if (string.IsNullOrWhiteSpace(type))
        {
            results = await _searchService.SearchGlobalAsync(query);
        }
        else
        {
            results = await _searchService.SearchByTypeAsync(query, type);
        }

        // Retorna envelopado no padrão de dados
        return Ok(new { Data = results });
    }
}