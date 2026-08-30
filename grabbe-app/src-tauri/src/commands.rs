use std::fs::File;
use std::io::Write;
use std::sync::Mutex;
use futures_util::StreamExt;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

pub struct PendingUpdateState(pub Mutex<Option<String>>);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgressPayload {
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub percentage: f64,
    pub done: bool,
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn validate_update_source(url: &str, filename: &str) -> Result<(), String> {
    // 1. Validate filename: Prevent path traversal and enforce safe executable extensions
    if filename.contains('/') || filename.contains('\\') || filename.contains("..") {
        return Err("Security Error: Invalid filename. Directory traversal characters detected.".to_string());
    }
    if !filename.ends_with(".exe") && !filename.ends_with(".msi") {
        return Err("Security Error: Only .exe and .msi binaries are permitted for execution.".to_string());
    }

    // 2. Validate URL: Strictly allow only authentic GitHub Releases download endpoints
    let is_trusted_domain = url.starts_with("https://github.com/RogerARocha/Grabbe/releases/download/")
        || url.starts_with("https://objects.githubusercontent.com/")
        || url.starts_with("https://github-releases.githubusercontent.com/");

    if !is_trusted_domain {
        return Err("Security Error: Update URL is not from a trusted Grabbe GitHub Releases domain.".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn check_cached_installer(app: AppHandle, filename: String) -> Option<String> {
    if let Err(err) = validate_update_source("https://github.com/RogerARocha/Grabbe/releases/download/", &filename) {
        eprintln!("check_cached_installer validation failed: {}", err);
        return None;
    }

    let target_dir = std::env::temp_dir();
    let part_path = target_dir.join(format!("{}.download", filename));
    let file_path = target_dir.join(&filename);

    // Clean up any incomplete partial downloads left from previous runs
    if part_path.exists() {
        let _ = std::fs::remove_file(&part_path);
    }

    if file_path.exists() {
        if let Ok(metadata) = std::fs::metadata(&file_path) {
            // Check that the file is not 0 bytes or corrupted (a valid installer binary is > 1 MB)
            if metadata.len() > 1_000_000 {
                let path_str = file_path.to_string_lossy().to_string();
                if let Some(state) = app.try_state::<PendingUpdateState>() {
                    if let Ok(mut lock) = state.0.lock() {
                        *lock = Some(path_str.clone());
                    }
                }
                return Some(path_str);
            } else {
                // Remove corrupted or zero-byte file
                let _ = std::fs::remove_file(&file_path);
            }
        }
    }
    None
}

#[tauri::command]
pub async fn download_update_file(
    app: AppHandle,
    url: String,
    filename: String,
) -> Result<String, String> {
    // Validate target URL and filename before downloading
    validate_update_source(&url, &filename)?;

    let client = reqwest::Client::builder()
        .user_agent("Grabbe-App-Updater")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to send download request: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Download failed with HTTP status: {}", res.status()));
    }

    let total_bytes = res.content_length().unwrap_or(0);
    let target_dir = std::env::temp_dir();
    let part_path = target_dir.join(format!("{}.download", filename));
    let final_path = target_dir.join(&filename);

    // Clean up any stale partial download before starting
    if part_path.exists() {
        let _ = std::fs::remove_file(&part_path);
    }

    let mut file = File::create(&part_path)
        .map_err(|e| format!("Failed to create temporary file {:?}: {}", part_path, e))?;

    let mut downloaded_bytes: u64 = 0;
    let mut stream = res.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| format!("Error while downloading chunk: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("Error writing chunk to file: {}", e))?;

        downloaded_bytes += chunk.len() as u64;
        let percentage = if total_bytes > 0 {
            (downloaded_bytes as f64 / total_bytes as f64) * 100.0
        } else {
            0.0
        };

        let _ = app.emit(
            "updater://progress",
            DownloadProgressPayload {
                downloaded_bytes,
                total_bytes,
                percentage,
                done: false,
            },
        );
    }

    // Flush file buffers to disk before rename
    file.flush()
        .map_err(|e| format!("Failed to flush file to disk: {}", e))?;
    drop(file);

    // Atomic rename: Only promote .download to final executable once 100% completed
    if final_path.exists() {
        let _ = std::fs::remove_file(&final_path);
    }
    std::fs::rename(&part_path, &final_path)
        .map_err(|e| format!("Failed to finalize downloaded installer: {}", e))?;

    let path_str = final_path.to_string_lossy().to_string();

    // Register pending update so when user exits/closes the app, installer is triggered
    if let Some(state) = app.try_state::<PendingUpdateState>() {
        if let Ok(mut lock) = state.0.lock() {
            *lock = Some(path_str.clone());
        }
    }

    let _ = app.emit(
        "updater://progress",
        DownloadProgressPayload {
            downloaded_bytes,
            total_bytes: downloaded_bytes,
            percentage: 100.0,
            done: true,
        },
    );

    Ok(path_str)
}

#[tauri::command]
pub fn launch_installer_and_exit(app: AppHandle, file_path: String) -> Result<(), String> {
    // Register pending update so that RunEvent::Exit handles sidecar termination and launch cleanly
    if let Some(state) = app.try_state::<PendingUpdateState>() {
        if let Ok(mut lock) = state.0.lock() {
            *lock = Some(file_path);
        }
    }

    app.exit(0);
    Ok(())
}



