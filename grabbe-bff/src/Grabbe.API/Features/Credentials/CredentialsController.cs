using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc;

namespace Grabbe.API.Features.Credentials;

[ApiController]
[Route("api/v1/[controller]")]
public class CredentialsController : ControllerBase
{
    private readonly HttpClient _httpClient;

    public CredentialsController(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient();
    }

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateCredentials([FromBody] ValidateCredentialsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TmdbApiKey))
        {
            return BadRequest(new { Error = "TMDB API Key is required." });
        }

        if (string.IsNullOrWhiteSpace(request.IgdbClientId) || string.IsNullOrWhiteSpace(request.IgdbClientSecret))
        {
            return BadRequest(new { Error = "Twitch/IGDB Client ID and Client Secret are required." });
        }

        // 1. Validate TMDB Key
        bool tmdbValid = false;
        string tmdbError = string.Empty;
        try
        {
            using var tmdbRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.themoviedb.org/3/authentication");
            tmdbRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", request.TmdbApiKey.Trim());
            using var tmdbResponse = await _httpClient.SendAsync(tmdbRequest);
            tmdbValid = tmdbResponse.IsSuccessStatusCode;
            if (!tmdbValid)
            {
                tmdbError = $"TMDB validation returned status {tmdbResponse.StatusCode}";
            }
        }
        catch (Exception ex)
        {
            tmdbError = $"TMDB validation failed: {ex.Message}";
        }

        // 2. Validate Twitch / IGDB credentials
        bool twitchValid = false;
        string twitchError = string.Empty;
        try
        {
            var twitchParams = new Dictionary<string, string>
            {
                { "client_id", request.IgdbClientId.Trim() },
                { "client_secret", request.IgdbClientSecret.Trim() },
                { "grant_type", "client_credentials" }
            };
            using var twitchContent = new FormUrlEncodedContent(twitchParams);
            using var twitchResponse = await _httpClient.PostAsync("https://id.twitch.tv/oauth2/token", twitchContent);
            twitchValid = twitchResponse.IsSuccessStatusCode;
            if (!twitchValid)
            {
                var content = await twitchResponse.Content.ReadAsStringAsync();
                twitchError = $"Twitch validation returned status {twitchResponse.StatusCode}: {content}";
            }
        }
        catch (Exception ex)
        {
            twitchError = $"Twitch validation failed: {ex.Message}";
        }

        if (tmdbValid && twitchValid)
        {
            return Ok(new { Success = true });
        }

        return BadRequest(new
        {
            Success = false,
            TmdbValid = tmdbValid,
            TmdbError = tmdbError,
            TwitchValid = twitchValid,
            TwitchError = twitchError
        });
    }
}

public class ValidateCredentialsRequest
{
    public string? TmdbApiKey { get; set; }
    public string? IgdbClientId { get; set; }
    public string? IgdbClientSecret { get; set; }
}
