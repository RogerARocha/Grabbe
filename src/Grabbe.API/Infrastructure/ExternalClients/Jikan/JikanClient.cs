using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.ExternalClients.Jikan;
using System.Net.Http.Json;

namespace Grabbe.API.Infrastructure.ExternalClients;

public class JikanClient : IMediaProviderClient
{
    private readonly HttpClient _httpClient;

    public string ProviderName => "JIKAN";
    public string[] SupportedTypes => new[] { "ANIME", "MANGA" };

    public JikanClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        try
        {
            // 1. Define o endpoint (vamos focar em anime primeiro, mas a lógica pode expandir para manga)
            var endpoint = type == "MANGA" ? "manga" : "anime";
            
            // 2. Faz o GET e já deserializa automaticamente para as classes que criamos!
            var response = await _httpClient.GetFromJsonAsync<JikanSearchResponse>($"{endpoint}?q={Uri.EscapeDataString(query)}");

            if (response?.Data == null) return Array.Empty<GrabbeMediaDTO>();

            // 3. Mapeamento (LINQ): Transforma o JikanAnimeData no NOSSO GrabbeMediaDTO
            return response.Data.Select(anime => new GrabbeMediaDTO
            {
                ExternalId = anime.MalId.ToString(),
                SourceApi = ProviderName,
                Type = type == "MANGA" ? "MANGA" : "ANIME",
                Title = anime.Title,
                Description = anime.Synopsis,
                CoverImageUrl = anime.Images?.Jpg?.ImageUrl,
                ReleaseDate = anime.Aired?.From?.ToString("yyyy-MM-dd"), // Converte a data para o nosso padrão
                Genres = anime.Genres.Select(g => g.Name).ToList(),
                TotalProgress = anime.Episodes
            });
        }
        catch (HttpRequestException ex)
        {
            // Em um app de produção, você logaria o erro aqui (Serilog, ApplicationInsights)
            Console.WriteLine($"Erro ao buscar no Jikan: {ex.Message}");
            return Array.Empty<GrabbeMediaDTO>();
        }
    }

    public async Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type)
    {
        // TODO: A lógica aqui será muito parecida, usando a rota anime/{id} do Jikan
        return null;
    }
}