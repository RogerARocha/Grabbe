using Grabbe.API.Infrastructure.Configuration;
using Grabbe.API.Infrastructure.ExternalClients;

var builder = WebApplication.CreateBuilder(args);

// API keys are resolved from the .NET configuration hierarchy:
//  - Development: 'dotnet user-secrets' (keeps secrets out of source control)
//  - Production:  System environment variables
// No manual .env file loading is required.
builder.Configuration.AddEnvironmentVariables();

builder.Services.Configure<ExternalApiOptions>(options =>
{
    options.TmdbApiKey = builder.Configuration["TMDB_API_KEY"] ?? throw new InvalidOperationException("TMDB_API_KEY is not configured.");
    options.GBooksApiKey = builder.Configuration["GBOOKS_API_KEY"] ?? throw new InvalidOperationException("GBOOKS_API_KEY is not configured.");
});

builder.Services.AddRouting(options => options.LowercaseUrls = true);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    options.IncludeXmlComments(xmlPath);
});
builder.Services.AddScoped<Grabbe.API.Features.MediaSearch.SearchAggregationService>();
builder.Services.AddScoped<Grabbe.API.Features.MediaDetails.DetailsService>();
builder.Services.AddScoped<MalImportService>();
builder.Services.AddScoped<LetterboxdImportService>();

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

// Each typed HttpClient is also registered as IMediaProviderClient so the aggregation
// and details services can resolve all providers via DI without knowing concrete types.
builder.Services.AddTransient<IMediaProviderClient>(sp => sp.GetRequiredService<TmdbClient>());
builder.Services.AddTransient<IMediaProviderClient>(sp => sp.GetRequiredService<JikanClient>());
builder.Services.AddTransient<IMediaProviderClient>(sp => sp.GetRequiredService<GoogleBooksClient>());

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowTauri",
        policy =>
        {
            policy.WithOrigins("http://localhost:1420", "tauri://localhost")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowTauri");
app.UseAuthorization();
app.MapControllers();

app.Run();