using Microsoft.AspNetCore.Mvc;

namespace Grabbe.API.Features.MediaDetails;

[ApiController]
[Route("api/v1/[controller]")] // A rota base será /api/v1/media
public class MediaController : ControllerBase
{
    private readonly DetailsService _detailsService;

    public MediaController(DetailsService detailsService)
    {
        _detailsService = detailsService;
    }

    // A rota completa será: GET /api/v1/media/{sourceApi}/{type}/{id}
    [HttpGet("{sourceApi}/{type}/{id}")]
    public async Task<IActionResult> GetDetails(string sourceApi, string type, string id)
    {
        var result = await _detailsService.GetMediaDetailsAsync(sourceApi, type, id);

        if (result == null)
        {
            return NotFound(new { Error = "Mídia não encontrada ou provedor inválido." });
        }

        return Ok(new { Data = result });
    }
}