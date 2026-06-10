using Grabbe.API.Domain.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace Grabbe.API.Infrastructure.ExternalClients.OpenLibrary;

/// <summary>
/// <see cref="IMediaProviderClient"/> implementation for the Open Library API.
/// It provides access to public book metadata without requiring an API key.
/// </summary>
public class OpenLibraryClient : IMediaProviderClient
{
    private readonly HttpClient _httpClient;

    /// <inheritdoc/>
    public string ProviderName => "OPENLIBRARY";

    /// <inheritdoc/>
    public string[] SupportedTypes => new[] { "BOOK" };

    /// <summary>
    /// Initializes a new instance of the <see cref="OpenLibraryClient"/> class.
    /// Configures the base address and required headers for Open Library access.
    /// </summary>
    /// <param name="httpClient">The HTTP client instance.</param>
    public OpenLibraryClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://openlibrary.org/");
        // Open Library API requests must identify the client app as per their guidelines.
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "GrabbeApp/1.0 (contact: rogerrochaa1@gmail.com)");
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<GrabbeMediaDTO>> SearchAsync(string query, string type)
    {
        try
        {
            var endpoint = $"search.json?q={Uri.EscapeDataString(query)}&limit=10&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,publisher,ratings_average,language";
            var response = await _httpClient.GetFromJsonAsync<OpenLibrarySearchResponse>(endpoint);

            if (response?.Docs == null) return Array.Empty<GrabbeMediaDTO>();

            return response.Docs.Select(doc => doc.ToUniversalDto());
        }
        catch (HttpRequestException)
        {
            return Array.Empty<GrabbeMediaDTO>();
        }
    }

    /// <inheritdoc/>
    public async Task<GrabbeMediaDTO?> GetDetailsAsync(string externalId, string type)
    {
        return await RetryHelper.ExecuteWithRetryAsync(
            async () => await FetchDetailsAsync(externalId),
            maxRetries: 3,
            delayMilliseconds: 1000,
            shouldRetry: ex => ex is ExternalProviderException pEx && (pEx.StatusCode == null || pEx.StatusCode == System.Net.HttpStatusCode.TooManyRequests || (int)pEx.StatusCode >= 500)
        );
    }

    private async Task<GrabbeMediaDTO?> FetchDetailsAsync(string externalId)
    {
        try
        {
            var endpoint = $"works/{Uri.EscapeDataString(externalId)}.json";
            var work = await _httpClient.GetFromJsonAsync<OpenLibraryWorkResponse>(endpoint);

            if (work == null) return null;

            var authorNames = new List<string>();
            if (work.Authors != null && work.Authors.Any())
            {
                // Concurrently fetch and resolve author names from individual author profiles
                var authorTasks = work.Authors
                    .Where(a => a.Author != null && !string.IsNullOrEmpty(a.Author.Key))
                    .Select(async a =>
                    {
                        try
                        {
                            var authorKey = a.Author!.Key.TrimStart('/');
                            var authorObj = await _httpClient.GetFromJsonAsync<OpenLibraryAuthorResponse>($"{authorKey}.json");
                            return authorObj?.Name;
                        }
                        catch
                        {
                            return null;
                        }
                    });
                var resolved = await Task.WhenAll(authorTasks);
                authorNames.AddRange(resolved.Where(n => !string.IsNullOrEmpty(n))!);
            }

            return work.ToUniversalDto(authorNames);
        }
        catch (HttpRequestException ex)
        {
            if (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }
            throw new ExternalProviderException(ProviderName, ex.StatusCode, "Open Library request failed.", ex);
        }
    }
}
