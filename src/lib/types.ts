// ==================== 基础类型 ====================
/**
 * 训练字符集类型
 * - Koch-LCWO: 标准Koch方法序列（41字符）
 * - Letters: 26个英文字母
 * - Numbers: 10个数字
 * - Punctuation: 标点符号
 */
export type DatasetNames = "Koch-LCWO" | "Letters" | "Numbers" | "Punctuation";

/**
 * 练习模式类型
 * - Uniform: 均匀分布（所有字符等概率）
 * - New focus: 新字符重点（2倍权重）
 * - Gradual: 渐进式（新字符1.5倍权重）
 * - Weighted: 难度加权（根据摩尔斯码长度）
 */
export type PracticeModes = "Uniform" | "New focus" | "Gradual" | "Weighted";

/**
 * 播放状态
 * - idle: 空闲（未播放或已停止）
 * - playing: 播放中
 * - paused: 已暂停
 */
export type PlaybackStatus = "idle" | "playing" | "paused";

/**
 * 字符比对结果类型
 * - correct: 正确
 * - incorrect: 错误
 * - extra: 多余
 * - missing: 缺失
 */
export type ComparisonTypes = "correct" | "incorrect" | "extra" | "missing";

/**
 * 时间段统计类型
 * - default: 默认（时间戳）
 * - hour: 按小时统计
 * - day: 按天统计
 * - month: 按月统计
 * - year: 按年统计
 */
export type TimeStatTypes = "default" | "hour" | "day" | "month" | "year";

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
}

/**
 * 生成器完整配置接口
 * 继承AudioConfig，增加训练相关参数
 */
export interface GeneratorConfig extends AudioConfig {
  /** 训练字符集 */
  datasetName: DatasetNames;
  
  /** 练习模式 */
  practiceMode: PracticeModes;
  
  /** 每组字符长度 */
  groupLength: number;      // 1-10 字符

  /** 是否随机每组字符长度 */
  randomGroupLength: boolean;
  
  /** 组间间隔 */
  groupSpace: number;       // 1-10 空格单位
  
  /** 组数 */
  groupCount: number;       // 1-30 组
  
  /** 启动延迟时间（秒） */
  startDelay: number;       // 1-10 秒
  
  /** 是否使用前后缀（VVV = ... AR） */
  usePrefixSuffix: boolean;
}

// ==================== 文本生成接口 ====================

/**
 * 文本生成选项接口
 */
export interface TextGeneratorOptions {
  /** 字符集 */
  charSet: string;
  /** 练习模式 */
  mode: PracticeModes;
  /** 每组字符长度（固定长度模式） */
  groupLength: number;
  /** 是否随机组长度 */
  randomGroupLength: boolean;
  /** 组间间隔（空格数） */
  groupSpace: number;
  /** 组数 */
  groupCount: number;
  /** 是否使用前后缀 */
  usePrefixSuffix: boolean;
}

// ==================== 时序配置接口 ====================

/**
 * 时序配置接口
 * 定义摩尔斯码各部分的时间长度（秒）
 */
export interface TimingConfig {
  /** 点的时长 */
  ditTime: number;
  
  /** 划的时长 */
  dahTime: number;

  /** 元素间隔（点划之间） */
  elementSpace: number;
  
  /** 字符间隔 */
  charSpace: number;

  /** 单词间隔 */
  wordSpace: number;
}

// ==================== 音频事件接口 ====================

/**
 * 音频事件接口（内部使用）
 * 定义播放过程中触发的各种事件
 */
export interface AudioEvent {
  /** 事件发生时间（秒） */
  time: number;

  /** 事件类型 */
  type: "gain" | "frequency";

  /** 事件值 */
  value: number;

  /** 关联字符 */
  char?: string;
  
  /** 字符索引 */
  charIndex?: number;
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
}

// ==================== 课程信息接口 ====================

/**
 * 课程信息接口
 * 包含课程的编号、字符、显示格式
 */
export interface Lesson {
  /** 课程编号 */
  lessonNumber: number;
  
  /** 课程字符 */
  characters: string[];

  /** 显示格式：第1课 "01 - K, M"，第2课 "02 - U" */
  displayText: string;
}

// ==================== 练习记录接口 ====================

/**
 * 单次练习记录
 * 包含练习时间戳、时长、准确率
 */
export interface TrainingRecord {
  /** 练习时间戳 */
  timestamp: string;

  /** 练习时长（秒） */
  duration: number;

  /** 准确率（0-100） */
  accuracy: number;
}

/**
 * 课程练习记录
 * 包含该次课程的总练习时长、总练习次数、平均准确率及单次记录列表
 */
export interface LessonRecords {
  /** 总练习时长（秒） */
  totalDuration: number;

  /** 总练习次数 */
  recordCount: number;

  /** 平均准确率（0-100） */
  averageAccuracy: number;

  /** 单次练习记录列表 */
  records: TrainingRecord[];
}

/**
 * 数据集练习记录
 * 包含所有课程的总练习时长、总练习次数、平均准确率及各课程记录列表
 */
export interface DatasetRecords {
  /** 总练习时长（秒） */
  totalDuration: number;

  /** 总练习次数 */
  recordCount: number;

  /** 平均准确率（0-100） */
  averageAccuracy: number;

  /** 各课程练习记录列表 */
  lessons: Record<number, LessonRecords>;
}

/**
 * 整体练习记录
 * 包含所有数据集的总练习时长、总练习次数、平均准确率及各数据集记录列表
 */
export interface GlobalRecords {
  /** 总练习时长（秒） */
  totalDuration: number;

  /** 总练习次数 */
  recordCount: number;

  /** 平均准确率（0-100） */
  averageAccuracy: number;

  /** 各数据集练习记录列表 */
  datasets: Record<string, DatasetRecords>;
}

// =================== 准确率计算接口 ====================

/** 
 * 字符比对结果
 * 包含字符、比对类型及索引位置
 */
export interface ComparisonResult {
  /** 字符 */
  char: string;

  /** 比对类型 */
  type: ComparisonTypes;

  /** 字符位置索引 */
  index: number;
}

/** 
 * 准确率计算结果
 * 包含准确率、正确字符数、总字符数、字符比对结果列表及正确答案
 */
export interface AccuracyResult {
  /** 准确率（0-100） */
  accuracy: number;

  /** 字符比对结果列表 */
  comparisons: ComparisonResult[];

  /** 正确答案 */
  correctText: string;
}

// ==================== 统计接口 ====================

/**
 * 时间段统计
 * 包含时间标签、总练习时长、总练习次数及平均准确率
 */
export interface TimeStats {
  /** 时间标签 */
  timeLabel: string;

  /** 总练习时长（秒） */
  totalDuration: number;

  /** 总练习次数 */
  recordCount: number;

  /** 平均准确率（0-100） */
  averageAccuracy: number;
}

/**
 * 时间段统计结果
 * 包含时间标签列表、练习时长列表、练习次数列表及平均准确率列表
 */
export interface TimeStatsResult {
  /** 时间标签列表 */
  timeLabels: string[];

  /** 练习时长列表 */
  totalDurations: number[];

  /** 练习次数列表 */
  recordCounts: number[];

  /** 平均准确率列表 */
  averageAccuracies: number[];

  /** 详细数据 */
  details: TimeStats[];
}