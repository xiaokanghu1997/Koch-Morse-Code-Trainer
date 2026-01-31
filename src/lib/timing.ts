import { TIMING_CONSTANTS } from "./constants";
import { MorseEncoder } from "./encoder";
import type { AudioConfig, TimingConfig } from "./types";

/**
 * 时序计算器类
 */
export class TimingCalculator {
  /** 音频配置 */
  private config: AudioConfig;
  
  /** 时序参数 */
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
    
    // 计算基础dit时长（ditTime = 1.2 / charSpeed）
    const ditTime = TIMING_CONSTANTS.PARIS_STANDARD / charSpeed;
    
    // 计算dah时长
    const dahTime = ditTime * TIMING_CONSTANTS.DAH_RATIO;
    
    // 元素间隔（字符内点划之间）- 总是1个dit
    const elementSpace = ditTime * TIMING_CONSTANTS.ELEMENT_SPACE_RATIO;
    
    // 计算字符间隔和单词间隔
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
    effSpeed: number,
  ): { charSpace: number; wordSpace: number } {
    // 基础dit时长
    const ditTime = TIMING_CONSTANTS.PARIS_STANDARD / charSpeed;
    
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
   * 计算文本的播放时长（包括：所有字符时长、字符间隔、单词间隔）
   * 
   * @param text - 文本
   * @returns 时长（秒）
   */
  calculateTextDuration(text: string): number {
    let duration = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === " ") {
        // 单词间隔
        duration += this.timing.wordSpace;
      } else {
        // 获取字符的摩尔斯编码
        const morse = MorseEncoder.encode(char);
        if (!morse) continue;  // 跳过未知字符
        
        // 计算字符时长
        const elements = morse.split("");
        for (let j = 0; j < elements.length; j++) {
          // 元素时长
          if (elements[j] === ".") {
            duration += this.timing.ditTime;
          } else if (elements[j] === "-") {
            duration += this.timing.dahTime;
          }
          // 元素间隔（最后一个元素后不加间隔）
          if (j < elements.length - 1) {
            duration += this.timing.elementSpace;
          }
        }
        
        // 字符间隔（下一个字符不是空格时才加）
        const nextChar = text[i + 1];
        if (nextChar && nextChar !== " ") {
          duration += this.timing.charSpace;
        }
      }
    }
    
    return duration;
  }

  // ==================== Getter方法 ====================

  /**
   * 获取当前时序配置
   */
  getTiming(): TimingConfig {
    return { ...this.timing };
  }
}