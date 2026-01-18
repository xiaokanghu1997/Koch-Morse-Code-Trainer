import { TIMING_CONSTANTS } from './constants';
import { MorseEncoder } from './encoder';
import type { AudioConfig, TimingConfig } from './types';

/**
 * 时序计算器类
 */
export class TimingCalculator {
  /** 音频配置 */
  private config: AudioConfig;
  
  /** 计算得到的时序参数 */
  private timing: TimingConfig;

  /**
   * 构造函数
   * @param config - 音频配置
   */
  constructor(config: AudioConfig) {
    this.config = config;
    this.timing = this.calculateTiming();
  }

  // ==================== 基础时间计算 ====================

  /**
   * 计算dit时长
   * 
   * 公式: ditTime = 1.2 / charSpeed
   * 说明: 基于PARIS标准，1分钟能发送charSpeed个"PARIS"
   * 
   * @param wpm - 字符速率
   * @returns dit时长（秒）
   * 
   * @example
   * calculateDitTime(20) // => 0.06秒 (60毫秒)
   * calculateDitTime(10) // => 0.12秒 (120毫秒)
   */
  static calculateDitTime(wpm: number): number {
    return TIMING_CONSTANTS.PARIS_STANDARD / wpm;
  }

  /**
   * 计算完整的时序参数
   * 
   * 实现Farnsworth timing: 
   * - 字符内元素: 使用charSpeed（快速）
   * - 字符间/单词间: 拉伸到effSpeed（慢速）
   * 
   * @returns 完整时序配置
   */
  private calculateTiming(): TimingConfig {
    const { charSpeed, effSpeed } = this.config;
    
    // 1.计算基础dit时长（基于字符速率）
    const ditTime = TimingCalculator.calculateDitTime(charSpeed);
    
    // 2.计算dah时长
    const dahTime = ditTime * TIMING_CONSTANTS.DAH_RATIO;
    
    // 3.元素间隔（字符内点划之间）- 总是1个dit
    const elementSpace = ditTime * TIMING_CONSTANTS.ELEMENT_SPACE_RATIO;
    
    // 4.计算字符间隔和单词间隔
    let charSpace: number;
    let wordSpace: number;
    
    // 判断是否需要Farnsworth timing
    if (effSpeed > 0 && effSpeed < charSpeed) {
      // 使用Farnsworth算法
      const result = this.calculateFarnsworthSpacing(charSpeed, effSpeed);
      charSpace = result.charSpace;
      wordSpace = result.wordSpace;
    } else {
      // 不使用Farnsworth，标准间隔
      charSpace = ditTime * TIMING_CONSTANTS.CHAR_SPACE_RATIO;
      wordSpace = ditTime * TIMING_CONSTANTS.WORD_SPACE_RATIO;
    }
    
    return {
      ditTime,
      dahTime,
      elementSpace,
      charSpace,
      wordSpace,
    };
  }

  /**
   * 计算Farnsworth间隔
   * 
   * Farnsworth原理: 
   * - 字符内点划快速播放（charSpeed）
   * - 字符间和单词间拉长间隔（降到effSpeed）
   * 
   * @param charSpeed - 字符速率
   * @param effSpeed - 有效速率
   * @returns 拉伸后的间隔
   */
  private calculateFarnsworthSpacing(
    charSpeed: number,
    effSpeed: number
  ): { charSpace: number; wordSpace: number } {
    // 基础dit时长
    const ditTime = TimingCalculator.calculateDitTime(charSpeed);
    
    // 标准间隔（未拉伸）
    const standardCharSpace = ditTime * TIMING_CONSTANTS.CHAR_SPACE_RATIO;
    const standardWordSpace = ditTime * TIMING_CONSTANTS.WORD_SPACE_RATIO;
    
    // 计算时间差
    // PARIS在charSpeed下的时间
    const timePerWordAtCharSpeed = 60.0 / charSpeed;
    // PARIS在effSpeed下的时间
    const timePerWordAtEffSpeed = 60.0 / effSpeed;
    // 需要增加的时间
    const extraTime = timePerWordAtEffSpeed - timePerWordAtCharSpeed;
    
    // 将额外时间分配到间隔中
    // PARIS包含19个间隔单位 (字符间4×3 + 单词间1×7)
    const extraPerUnit = extraTime / TIMING_CONSTANTS.FARNSWORTH_SPACE_UNITS;
    
    // 拉伸间隔
    const charSpace = standardCharSpace + (3 * extraPerUnit);
    const wordSpace = standardWordSpace + (7 * extraPerUnit);
    
    return { charSpace, wordSpace };
  }

  // ==================== 时长计算 ====================

  /**
   * 计算单个字符的播放时长
   * 
   * 包括: 
   * - 点划时长
   * - 元素间隔
   * - 字符后间隔（可选）
   * 
   * @param char - 字符
   * @param includeCharSpace - 是否包含字符后间隔
   * @returns 时长（秒）
   * 
   * @example
   * calculateCharacterDuration('K')  
   * // 'K' = -.-
   * // dah + space + dit + space + dah
   * // => 0.18s + 0.06s + 0.06s + 0.06s + 0.18s = 0.54s
   */
  calculateCharacterDuration(
    char: string,
    includeCharSpace: boolean = false
  ): number {
    // 获取摩尔斯码
    const morse = MorseEncoder.encode(char);
    if (!morse) return 0;
    
    let duration = 0;
    const elements = morse.split('');
    
    // 遍历每个元素（dit或dah）
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      
      // 添加元素时长
      if (element === '.') {
        duration += this.timing.ditTime;
      } else if (element === '-') {
        duration += this.timing.dahTime;
      }
      
      // 添加元素间隔（最后一个元素后不加）
      if (i < elements.length - 1) {
        duration += this.timing.elementSpace;
      }
    }
    
    // 添加字符后间隔
    if (includeCharSpace) {
      duration += this.timing.charSpace;
    }
    
    return duration;
  }

  /**
   * 计算文本的播放时长
   * 
   * 包括:
   * - 所有字符时长
   * - 字符间隔
   * - 单词间隔（空格）
   * 
   * @param text - 文本
   * @returns 时长（秒）
   * 
   * @example
   * calculateTextDuration('KM UR')
   * // K + charSpace + M + wordSpace + U + charSpace + R
   */
  calculateTextDuration(text: string): number {
    let duration = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === ' ') {
        // 单词间隔
        // 注意: wordSpace已经包含了charSpace，所以直接加
        duration += this.timing.wordSpace;
      } else {
        // 字符时长
        duration += this.calculateCharacterDuration(char, false);
        
        // 字符后间隔（如果后面还有字符且不是空格）
        const nextChar = text[i + 1];
        if (nextChar && nextChar !== ' ') {
          duration += this.timing.charSpace;
        }
      }
    }
    
    return duration;
  }

  /**
   * 计算自定义组间间隔时长
   * 
   * @param dits - 间隔长度（以dit为单位）
   * @returns 时长（秒）
   * 
   * @example
   * calculateGroupSpacing(3)  // 3个dit的间隔
   */
  calculateGroupSpacing(dits: number): number {
    return this.timing.ditTime * dits;
  }

  /**
   * 估算给定时长需要的字符数量
   * 
   * 用途: 根据目标时长生成相应数量的字符
   * 
   * 算法:
   * 1.估算平均每字符时长（包含间隔）
   * 2.反推字符数量
   * 
   * @param targetSeconds - 目标时长（秒）
   * @param avgCharsPerGroup - 平均每组字符数（用于计算空格）
   * @returns 估算的字符数量
   */
  estimateCharCountForDuration(
    targetSeconds: number,
    avgCharsPerGroup: number = 5
  ): number {
    // 估算平均字符时长
    // 假设平均每个字符有3个元素（dit/dah）
    const avgElementsPerChar = 3;
    const avgCharDuration = 
      (this.timing.ditTime + this.timing.dahTime) / 2 * avgElementsPerChar +
      this.timing.elementSpace * (avgElementsPerChar - 1) +
      this.timing.charSpace;
    
    // 考虑空格（每avgCharsPerGroup个字符一个空格）
    const avgDurationWithSpace = 
      avgCharDuration * avgCharsPerGroup + this.timing.wordSpace;
    
    // 计算总字符数
    const estimatedChars = Math.floor(
      targetSeconds / avgDurationWithSpace * avgCharsPerGroup
    );
    
    return Math.max(1, estimatedChars);  // 至少1个字符
  }

  // ==================== Getter方法 ====================

  /**
   * 获取当前时序配置
   */
  getTiming(): TimingConfig {
    return { ...this.timing };
  }

  /**
   * 获取dit时长
   */
  getDitTime(): number {
    return this.timing.ditTime;
  }

  /**
   * 获取dah时长
   */
  getDahTime(): number {
    return this.timing.dahTime;
  }

  /**
   * 获取字符间隔
   */
  getCharSpace(): number {
    return this.timing.charSpace;
  }

  /**
   * 获取单词间隔
   */
  getWordSpace(): number {
    return this.timing.wordSpace;
  }
}