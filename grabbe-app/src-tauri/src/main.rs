// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::RunEvent;

#[cfg(not(debug_assertions))]
use tauri::Manager;
#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;
#[cfg(not(debug_assertions))]
use tauri_plugin_shell::process::CommandChild;
#[cfg(not(debug_assertions))]
use std::sync::Mutex;

#[cfg(not(debug_assertions))]
struct SidecarState(Mutex<Option<CommandChild>>);

fn main() {
    #[cfg(not(debug_assertions))]
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .manage(SidecarState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![grabbe_app_lib::commands::greet]);

    #[cfg(debug_assertions)]
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![grabbe_app_lib::commands::greet]);

    builder
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            {
                // Spawn the sidecar grabbe-bff
                let sidecar_command = app.shell().sidecar("grabbe-bff")
                    .expect("failed to create sidecar");
                
                let (_, child) = sidecar_command.spawn()
                    .expect("failed to spawn sidecar");
                
                let state = app.state::<SidecarState>();
                let lock = state.0.lock();
                if let Ok(mut child_lock) = lock {
                    *child_lock = Some(child);
                }
            }
            
            // Silence unused variable warning in debug mode
            #[cfg(debug_assertions)]
            let _ = app;
            
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
                #[cfg(not(debug_assertions))]
                {
                    // Graceful shutdown logic: 
                    // Access the state and kill the process if it's still running
                    let state = app_handle.state::<SidecarState>();
                    let lock = state.0.lock();
                    if let Ok(mut child_lock) = lock {
                        if let Some(child) = child_lock.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
            
            // Silence unused variable warning in debug mode
            #[cfg(debug_assertions)]
            let _ = app_handle;
        });
}
