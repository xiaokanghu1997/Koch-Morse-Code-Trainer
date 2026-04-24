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

use rand::prelude::*;

// 嵌入数据文件
const CALLSIGN_SHORT: &str = include_str!("../data/callsign_only_short.txt");
const CALLSIGN_NO_SLASH: &str = include_str!("../data/callsign_no_slash.txt");
const CALLSIGN_NO_FILTER: &str = include_str!("../data/callsign_no_filter.txt");

const WORD_ABBREV: &str = include_str!("../data/word_abbrev.txt");
const WORD_QCODE_COMMON: &str = include_str!("../data/word_qcode_common.txt");
const WORD_QCODE_UNCOMMON: &str = include_str!("../data/word_qcode_uncommon.txt");
const WORD_COMMON: &str = include_str!("../data/word_common.txt");

// 随机抽取（不重复）
fn random_sample(words: &[String], count: usize) -> Vec<String> {
  if words.is_empty() {
    return Vec::new();
  }

  let mut rng: ThreadRng = rand::rng();
  let actual_count = count.min(words.len());

  // 复制并洗牌
  let mut shuffled = words.to_vec();
  shuffled.shuffle(&mut rng);
  shuffled.truncate(actual_count);
  shuffled
}

// 分层抽样结构
struct StratifiedSample {
  abbrev: Vec<String>,
  qcode_common: Vec<String>,
  qcode_uncommon: Vec<String>,
  words: Vec<String>,
}

impl StratifiedSample {
  fn new() -> Self {
    Self {
      abbrev: WORD_ABBREV
        .lines()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect(),

      qcode_common: WORD_QCODE_COMMON
        .lines()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect(),
      
      qcode_uncommon: WORD_QCODE_UNCOMMON
        .lines()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect(),
      
      words: WORD_COMMON
        .lines()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect(),
    }
  }

  fn sample_qcode(&self, count: usize) -> Vec<String> {
    let common_count = (count as f32 * 0.6).round() as usize;
    let uncommon_count = count - common_count;

    let mut result = Vec::new();
    result.extend(random_sample(&self.qcode_common, common_count));
    result.extend(random_sample(&self.qcode_uncommon, uncommon_count));
    result
  }

  fn stratified_sample(&self, datasets: &[String], total_count: usize) -> Vec<String> {
    let has_abbrev = datasets.contains(&"abbres".to_string());
    let has_qcode = datasets.contains(&"qcodes".to_string());
    let has_words = datasets.contains(&"words".to_string());

    let count_selected = [has_abbrev, has_qcode, has_words]
      .iter()
      .filter(|&&x| x)
      .count();

    let mut result = match count_selected {
      0 => Vec::new(),

      1 => {
        if has_abbrev {
          random_sample(&self.abbrev, total_count)
        } else if has_qcode {
          self.sample_qcode(total_count)
        } else {
          random_sample(&self.words, total_count)
        }
      }

      2 => {
        let mut temp = Vec::new();
        if has_abbrev && has_qcode {
          let abbrev_count = (total_count as f32 * 0.5).round() as usize;
          let qcode_count = total_count - abbrev_count;
          temp.extend(random_sample(&self.abbrev, abbrev_count));
          temp.extend(self.sample_qcode(qcode_count));
        } else if has_abbrev && has_words {
          let abbrev_count = (total_count as f32 * 2.0 / 3.0).round() as usize;
          let words_count = total_count - abbrev_count;
          temp.extend(random_sample(&self.abbrev, abbrev_count));
          temp.extend(random_sample(&self.words, words_count));
        } else if has_qcode && has_words {
          let qcode_count = (total_count as f32 * 2.0 / 3.0).round() as usize;
          let words_count = total_count - qcode_count;
          temp.extend(self.sample_qcode(qcode_count));
          temp.extend(random_sample(&self.words, words_count));
        }
        temp
      }

      3 => {
        let abbrev_count = (total_count as f32 * 0.4).round() as usize;
        let qcode_count = (total_count as f32 * 0.4).round() as usize;
        let words_count = total_count - abbrev_count - qcode_count;
        let mut temp = Vec::new();
        temp.extend(random_sample(&self.abbrev, abbrev_count));
        temp.extend(self.sample_qcode(qcode_count));
        temp.extend(random_sample(&self.words, words_count));
        temp
      }

      _ => Vec::new(),
    };

    // 对于多类别抽样，最后打乱顺序
    if count_selected > 1 && !result.is_empty() {
      let mut rng = rand::rng();
      result.shuffle(&mut rng);
    }
    result
  }
}

// 获取随机单词
#[tauri::command]
fn get_random_words(count: usize, datasets: Vec<String>) -> Vec<String> {
  if datasets.is_empty() {
    return Vec::new();
  }

  let sample = StratifiedSample::new();
  sample.stratified_sample(&datasets, count)
}

// 获取随机呼号
#[tauri::command]
fn get_random_callsigns(count: usize, filter: String) -> Vec<String> {
  let data_source = match filter.as_str() {
    "short" => CALLSIGN_SHORT,
    "no-slashed" => CALLSIGN_NO_SLASH,
    "all" => CALLSIGN_NO_FILTER,
    _ => CALLSIGN_SHORT,
  };

  let pool: Vec<String> = data_source
    .lines()
    .map(|s| s.trim().to_string())
    .filter(|s| !s.is_empty())
    .collect();

  random_sample(&pool, count)
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
    .invoke_handler(tauri::generate_handler![
      set_window_opacity,
      get_random_callsigns,
      get_random_words
    ])
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
