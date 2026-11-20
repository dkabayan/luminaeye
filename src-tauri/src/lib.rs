mod monitor_gamma;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::Manager;

pub struct DesktopConfig {
    pub close_to_tray: Arc<AtomicBool>,
}

#[tauri::command]
fn set_monitor_filter(kelvin: u32, brightness: f64, enabled: bool) -> bool {
    monitor_gamma::apply_filter(kelvin, brightness, enabled)
}

#[tauri::command]
fn reset_monitor_filter() -> bool {
    monitor_gamma::reset_filter()
}

#[tauri::command]
fn set_close_to_tray(enabled: bool, state: tauri::State<'_, DesktopConfig>) {
    state.close_to_tray.store(enabled, Ordering::SeqCst);
}

#[tauri::command]
fn get_close_to_tray(state: tauri::State<'_, DesktopConfig>) -> bool {
    state.close_to_tray.load(Ordering::SeqCst)
}

#[tauri::command]
fn set_break_fullscreen(app: tauri::AppHandle, active: bool) {
    if let Some(window) = app.get_webview_window("main") {
        if active {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_always_on_top(true);
            let _ = window.set_fullscreen(true);
            let _ = window.set_focus();
        } else {
            let _ = window.set_fullscreen(false);
            let _ = window.set_always_on_top(false);
        }
    }
}

#[tauri::command]
fn set_launch_on_startup(enabled: bool) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        if enabled {
            let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
            let exe_path = current_exe.to_string_lossy().to_string();
            let status = std::process::Command::new("reg")
                .args([
                    "add",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    "LuminaEye",
                    "/t",
                    "REG_SZ",
                    "/d",
                    &format!("\"{}\"", exe_path),
                    "/f",
                ])
                .status()
                .map_err(|e| e.to_string())?;
            Ok(status.success())
        } else {
            let status = std::process::Command::new("reg")
                .args([
                    "delete",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    "LuminaEye",
                    "/f",
                ])
                .status()
                .map_err(|e| e.to_string())?;
            Ok(status.success())
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = enabled;
        Ok(false)
    }
}

#[tauri::command]
fn get_launch_on_startup() -> bool {
    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("reg")
            .args([
                "query",
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                "/v",
                "LuminaEye",
            ])
            .output();
        match output {
            Ok(out) => out.status.success(),
            Err(_) => false,
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        false
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let desktop_config = DesktopConfig {
        close_to_tray: Arc::new(AtomicBool::new(true)),
    };

    tauri::Builder::default()
        .manage(desktop_config)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            monitor_gamma::init_backup();

            // Setup System Tray
            let show_item = tauri::menu::MenuItem::with_id(
                app,
                "show",
                "Buka LuminaEye",
                true,
                None::<&str>,
            )?;
            let quit_item = tauri::menu::MenuItem::with_id(
                app,
                "quit",
                "Keluar dari LuminaEye",
                true,
                None::<&str>,
            )?;
            let menu = tauri::menu::Menu::with_items(app, &[&show_item, &quit_item])?;

            let mut tray_builder = tauri::tray::TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        monitor_gamma::reset_filter();
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _tray = tray_builder.build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_monitor_filter,
            reset_monitor_filter,
            set_close_to_tray,
            get_close_to_tray,
            set_launch_on_startup,
            get_launch_on_startup,
            set_break_fullscreen
        ])
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                let state = window.state::<DesktopConfig>();
                if state.close_to_tray.load(Ordering::SeqCst) {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
            tauri::WindowEvent::Destroyed => {
                monitor_gamma::reset_filter();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
