using Grabbe.API.Domain.DTOs;
using Grabbe.API.Infrastructure.Configuration;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using Grabbe.API.Infrastructure.ExternalClients.TMDB;

namespace Grabbe.API.Infrastructure.ExternalClients;

public class TmdbClient : IMediaProviderClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    
    // O TMDB exige que as imagens sejam buscadas em um subdomínio diferente
    private const string ImageBaseUrl = "https://image.tmdb.org/t/p/w500";

    public string ProviderName => "TMDB";
    public string[] SupportedTypes => new[] { "MOVIE", "SERIES" };

    public TmdbClient(HttpClient httpClient, IOptions<ExternalApiOptions> options)
    {
        _httpClient = httpClient;
        _apiKey = options.Value.TmdbApiKey;
        
        // Adiciona o token de autorização padrão em todas as chamadas deste client
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
    }

    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        try
        {
            // O TMDB separa a busca de filmes (movie) e séries (tv)
            var endpoint = type == "SERIES" ? "search/tv" : "search/movie";
            
            // Fazemos o GET. Note que o language=pt-BR já traz sinopses em português!
            var response = await _httpClient.GetFromJsonAsync<TmdbSearchResponse>(
                $"{endpoint}?query={Uri.EscapeDataString(query)}&language=pt-BR&page=1");

            if (response?.Results == null) return Array.Empty<GrabbeMediaDTO>();

            return response.Results.Where(media => !(media.OriginalLanguage == "ja" && media.GenreIds.Contains(16)))
                .Select(media => new GrabbeMediaDTO
            {
                ExternalId = media.Id.ToString(),
                SourceApi = ProviderName,
                Type = type == "SERIES" ? "SERIES" : "MOVIE",
                
                // Trata a diferença de nomenclatura entre Filme e Série
                Title = media.Title ?? media.Name ?? "Título Desconhecido",
                Description = string.IsNullOrWhiteSpace(media.Overview) ? null : media.Overview,
                
                // Monta a URL completa da imagem (se existir)
                CoverImageUrl = string.IsNullOrWhiteSpace(media.PosterPath) 
                    ? null 
                    : $"{ImageBaseUrl}{media.PosterPath}",
                    
                ReleaseDate = media.ReleaseDate ?? media.FirstAirDate,
                
                // Nota: O endpoint de busca do TMDB não retorna os nomes dos gêneros, apenas IDs numéricos.
                // Para o MVP, deixamos vazio na busca. O detalhe profundo preencherá isso depois.
                Genres = new List<string>(),
                TotalProgress = null // O endpoint de busca também não retorna total de episódios
            });
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"Erro ao buscar no TMDB: {ex.Message}");
            return Array.Empty<GrabbeMediaDTO>();
        }
    }

public async Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type)
    {
        try
        {
            var endpoint = type == "SERIES" ? $"tv/{externalId}" : $"movie/{externalId}";
            
            // Fazemos a chamada profunda para a mídia específica
            var media = await _httpClient.GetFromJsonAsync<TmdbDetailResponse>(
                $"{endpoint}?language=pt-BR");

            if (media == null) return null;

            return new GrabbeMediaDTO
            {
                ExternalId = media.Id.ToString(),
                SourceApi = ProviderName,
                Type = type == "SERIES" ? "SERIES" : "MOVIE",
                Title = media.Title ?? media.Name ?? "Título Desconhecido",
                Description = string.IsNullOrWhiteSpace(media.Overview) ? null : media.Overview,
                CoverImageUrl = string.IsNullOrWhiteSpace(media.PosterPath) 
                    ? null 
                    : $"{ImageBaseUrl}{media.PosterPath}",
                ReleaseDate = media.ReleaseDate ?? media.FirstAirDate,
                
                // AGORA SIM pegamos os nomes reais dos gêneros (ex: "Ficção científica", "Ação")
                Genres = media.GenresList?.Select(g => g.Name).ToList() ?? new List<string>(),
                
                // Se for série, pegamos o total de episódios para o Tracker!
                TotalProgress = media.NumberOfEpisodes
            };
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"Erro ao buscar detalhes no TMDB: {ex.Message}");
            return null;
        }
    }
}