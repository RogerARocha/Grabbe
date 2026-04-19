using DotNetEnv;
using Grabbe.API.Infrastructure.Configuration;
using Grabbe.API.Infrastructure.ExternalClients;

var builder = WebApplication.CreateBuilder(args);

//carrega o arquivo .env.local da raiz do projeto
Env.Load(Path.Combine(Directory.GetCurrentDirectory(), "../../.env.local"));

//injeta as variáveis de ambiente carregadas no sistema de configuração do .NET
builder.Configuration.AddEnvironmentVariables();

//mapeia manualmente as variáveis do .env para a nossa classe de configuração
builder.Services.Configure<ExternalApiOptions>(options =>
{
    options.TmdbApiKey = builder.Configuration["TMDB_API_KEY"] ?? throw new InvalidOperationException("TMDB_API_KEY não configurada.");
    options.GBooksApiKey = builder.Configuration["GBOOKS_API_KEY"] ?? throw new InvalidOperationException("GBOOKS_API_KEY não configurada.");
});

//services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<Grabbe.API.Features.MediaSearch.SearchAggregationService>();
builder.Services.AddScoped<Grabbe.API.Features.MediaDetails.DetailsService>();

// Registra os HttpClients diretamente
builder.Services.AddHttpClient<TmdbClient>(client => 
{
    client.BaseAddress = new Uri("https://api.themoviedb.org/3/");
});

builder.Services.AddHttpClient<JikanClient>(client => 
{
    client.BaseAddress = new Uri("https://api.jikan.moe/v4/");
});

builder.Services.AddHttpClient<GoogleBooksClient>(client => 
{
    client.BaseAddress = new Uri("https://www.googleapis.com/books/v1/");
});

//a Interface enxerga as classes
builder.Services.AddTransient<IMediaProviderClient>(sp => sp.GetRequiredService<TmdbClient>());
builder.Services.AddTransient<IMediaProviderClient>(sp => sp.GetRequiredService<JikanClient>());
builder.Services.AddTransient<IMediaProviderClient>(sp => sp.GetRequiredService<GoogleBooksClient>());

var app = builder.Build();

// Configura o pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();