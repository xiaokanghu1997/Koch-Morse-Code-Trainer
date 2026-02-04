// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_log::log;
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::*;
#[cfg(target_os = "windows")]
use windows::Win32::Graphics::Dwm::*;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::*;
#[cfg(target_os = "windows")]
use tauri_plugin_log::{Target, TargetKind};

// 设置窗口透明度
#[tauri::command]
fn set_window_opacity(window: tauri::Window, opacity: f64) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    use std::ffi::c_void;

    let hwnd = HWND(window.hwnd().map_err(|e| e.to_string())?.0 as *mut c_void);

    unsafe {
      // 设置分层窗口样式
      let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
      SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style | WS_EX_LAYERED.0 as i32);
      // 设置窗口透明度
      let alpha = (opacity.clamp(0.1, 1.0) * 255.0) as u8;
      SetLayeredWindowAttributes(hwnd, COLORREF(0), alpha, LWA_ALPHA)
        .map_err(|e| format!("Failed to set window opacity: {:?}", e))?;
    }
  }
  Ok(())
}

// 设置窗口圆角
fn set_window_corner(window: &tauri::WebviewWindow) -> Result<(), String> {
  use std::ffi::c_void;

  let hwnd = HWND(window.hwnd().map_err(|e| e.to_string())?.0 as *mut c_void);

  // 圆角样式
  // DWMWCP_DEFAULT = 0       // 系统默认
  // DWMWCP_DONOTROUND = 1    // 不圆角
  // DWMWCP_ROUND = 2         // 圆角
  // DWMWCP_ROUNDSMALL = 3    // 小圆角
  let corner_preference = DWMWCP_ROUND;

  unsafe {
    DwmSetWindowAttribute(
      hwnd,
      DWMWA_WINDOW_CORNER_PREFERENCE,
      &corner_preference as *const _ as *const c_void,
      std::mem::size_of_val(&corner_preference) as u32,
    )
    .map_err(|e| format!("Failed to set window corner:  {:?}", e))?;
  }
  Ok(())
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(
      tauri_plugin_log::Builder::new()
        .targets([
          Target::new(TargetKind::LogDir { file_name: None }),
        ])
        .level(log::LevelFilter::Info)
        .build(),
    )
    .invoke_handler(tauri::generate_handler![set_window_opacity])
    .setup(|app| {
      // 获取主窗口
      let window = app.get_webview_window("main").unwrap();
      // 设置窗口圆角（仅 Windows）
      #[cfg(target_os = "windows")]
      {
        set_window_corner(&window)?;
      }
    Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
