// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, RunEvent};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;
use std::sync::Mutex;

struct SidecarState(Mutex<Option<CommandChild>>);

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .manage(SidecarState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![grabbe_app_lib::commands::greet])
        .setup(|app| {
            // Spawn the sidecar grabbe-bff
            let sidecar_command = app.shell().sidecar("grabbe-bff")
                .expect("failed to create sidecar");
            
            let (_, child) = sidecar_command.spawn()
                .expect("failed to spawn sidecar");
            
            let state = app.state::<SidecarState>();
            if let Ok(mut child_lock) = state.0.lock() {
                *child_lock = Some(child);
            }
            
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
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
        });
}
