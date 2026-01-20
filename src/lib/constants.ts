import type { TrainingSet, MorseCodeMap } from './types';

// ==================== Koch方法学习序列 ====================

/**
 * 四种字符集的Koch方法推荐学习序列
 * 
 * 每个序列都经过科学设计，按照学习难度递增
 */
export const KOCH_SEQUENCES: Record<TrainingSet, string> = {
  /**
   * Koch-LCWO: 标准Koch方法序列（41字符）
   * 来源: Learn CW Online (lcwo.net)
   * 特点: 优先学习常用字母，逐步引入数字和符号
   */
  'Koch-LCWO': "KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X",
  
  /**
   * Letters: 26个英文字母（按使用频率排序）
   * 基于: 英语字母频率分析
   * 特点: 高频字母优先（E, T, I, A, N...）
   */
  'Letters': "ETIANMSURWDKGOHVFLPJBXCQYZ",
  
  /**
   * Numbers: 10个数字（按自然顺序）
   * 特点: 从1到0，符合日常习惯
   */
  'Numbers': "1234567890",
  
  /**
   * Punctuation: 标点符号（按常用程度）
   * 特点: 句号、逗号等优先
   */
  'Punctuation': ".,?/=+-()@:;'\"!",
} as const;

// ==================== 摩尔斯码映射表 ====================

/**
 * 完整的摩尔斯码映射表
 * 
 * 格式: { 字符: 摩尔斯码 }
 * 说明: 
 * - .: dit（短音）
 * - -: dah（长音）
 * - 大小写字母使用相同编码
 */
export const MORSE_CODE_MAP: MorseCodeMap = {
  // ========== 字母 ==========
  'A': '.-',   'a': '.-',
  'B': '-...', 'b': '-...',
  'C': '-.-.', 'c': '-.-.',
  'D': '-..',  'd': '-..',
  'E': '.',    'e': '.',
  'F': '..-.', 'f': '..-.',
  'G': '--.',  'g': '--.',
  'H': '....', 'h': '....',
  'I': '..',   'i': '..',
  'J': '.---', 'j': '.---',
  'K': '-.-',  'k': '-.-',
  'L': '.-..', 'l': '.-..',
  'M': '--',   'm': '--',
  'N': '-.',   'n': '-.',
  'O': '---',  'o': '---',
  'P': '.--.', 'p': '.--.',
  'Q': '--.-', 'q': '--.-',
  'R': '.-.',  'r': '.-.',
  'S': '...',  's': '...',
  'T': '-',    't': '-',
  'U': '..-',  'u': '..-',
  'V': '...-', 'v': '...-',
  'W': '.--',  'w': '.--',
  'X': '-..-', 'x': '-..-',
  'Y': '-.--', 'y': '-.--',
  'Z': '--..', 'z': '--..',
  
  // ========== 数字 ==========
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  
  // ========== 标点符号 ==========
  '.': '.-.-.-',  // 句号
  ',': '--..--',  // 逗号
  '?': '..--..',  // 问号
  "'": '.----.',  // 撇号
  '!': '-.-.--',  // 感叹号
  '/': '-..-.',   // 斜杠
  '(': '-.--.',   // 左括号
  ')': '-.--.-',  // 右括号
  '&': '. ...',   // and符号
  ':': '---...',  // 冒号
  ';': '-.-.-.',  // 分号
  '=': '-...-',   // 等号
  '+': '.-.-.',   // 加号
  '-': '-....-',  // 减号/连字符
  '_': '..--.-',  // 下划线
  '"': '.-..-.',  // 引号
  '$': '...-..-', // 美元符号
  '@': '.--.-.',  // at符号
  
  // ========== 特殊字符（空格） ==========
  ' ': ' ',       // 单词间隔（特殊处理）
} as const;

// ==================== 配置参数范围 ====================

/**
 * 各项配置参数的最小值和最大值
 * 用于输入验证和UI限制
 */
export const CONFIG_LIMITS = {
  /** 字符速率范围 (WPM) */
  CHAR_SPEED_MIN: 5,
  CHAR_SPEED_MAX: 50,
  
  /** 有效速率范围 (WPM) */
  EFF_SPEED_MIN: 0,        // 0表示不使用Farnsworth
  EFF_SPEED_MAX: 50,
  
  /** 音调频率范围 (Hz) */
  TONE_MIN: 300,
  TONE_MAX: 1500,
  
  /** 音量范围 */
  VOLUME_MIN: 0,
  VOLUME_MAX: 1,
  
  /** 每组字符长度范围 */
  GROUP_LENGTH_MIN: 1,
  GROUP_LENGTH_MAX: 10,
  
  /** 组间间隔范围 (dits) */
  GROUP_SPACING_MIN: 1,
  GROUP_SPACING_MAX: 10,
  
  /** 音频时长范围(分钟) */
  DURATION_MIN: 1,
  DURATION_MAX: 10,
  
  /** 启动延迟范围 (秒) */
  START_DELAY_MIN: 1,
  START_DELAY_MAX: 30,
} as const;

// ==================== 时序常量 ====================

/**
 * 摩尔斯电码时序标准常量
 * 基于PARIS标准
 */
export const TIMING_CONSTANTS = {
  /**
   * PARIS标准系数
   * 公式: ditTime = 1.2 / WPM
   * 说明: "PARIS"这个词在标准速度下占用50个时间单位
   */
  PARIS_STANDARD: 1.2,
  
  /**
   * dah与dit的时长比例
   * dah = dit × 3
   */
  DAH_RATIO: 3,
  
  /**
   * 元素间隔（点划之间）与dit的比例
   * elementSpace = dit × 1
   */
  ELEMENT_SPACE_RATIO: 1,
  
  /**
   * 字符间隔与dit的比例
   * charSpace = dit × 3
   */
  CHAR_SPACE_RATIO: 3,
  
  /**
   * 单词间隔与dit的比例
   * wordSpace = dit × 7
   */
  WORD_SPACE_RATIO: 7,
  
  /**
   * Farnsworth timing计算中的总间隔单位
   * PARIS包含: 31个元素 + 19个间隔单位
   * 间隔单位分布: 字符间4次×3 + 单词间1次×7 = 19
   */
  FARNSWORTH_SPACE_UNITS: 19,
  
  /**
   * 淡入淡出时长（秒）
   * 用于防止音频爆音
   */
  FADE_DURATION: 0.005,  // 5毫秒
} as const;

// ==================== 前后缀配置 ====================

/**
 * 练习音频的前后缀标记
 * 用于标识练习开始和结束
 */
export const PREFIX_SUFFIX = {
  /** 前缀: "VVV = " */
  PREFIX: "VVV = ",
  
  /** 后缀: " AR" */
  SUFFIX: " AR",
} as const;

// ==================== 默认配置 ====================

/**
 * 默认音频配置
 */
export const DEFAULT_AUDIO_CONFIG = {
  charSpeed: 20,
  effSpeed: 10,
  tone: 600,
  volume: 1.0,
} as const;

/**
 * 默认生成器配置
 */
export const DEFAULT_GENERATOR_CONFIG = {
  ...DEFAULT_AUDIO_CONFIG,
  trainingSet: 'Koch-LCWO' as TrainingSet,
  practiceMode: 'Gradual' as const,
  groupLength: 5,
  groupSpacing: 1,
  duration: 1,
  startDelay: 3,
  usePrefixSuffix: false,
} as const;

// ==================== 预览配置 ====================

/**
 * 预览音频的固定配置
 */
export const PREVIEW_CONFIG = {
  /** 预览时长（秒） */
  DURATION: 20,
  
  /** 预览分组长度 */
  GROUP_LENGTH: 5,
} as const;

// ==================== 工具函数 ====================

/**
 * 获取字符集信息
 * @param set - 字符集类型
 * @returns 字符集元数据
 */
export function getTrainingSetInfo(set: TrainingSet) {
  const sequence = KOCH_SEQUENCES[set];
  
  return {
    name: set,
    totalChars: sequence.length,
    totalLessons: sequence.length - 1,  // 第1课包含2个字符
    sequence,
    examples: {
      lesson1: sequence.slice(0, 2),      // 第1课
      lesson5: sequence.slice(0, 6),      // 第5课
      lastLesson: sequence,               // 最后一课（全部字符）
    },
  };
}

/**
 * 验证配置参数是否在有效范围内
 * @param value - 要验证的值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 是否有效
 */
export function isConfigValueValid(value: number, min: number, max: number): boolean {
  return value >= min && value <= max && ! isNaN(value);
}

/**
 * 将值限制在有效范围内
 * @param value - 输入值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制后的值
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}