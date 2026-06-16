using Grabbe.API.Infrastructure.Configuration;
using Grabbe.API.Infrastructure.ExternalClients;
using Grabbe.API.Infrastructure.ExternalClients.OpenLibrary;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(18493);
});


// API keys are resolved from the .NET configuration hierarchy:
//  - Development: 'dotnet user-secrets' (keeps secrets out of source control)
//  - Production:  System environment variables
// No manual .env file loading is required.
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddSingleton<Grabbe.API.Infrastructure.Configuration.AppSettingsService>();

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
builder.Services.AddHttpClient<TmdbClient>();
builder.Services.AddHttpClient<JikanClient>();
builder.Services.AddHttpClient<OpenLibraryClient>();
builder.Services.AddHttpClient<IgdbClient>();

// Each typed HttpClient is also registered as IMediaProviderClient so the aggregation
// and details services can resolve all providers via DI without knowing concrete types.
builder.Services.AddTransient<IMediaProviderClient>(sp => sp.GetRequiredService<TmdbClient>());
builder.Services.AddTransient<IMediaProviderClient>(sp => sp.GetRequiredService<JikanClient>());
builder.Services.AddTransient<IMediaProviderClient>(sp => sp.GetRequiredService<OpenLibraryClient>());
builder.Services.AddTransient<IMediaProviderClient>(sp => sp.GetRequiredService<IgdbClient>());

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowTauri",
        policy =>
        {
            policy.WithOrigins("http://localhost:1420", "tauri://localhost", "http://tauri.localhost")
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

// Terminate the sidecar if the parent Tauri process exits (stdin closes)
_ = Task.Run(() =>
{
    try
    {
        while (Console.ReadLine() != null) { }
    }
    catch
    {
        // Ignore errors
    }
    Environment.Exit(0);
});

app.Run();