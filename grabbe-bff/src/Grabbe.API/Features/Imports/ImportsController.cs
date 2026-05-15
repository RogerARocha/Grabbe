using Microsoft.AspNetCore.Mvc;

namespace Grabbe.API.Features.Imports;

/// <summary>Handles import requests for external media lists.</summary>
[ApiController]
[Route("api/v1/[controller]")]
public class ImportController : ControllerBase
{
    private readonly MalImportService _malImportService;
    private readonly LetterboxdImportService _letterboxdImportService;

    public ImportController(MalImportService malImportService, LetterboxdImportService letterboxdImportService)
    {
        _malImportService = malImportService;
        _letterboxdImportService = letterboxdImportService;
    }

    /// <summary>
    /// Imports an XML file from MyAnimeList and returns a list of media to be tracked.
    /// </summary>
    /// <param name="file">The XML file exported from MyAnimeList.</param>
    /// <returns>A data envelope containing a list of <see cref="ImportedMediaDto"/> items.</returns>
    [HttpPost("mal")]
    public async Task<IActionResult> ImportMal(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { Error = "No file uploaded." });
        }

        var tempPath = Path.GetTempFileName();
        using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        try
        {
            var result = _malImportService.ParseMalXml(tempPath);
            return Ok(new { Data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = $"Internal server error: {ex.Message}" });
        }
        finally
        {
            System.IO.File.Delete(tempPath);
        }
    }

    /// <summary>
    /// Imports a CSV file from Letterboxd and returns a list of media to be tracked.
    /// </summary>
    /// <param name="file">The CSV file exported from Letterboxd.</param>
    /// <returns>A data envelope containing a list of <see cref="ImportedMediaDto"/> items.</returns>
    [HttpPost("letterboxd")]
    public async Task<IActionResult> ImportLetterboxd(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { Error = "No file uploaded." });
        }

        var tempPath = Path.GetTempFileName();
        using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        try
        {
            var result = _letterboxdImportService.ParseLetterboxdCsv(tempPath);
            return Ok(new { Data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = $"Internal server error: {ex.Message}" });
        }
        finally
        {
            System.IO.File.Delete(tempPath);
        }
    }
}
