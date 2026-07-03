using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Grabbe.API.Features.Export;

[ApiController]
[Route("api/v1/[controller]")]
public class ExportController : ControllerBase
{
    private readonly HttpClient _httpClient;

    public ExportController(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient();
    }

    public class SaveExportRequest
    {
        public string FileName { get; set; } = string.Empty;
        public string Base64Data { get; set; } = string.Empty;
    }

    [HttpPost("save")]
    public async Task<IActionResult> SaveExport([FromBody] SaveExportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FileName) || string.IsNullOrWhiteSpace(request.Base64Data))
        {
            return BadRequest(new { Error = "FileName and Base64Data are required." });
        }

        try
        {
            // Strip the data URI scheme prefix (e.g., "data:image/png;base64,") if present
            string base64Data = request.Base64Data;
            int commaIndex = base64Data.IndexOf(',');
            if (commaIndex >= 0)
            {
                base64Data = base64Data.Substring(commaIndex + 1);
            }

            byte[] bytes = Convert.FromBase64String(base64Data);

            // Save to the user's Downloads directory
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string downloadsFolder = Path.Combine(userProfile, "Downloads");

            if (!Directory.Exists(downloadsFolder))
            {
                Directory.CreateDirectory(downloadsFolder);
            }

            string fullPath = Path.Combine(downloadsFolder, request.FileName);
            await System.IO.File.WriteAllBytesAsync(fullPath, bytes);

            return Ok(new { Path = fullPath });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = $"Failed to save image: {ex.Message}" });
        }
    }

    [HttpGet("proxy/{hexUrl}")]
    public async Task<IActionResult> ProxyImage(string hexUrl)
    {
        if (string.IsNullOrWhiteSpace(hexUrl))
        {
            return BadRequest(new { Error = "hexUrl is required." });
        }

        try
        {
            string url = HexDecode(hexUrl);
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new { Error = "Failed to fetch image." });
            }

            var contentBytes = await response.Content.ReadAsByteArrayAsync();
            var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
            return File(contentBytes, contentType);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = $"Proxy error: {ex.Message}" });
        }
    }

    private static string HexDecode(string hex)
    {
        if (hex.Length % 2 != 0)
        {
            throw new ArgumentException("Hex string must have an even length.");
        }
        byte[] raw = new byte[hex.Length / 2];
        for (int i = 0; i < raw.Length; i++)
        {
            raw[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
        }
        return System.Text.Encoding.UTF8.GetString(raw);
    }
}
