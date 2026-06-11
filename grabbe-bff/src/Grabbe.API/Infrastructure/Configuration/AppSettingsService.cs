using System;
using System.IO;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;

using Microsoft.Extensions.Hosting;

namespace Grabbe.API.Infrastructure.Configuration;

/// <summary>
/// Service responsible for resolving application settings and credentials.
/// Implements Bring Your Own Key (BYOK) by checking the local SQLite database
/// created by the Tauri client, with a fallback to dotnet configurations/environment variables.
/// </summary>
public class AppSettingsService
{
    private readonly string _dbPath;
    private readonly IConfiguration _configuration;

    /// <summary>
    /// Initializes a new instance of the <see cref="AppSettingsService"/> class.
    /// Resolves the database path dynamically based on the current operating system.
    /// </summary>
    /// <param name="configuration">The .NET configuration instance for fallbacks.</param>
    /// <param name="environment">The hosting environment to distinguish dev and prod databases.</param>
    public AppSettingsService(IConfiguration configuration, IHostEnvironment environment)
    {
        _configuration = configuration;
        _dbPath = GetDatabasePath(environment.IsDevelopment());
    }

    /// <summary>
    /// Checks the operating system and returns the target path to the Tauri local sqlite database.
    /// </summary>
    private static string GetDatabasePath(bool isDevelopment)
    {
        string appIdentifier = isDevelopment ? "com.grabbe.dev" : "com.grabbe.prod";
        var os = Environment.OSVersion.Platform;
        if (os == PlatformID.Win32NT)
        {
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), appIdentifier, "grabbe.db");
        }
        else if (os == PlatformID.Unix)
        {
            var personalPath = Environment.GetFolderPath(Environment.SpecialFolder.Personal);
            var macOsAppSupport = Path.Combine(personalPath, "Library", "Application Support", appIdentifier, "grabbe.db");
            if (Directory.Exists(Path.Combine(personalPath, "Library", "Application Support")))
            {
                return macOsAppSupport;
            }
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), appIdentifier, "grabbe.db");
        }
        else
        {
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Personal), "Library", "Application Support", appIdentifier, "grabbe.db");
        }
    }

    /// <summary>
    /// Reads a configuration setting from the SQLite AppSettings table.
    /// If not found or file does not exist, falls back to the .NET configuration hierarchy.
    /// </summary>
    /// <param name="key">The key identifier of the setting.</param>
    /// <returns>The resolved configuration value, or null if unconfigured.</returns>
    public string? GetSetting(string key)
    {
        if (File.Exists(_dbPath))
        {
            try
            {
                using var connection = new SqliteConnection($"Data Source={_dbPath}");
                connection.Open();

                var command = connection.CreateCommand();
                command.CommandText = "SELECT value FROM AppSettings WHERE key = $key LIMIT 1";
                command.Parameters.AddWithValue("$key", key);

                using var reader = command.ExecuteReader();
                if (reader.Read())
                {
                    var val = reader.IsDBNull(0) ? null : reader.GetString(0);
                    if (!string.IsNullOrEmpty(val))
                    {
                        return val;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AppSettingsService] SQLite query failed for '{key}': {ex.Message}");
            }
        }

        // Fallbacks for environment variables or local appsettings configuration
        if (key == "TMDB_API_KEY")
        {
            return _configuration["TMDB_API_KEY"];
        }
        else if (key == "IGDB_CLIENT_ID")
        {
            return _configuration["IGDB:ClientId"] ?? _configuration["IGDB_CLIENT_ID"];
        }
        else if (key == "IGDB_CLIENT_SECRET")
        {
            return _configuration["IGDB:ClientSecret"] ?? _configuration["IGDB_CLIENT_SECRET"];
        }

        return _configuration[key];
    }
}
