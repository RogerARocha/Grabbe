using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.Configuration;
using Grabbe.API.Infrastructure.ExternalClients.GBooks;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;

namespace Grabbe.API.Infrastructure.ExternalClients;

public class GoogleBooksClient : IMediaProviderClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public string ProviderName => "GBOOKS";
    public string[] SupportedTypes => new[] { "BOOK" };

    public GoogleBooksClient(HttpClient httpClient, IOptions<ExternalApiOptions> options)
    {
        _httpClient = httpClient;
        _apiKey = options.Value.GBooksApiKey;
    }

    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        try
        {
            // O endpoint do Google Books é /volumes. Passamos maxResults=10 para não sobrecarregar a rede.
            var endpoint = $"volumes?q={Uri.EscapeDataString(query)}&key={_apiKey}&maxResults=10";

            var response = await _httpClient.GetFromJsonAsync<GoogleBooksSearchResponse>(endpoint);

            if (response?.Items == null) return Array.Empty<GrabbeMediaDTO>();

            return response.Items.Select(item => new GrabbeMediaDTO
            {
                ExternalId = item.Id,
                SourceApi = ProviderName,
                Type = "BOOK",
                Title = item.VolumeInfo?.Title ?? "Título Desconhecido",
                Description = item.VolumeInfo?.Description,
                
                // Força o HTTPS para evitar erros de bloqueio de imagem no Front-end (Tauri)
                CoverImageUrl = item.VolumeInfo?.ImageLinks?.Thumbnail?.Replace("http://", "https://"),
                
                ReleaseDate = item.VolumeInfo?.PublishedDate,
                
                // O Google retorna as categorias como uma lista de strings
                Genres = item.VolumeInfo?.Categories ?? new List<string>(),
                
                // O número de páginas será o nosso "progresso total"
                TotalProgress = item.VolumeInfo?.PageCount
            });
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"Erro ao buscar no Google Books: {ex.Message}");
            return Array.Empty<GrabbeMediaDTO>();
        }
    }

    public async Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type)
    {
        return null;
    }
}