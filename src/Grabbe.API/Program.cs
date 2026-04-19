using DotNetEnv;
using Grabbe.API.Infrastructure.Configuration;


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