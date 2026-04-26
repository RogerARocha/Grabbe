# **Documento de Arquitetura de Backend (BFF) — Grabbe**

**Versão:** 1.0

**Stack Principal:** C\# (.NET 8 ou superior), ASP.NET Core Web API

**APIs Integradas:** TMDB (Filmes/Séries), Jikan (Animes/Mangás), Google Books (Livros)

## **1\. Visão Geral da Arquitetura**

O Backend for Frontend (BFF) do Grabbe atua como um intermediário (Agregador e Normalizador) entre o aplicativo desktop local e as APIs públicas de entretenimento. Ele tem três responsabilidades principais:

1. **Unificação de Contratos:** Receber JSONs distintos de 3 APIs diferentes e transformá-los em um único padrão (GrabbeMediaDTO).  
2. **Gerenciamento de Rate Limit:** Enfileirar ou limitar chamadas para não estourar os limites gratuitos das APIs externas (especialmente o Jikan).  
3. **Caching:** Armazenar respostas em memória (IMemoryCache ou Redis) para buscas repetidas, reduzindo a latência para milissegundos.

## **2\. Estrutura do Projeto e Configuração do Ambiente**

O projeto segue uma estrutura baseada em separação de responsabilidades por features (Vertical Slice Architecture). Para garantir o funcionamento correto e evitar problemas de versionamento de código na IDE, a estrutura do repositório deve ser montada da seguinte forma:

Plaintext

grabbe-bff/  
├── .gitignore               \# Deve ignorar .env.local, .idea/ (se aplicável), bin/, obj/  
├── .env.local               \# Arquivo local para chaves de API (NÃO deve ser enviado ao repositório)  
├── Grabbe.BFF.sln           \# Arquivo da solução (Deve ser enviado ao repositório)  
└── src/  
    └── Grabbe.API/  
        ├── Grabbe.API.csproj  \# Arquivo do projeto (Deve ser enviado ao repositório)  
        ├── Program.cs  
        ├── appsettings.json  
        ├── Domain/  
        │   └── DTOs/  
        │       └── GrabbeMediaDTO.cs  
        ├── Features/  
        │   ├── MediaDetails/  
        │   │   ├── DetailsController.cs  
        │   │   └── DetailsService.cs  
        │   └── MediaSearch/  
        │       ├── SearchController.cs  
        │       └── SearchAggregationService.cs  
        └── Infrastructure/  
            ├── Cache/  
            ├── Configuration/  
            │   └── ExternalApiOptions.cs  
            └── ExternalClients/  
                ├── IMediaProviderClient.cs  
                ├── TMDB/  
                ├── Jikan/  
                └── GBooks/

**Setup de Desenvolvimento:**

* A solução pode ser aberta nativamente no Rider, garantindo que os arquivos .sln e .csproj estejam devidamente rastreados pelo Git para manter as referências do projeto intactas em qualquer máquina.  
* As chaves sensíveis (como a API Key do TMDB e Google) devem ficar isoladas no arquivo .env.local na raiz do projeto.

## **3\. Padrões de Concorrência e Performance**

Para buscas globais (quando o usuário não filtra o tipo de mídia e busca em todas as fontes simultaneamente), o BFF deve otimizar o tempo de resposta realizando chamadas assíncronas concorrentes.

O MediaAggregationService utilizará Task.WhenAll para disparar as requisições para o TMDB, Jikan e GBooks ao mesmo tempo, aguardar a resolução de todas, achatar as listas, ordenar por relevância e retornar o array unificado ao frontend.

## **4\. Schemas de Dados (Models / DTOs)**

### **4.1. O Contrato Unificado (Saída do BFF para o Desktop)**

Este é o schema que o aplicativo em React/Tauri vai consumir. O C\# garante que ele sempre saia neste formato.

C\#

namespace Grabbe.API.Domain.DTOs;

public class GrabbeMediaDTO  
{  
    public required string ExternalId { get; set; }  
    public required string SourceApi { get; set; } // "TMDB", "JIKAN", "GBOOKS"  
    public required string Type { get; set; }      // "MOVIE", "SERIES", "ANIME", "MANGA", "BOOK"  
    public required string Title { get; set; }  
    public string? Description { get; set; }  
    public string? CoverImageUrl { get; set; }  
    public string? ReleaseDate { get; set; }       // ISO 8601 (YYYY-MM-DD)  
    public List\<string\> Genres { get; set; } \= new();  
    public int? TotalProgress { get; set; }        // Episódios totais ou páginas do livro  
}

public class PaginatedResponse\<T\>  
{  
    public required IEnumerable\<T\> Data { get; set; }  
    public int CurrentPage { get; set; }  
    public int TotalPages { get; set; }  
    public int TotalResults { get; set; }  
}

### **4.2. Especificações dos Clients Externos (Inputs)**

O C\# mapeará apenas os campos necessários de cada API externa para evitar sobrecarga de memória.

**A. TMDB Client (Filmes e Séries)**

* **Endpoint Base:** https://api.themoviedb.org/3  
* **Autenticação:** Header Authorization: Bearer {TMDB\_READ\_ACCESS\_TOKEN} (Lido do .env.local).  
* **Mapeamento:**  
  * poster\_path \-\> CoverImageUrl (necessita concatenar com https://image.tmdb.org/t/p/w500/)  
  * overview \-\> Description  
  * Se for série (TV), mapear number\_of\_episodes para TotalProgress.

**B. Jikan Client (Animes e Mangás)**

* **Endpoint Base:** https://api.jikan.moe/v4  
* **Autenticação:** Nenhuma (API Aberta).  
* **Restrição Crítica:** Limite de 3 requisições por segundo. O JikanClient deve implementar política de retentativas (ex: Polly library com backoff exponencial) para lidar com o status 429 Too Many Requests.  
* **Mapeamento:**  
  * images.jpg.image\_url \-\> CoverImageUrl  
  * synopsis \-\> Description  
  * episodes (Anime) ou chapters (Mangá) \-\> TotalProgress

**C. Google Books Client (Livros)**

* **Endpoint Base:** https://www.googleapis.com/books/v1  
* **Autenticação:** Query param ?key={GBOOKS\_API\_KEY} (Lido do .env.local).  
* **Mapeamento (extraído de volumeInfo):**  
  * imageLinks.thumbnail \-\> CoverImageUrl  
  * description \-\> Description  
  * pageCount \-\> TotalProgress  
  * authors \-\> Mapeado como meta-informação, se necessário.

## **5\. Endpoints do BFF**

**1\. Busca Específica por Tipo**

GET /api/v1/search?query={texto}\&type={MOVIE|ANIME|BOOK}\&page=1

* Roteia a requisição apenas para a API correspondente utilizando o padrão *Strategy* ou injeção de dependência via interface (ex: IMediaProvider).

**2\. Busca Global (Concorrente)**

GET /api/v1/search?query={texto}

* Aciona o TMDB, Jikan e GBooks simultaneamente via Task.WhenAll.  
* Normaliza os três retornos e mescla em um único IEnumerable\<GrabbeMediaDTO\>.  
* Retorna no máximo os top 5 de cada tipo para performance.

**3\. Detalhes da Mídia**

GET /api/v1/media/{sourceApi}/{type}/{externalId}

* Ex: /api/v1/media/JIKAN/ANIME/11004  
* Busca todos os metadados profundos da obra contornando os limites de cache de busca padrão.

Este documento cobre perfeitamente a fundação do ecossistema .NET para o seu BFF. Com o .sln e a estrutura bem definidos e o controle claro do que é exposto no repositório.

