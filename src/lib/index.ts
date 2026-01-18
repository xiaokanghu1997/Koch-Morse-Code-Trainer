// ==================== 类型导出 ====================
export type {
  // 基础类型
  TrainingSet,
  PracticeMode,
  PlaybackStatus,
  MorseElement,
  AudioEventType,
  
  // 配置接口
  AudioConfig,
  GeneratorConfig,
  TimingConfig,
  
  // 状态接口
  PlaybackState,
  
  // 数据接口
  LessonData,
  AudioEvent,
  LessonProgress,
  GlobalStats,
  ProgressData,
  
  // 工具类型
  CharacterWeights,
  MorseCodeMap,
  TextGeneratorOptions,
} from './types';

// ==================== 常量导出 ====================
export {
  KOCH_SEQUENCES,
  MORSE_CODE_MAP,
  CONFIG_LIMITS,
  TIMING_CONSTANTS,
  PREFIX_SUFFIX,
  DEFAULT_AUDIO_CONFIG,
  DEFAULT_GENERATOR_CONFIG,
  PREVIEW_CONFIG,
  getTrainingSetInfo,
  isConfigValueValid,
  clampValue,
} from './constants';

// ==================== 类导出 ====================
export { MorseEncoder } from './encoder';
export { TimingCalculator } from './timing';
export { AudioGenerator } from './audioGenerator';