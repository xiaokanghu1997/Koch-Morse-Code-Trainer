// ==================== 字符集和模式类型 ====================
/**
 * 训练字符集类型
 * - Koch-LCWO: 标准Koch方法序列（41字符）
 * - Letters: 26个英文字母
 * - Numbers: 10个数字
 * - Punctuation: 标点符号
 */
export type TrainingSet = "Koch-LCWO" | "Letters" | "Numbers" | "Punctuation";

/**
 * 练习模式类型
 * - Uniform: 均匀分布（所有字符等概率）
 * - New focus: 新字符重点（2倍权重）
 * - Gradual: 渐进式（新字符1.5倍权重）
 * - Weighted: 难度加权（根据摩尔斯码长度）
 */
export type PracticeMode = "Uniform" | "New focus" | "Gradual" | "Weighted";

/**
 * 播放状态
 * - idle: 空闲（未播放或已停止）
 * - loading: 加载中（生成音频事件）
 * - playing: 播放中
 * - paused: 已暂停
 */
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused';

// ==================== 配置接口 ====================
/**
 * 音频配置接口
 * 包含所有与音频生成相关的参数
 */
export interface AudioConfig {
  /** 字符速率（Words Per Minute - WPM） - 控制点划的播放速度 */
  charSpeed: number;        // 5-50 WPM
  
  /** 有效速率（Words Per Minute - WPM） - 控制整体听写速度 */
  effSpeed: number;         // 0-50 WPM (0表示无Farnsworth)
  
  /** 音调频率（赫兹） */
  tone: number;             // 300-1500 Hz
  
  /** 音量（0-1） */
  volume: number;           // 0.0 - 1.0
}

/**
 * 生成器完整配置接口
 * 继承AudioConfig，增加训练相关参数
 */
export interface GeneratorConfig extends AudioConfig {
  /** 训练字符集 */
  trainingSet: TrainingSet;
  
  /** 练习模式 */
  practiceMode: PracticeMode;
  
  /** 每组字符长度 */
  groupLength: number;      // 1-10
  
  /** 组间间隔（以dit为单位） */
  groupSpacing: number;     // 1-10 dits
  
  /** 音频总时长（分钟） */
  duration: number;         // 1-10 minutes
  
  /** 启动延迟时间（秒） */
  startDelay: number;       // 1-30 seconds
  
  /** 是否使用前后缀（VVV = ...+） */
  usePrefixSuffix: boolean;
}

// ==================== 播放状态接口 ====================

/**
 * 播放状态接口
 * 记录播放过程中的所有状态信息
 */
export interface PlaybackState {
  /** 当前播放状态 */
  status: PlaybackStatus;
  
  /** 当前播放时间（秒） */
  currentTime: number;
  
  /** 总时长（秒） */
  totalDuration: number;
  
  /** 暂停时的时间点（秒） */
  pausedAt: number;
  
  /** 当前播放的字符索引 */
  currentCharIndex: number;
  
  /** 当前播放的字符 */
  currentChar: string | null;
  
  /** 当前播放的文本内容 */
  text: string;
}

// ==================== 课程数据接口 ====================

/**
 * 课程数据接口
 * 描述Koch方法的单个课程
 */
export interface LessonData {
  /** 课程编号（1-based） */
  id: number;
  
  /** 当前课程包含的所有字符 */
  chars: string;            // 例如: "KM", "KMU", "KMUR"
  
  /** 本课新引入的字符 */
  newChar: string;          // 例如: "M", "U", "R"
  
  /** 所属字符集 */
  charSet: TrainingSet;
  
  /** 课程描述（自动生成） */
  description: string;      // 例如: "Lesson 3: KMU (New: U)"
}

// ==================== 音频事件接口 ====================

/**
 * 音频事件类型
 * - gain: 音量变化（控制点划）
 * - frequency: 频率变化（控制音调）
 */
export type AudioEventType = 'gain' | 'frequency';

/**
 * 音频事件接口
 * 描述时间轴上的单个音频事件
 */
export interface AudioEvent {
  /** 事件发生的时间点（相对于播放开始，秒） */
  time: number;
  
  /** 事件类型 */
  type: AudioEventType;
  
  /** 事件值（音量0-1或频率Hz） */
  value: number;
  
  /** 关联的字符（可选，用于字符回调） */
  char?: string;
  
  /** 字符在文本中的索引（可选） */
  charIndex?: number;
}

// ==================== 摩尔斯元素类型 ====================

/**
 * 摩尔斯码元素
 * - .: dit（短音）
 * - -: dah（长音）
 * - (space): 间隔
 */
export type MorseElement = '.' | '-' | ' ';

// ==================== 时序配置接口 ====================

/**
 * 时序配置接口
 * 存储计算得到的所有时间参数
 */
export interface TimingConfig {
  /** dit时长（秒） */
  ditTime: number;
  
  /** dah时长（秒） */
  dahTime: number;
  
  /** 元素间隔时长（秒） - 点划之间 */
  elementSpace: number;
  
  /** 字符间隔时长（秒） */
  charSpace: number;
  
  /** 单词间隔时长（秒） */
  wordSpace: number;
  
  /** 自定义组间间隔时长（秒） */
  groupSpace?: number;
}

// ==================== 文本生成选项接口 ====================

/**
 * 文本生成选项接口
 * 用于TextGenerator.generate()方法
 */
export interface TextGeneratorOptions {
  /** 可用字符集（字符串形式） */
  charSet: string;          // 例如: "KMUR"
  
  /** 练习模式 */
  mode: PracticeMode;
  
  /** 每组字符长度 */
  groupLength: number;
  
  /** 组间间隔（dits） */
  groupSpacing: number;
  
  /** 目标时长（秒） */
  targetDuration: number;
  
  /** 音频配置（用于计算字符数量） */
  audioConfig: AudioConfig;
  
  /** 是否使用前后缀 */
  usePrefixSuffix?: boolean;
}

// ==================== 进度数据接口 ====================

/**
 * 单课程进度接口
 */
export interface LessonProgress {
  /** 课程编号 */
  lessonNum: number;
  
  /** 已完成练习次数 */
  practiceCount: number;
  
  /** 准确率历史记录 */
  accuracyHistory: number[];
  
  /** 最后练习日期 */
  lastPracticeDate: string;  // ISO 8601格式
}

/**
 * 全局统计接口
 */
export interface GlobalStats {
  /** 总练习时长（秒） */
  totalPracticeTime: number;
  
  /** 字符错误统计 */
  characterErrors: Record<string, number>;  // { 'K': 15, 'M': 10, ...}
  
  /** 最后练习日期 */
  lastPracticeDate: string;
}

/**
 * 完整进度数据接口（存储在Tauri Store中）
 */
export interface ProgressData {
  /** 当前学习课程 */
  currentLesson: number;
  
  /** 各课程的进度 */
  lessons: Record<number, Omit<LessonProgress, 'lessonNum'>>;
  
  /** 全局统计 */
  stats: GlobalStats;
}

// ==================== 工具类型 ====================

/**
 * 字符权重映射
 * 用于加权随机选择
 */
export type CharacterWeights = Map<string, number>;

/**
 * 摩尔斯码映射表类型
 */
export type MorseCodeMap = Record<string, string>;