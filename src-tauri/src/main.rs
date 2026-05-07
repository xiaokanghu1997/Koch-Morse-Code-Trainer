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

  let mut rng = rand::rng();
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

use serde_json::{json, Value};

// 生成随机时间（HHMM格式）
fn generate_random_time() -> String {
  let mut rng = rand::rng();
  let hour = rng.random_range(0..24);
  let minute = rng.random_range(0..60);
  format!("{:02}{:02}", hour, minute)
}

// 生成顺序时间
fn generate_chronologic_times(count: usize) -> Vec<String> {
  // 随机选择一个起始时间
  let mut rng = rand::rng();
  let start_hour = rng.random_range(0..24);
  let start_minute = rng.random_range(0..60);
  let mut start_time = start_hour * 60 + start_minute; // 转换为HHMM格式的整数

  let mut times = Vec::new();
  for _ in 0..count {
    let hour = (start_time / 60) % 24;
    let minute = start_time % 60;
    times.push(format!("{:02}{:02}", hour, minute));
    // 增加随机的时间间隔（1-5分钟）
    start_time += rng.random_range(1..6);
  }
  times
}

// 生成顺序时间（同一个小时内）
fn generate_abbreviated_times(count: usize) -> Vec<String> {
  // 随机选择一个小时
  let mut rng = rand::rng();
  let hour = rng.random_range(0..24);
  // 确保有足够的分钟数来生成所需的时间数量
  let max_start_minute = if count < 60 { 60 - count } else { 0 };
  let mut minute = if max_start_minute > 0 {
    rng.random_range(0..max_start_minute)
  } else {
    0
  };

  let mut times = Vec::new();
  for _ in 0..count {
    times.push(format!("{:02}{:02}", hour, minute));
    // 递增 1-5 分钟，但不超过 59 分钟
    minute = (minute + rng.random_range(1..6)).min(59);
  }
  times
}

// 数字缩写函数
fn abbreviate_number(input: &str, mode: u8) -> String {
  if mode == 0 {
    return input.to_string();
  }
  // 定义缩写规则
  let (from_chars, to_chars): (Vec<char>, Vec<char>) = match mode {
    1 => {
      // 只缩写 0, 1, 9
      (vec!['1', '9', '0'], vec!['A', 'N', 'T'])
    }
    2 => {
      // 全部数字缩写
      (
        vec!['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 
        vec!['A', 'U', 'V', '4', 'E', '6', 'B', 'D', 'N', 'T']
      )
    }
    _ => return input.to_string(),
  };
  // 逐字符替换
  input.chars().map(|c| {
    from_chars.iter()
      .position(|&fc| fc == c)
      .map(|i| to_chars[i])
      .unwrap_or(c)
  }).collect()
}

// 获取随机 QTC 组
#[tauri::command]
fn get_random_qtc(
  abbrenumbers: u8,
  chronologic: bool,
  abbretimes: bool
) -> Value {
  let mut rng = rand::rng();
  // 组号 1-999
  let group = rng.random_range(1..1000);
  // 呼号池
  let callsign_pool: Vec<String> = CALLSIGN_NO_FILTER
    .lines()
    .map(|s| s.trim().to_string())
    .filter(|s| !s.is_empty())
    .collect();
  // 生成时间
  let times = if chronologic {
    if abbretimes {
      generate_abbreviated_times(10)
    } else {
      generate_chronologic_times(10)
    }
  } else {
    (0..10).map(|_| generate_random_time()).collect()
  };
  // 生成 10 条 QTC 记录
  let mut qtcs = Vec::new();
  for time in times {
    let serial = rng.random_range(10..1000).to_string();
    let callsign = random_sample(&callsign_pool, 1)
      .first()
      .unwrap_or(&"NOCALL".to_string())
      .clone();
    // 应用数字缩写
    let time_abbrev = abbreviate_number(&time, abbrenumbers);
    let serial_abbrev = abbreviate_number(&serial, abbrenumbers);

    qtcs.push(json!({
      "time": time_abbrev,
      "callsign": callsign,
      "serial": serial_abbrev
    }));
  }
  json!({
    "grnum": format!("{}/10", group),
    "qtcs": qtcs
  })
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
      get_random_words,
      get_random_callsigns,
      get_random_qtc
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
