import { MORSE_CODE_MAP, KOCH_SEQUENCES } from './constants';
import type { TrainingSet } from './types';

/**
 * 摩尔斯编码器类
 */
export class MorseEncoder {
  /**
   * 将单个字符编码为摩尔斯码
   * 
   * @param char - 要编码的字符（支持大小写）
   * @returns 摩尔斯码字符串，如果字符不支持则返回null
   * 
   * @example
   * encode('K') // => '-.-'
   * encode('m') // => '--'
   * encode('5') // => '.....'
   * encode('? ') // => '..--..'
   * encode('你') // => null (不支持)
   */
  static encode(char: string): string | null {
    // 转换为大写（摩尔斯码不区分大小写）
    const upperChar = char.toUpperCase();
    
    // 从映射表中查找
    const morse = MORSE_CODE_MAP[upperChar];
    
    // 返回结果（可能是undefined，转换为null）
    return morse || null;
  }

  /**
   * 将文本编码为摩尔斯码数组
   * 
   * @param text - 要编码的文本
   * @returns 摩尔斯码数组（空格保留，不支持的字符跳过）
   * 
   * @example
   * encodeText('KM U') 
   * // => ['-.-', '--', ' ', '..-']
   * 
   * encodeText('K你M')  // 不支持的字符会被跳过
   * // => ['-.-', '--']
   */
  static encodeText(text: string): string[] {
    const result: string[] = [];
    
    for (const char of text) {
      // 空格特殊处理（用于单词间隔）
      if (char === ' ') {
        result.push(' ');
        continue;
      }
      
      // 编码字符
      const morse = this.encode(char);
      
      // 只添加支持的字符
      if (morse) {
        result.push(morse);
      }
    }
    
    return result;
  }

  /**
   * 检查字符是否被支持
   * 
   * @param char - 要检查的字符
   * @returns 是否支持
   * 
   * @example
   * isValidCharacter('K') // => true
   * isValidCharacter('你') // => false
   * isValidCharacter(' ') // => true (空格特殊支持)
   */
  static isValidCharacter(char: string): boolean {
    if (char === ' ') return true;
    return this.encode(char) !== null;
  }

  /**
   * 获取支持的字符列表
   * 
   * @param set - 可选，指定字符集类型
   * @returns 字符数组
   * 
   * @example
   * getSupportedCharacters() 
   * // => ['A', 'B', 'C', ..., '0', '1', ..., '.', ',', ...]
   * 
   * getSupportedCharacters('Letters')
   * // => ['E', 'T', 'I', 'A', 'N', ...]
   */
  static getSupportedCharacters(set?: TrainingSet): string[] {
    if (set) {
      // 返回指定字符集的字符
      return KOCH_SEQUENCES[set].split('');
    }
    
    // 返回所有支持的字符（除空格外）
    return Object.keys(MORSE_CODE_MAP).filter(char => char !== ' ');
  }

  /**
   * 获取摩尔斯码长度
   * 
   * 用途: 难度评估（长度越长越难）
   * 
   * @param char - 字符
   * @returns 摩尔斯码长度（元素数量），不支持的字符返回0
   * 
   * @example
   * getMorseLength('E') // => 1  (.)
   * getMorseLength('K') // => 3  (-.-)
   * getMorseLength('5') // => 5  (.....)
   */
  static getMorseLength(char: string): number {
    const morse = this.encode(char);
    return morse ? morse.length : 0;
  }

  /**
   * 获取字符的难度权重
   * 
   * 基于摩尔斯码长度计算
   * 公式: 1.0 + length × 0.15
   * 
   * @param char - 字符
   * @returns 难度权重（1.0 - 2.0）
   * 
   * @example
   * getDifficultyWeight('E') // => 1.15  (.)
   * getDifficultyWeight('K') // => 1.45  (-.-)
   * getDifficultyWeight('0') // => 1.75  (-----)
   */
  static getDifficultyWeight(char: string): number {
    const length = this.getMorseLength(char);
    return 1.0 + length * 0.15;
  }

  /**
   * 批量获取字符集的难度权重
   * 
   * @param charSet - 字符集字符串
   * @returns 权重数组（与字符顺序对应）
   * 
   * @example
   * getDifficultyWeights('KMUR')
   * // => [1.45, 1.30, 1.45, 1.45]
   */
  static getDifficultyWeights(charSet: string): number[] {
    return charSet.split('').map(char => this.getDifficultyWeight(char));
  }

  /**
   * 验证文本是否完全由支持的字符组成
   * 
   * @param text - 要验证的文本
   * @returns 是否全部支持
   * 
   * @example
   * isValidText('KM UR') // => true
   * isValidText('KM你UR') // => false
   */
  static isValidText(text: string): boolean {
    for (const char of text) {
      if (!this.isValidCharacter(char)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 过滤文本中不支持的字符
   * 
   * @param text - 原始文本
   * @returns 仅包含支持字符的文本
   * 
   * @example
   * filterValidCharacters('KM你UR!')
   * // => 'KMUR!'  (假设! 支持，你不支持)
   */
  static filterValidCharacters(text: string): string {
    return text
      .split('')
      .filter(char => this.isValidCharacter(char))
      .join('');
  }
}