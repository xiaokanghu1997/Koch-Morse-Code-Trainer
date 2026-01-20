import { MorseEncoder, TimingCalculator } from '../lib';
import { PREFIX_SUFFIX } from '../lib/constants';
import type { TextGeneratorOptions, PracticeMode } from '../lib/types';
import { log } from '../utils/logger';

/**
 * 文本生成器类
 */
export class TextGenerator {
  /**
   * 生成训练文本
   * 
   * @param options - 生成选项
   * @returns 格式化的文本
   * 
   * @example
   * generate({
   *   charSet: 'KMUR',
   *   mode: 'Gradual',
   *   groupLength: 5,
   *   groupSpacing: 1,
   *   targetDuration: 60,
   *   audioConfig: { charSpeed: 20, effSpeed: 10, tone: 600, volume: 1 }
   * })
   * // => "KMURK RMUKU URKMR ..."
   */
  generate(options: TextGeneratorOptions): string {
    const {
      charSet,
      mode,
      groupLength,
      groupSpacing,
      targetDuration,
      audioConfig,
      usePrefixSuffix = false,
    } = options;

    // 1.估算需要的字符数量
    const timingCalc = new TimingCalculator(audioConfig);
    const estimatedCharCount = timingCalc.estimateCharCountForDuration(
      targetDuration,
      groupLength
    );

    // 2.计算字符权重
    const weights = this.calculateWeights(charSet, mode);

    // 3.生成字符序列
    const chars = this.generateCharacters(charSet, estimatedCharCount, weights);

    // 4.格式化为分组文本
    let text = this.formatWithGroups(chars, groupLength, groupSpacing);

    // 5.添加前后缀（如果需要）
    if (usePrefixSuffix) {
      text = this.addPrefixSuffix(text);
    }

    // 6.验证并调整时长（可选：迭代优化）
    const actualDuration = timingCalc.calculateTextDuration(text);
    log.debug('Text generated', 'TextGenerator', { 
      charCount: chars.length, 
      duration: actualDuration.toFixed(1) 
    });

    return text;
  }

  // ==================== 权重计算 ====================

  /**
   * 计算字符权重
   * 
   * @param charSet - 字符集
   * @param mode - 练习模式
   * @returns 权重数组（与字符顺序对应）
   */
  private calculateWeights(charSet: string, mode: PracticeMode): number[] {
    const chars = charSet.split('');
    const n = chars.length;

    switch (mode) {
      case 'Uniform':
        // 均匀分布：所有字符权重相同
        return new Array(n).fill(1.0);

      case 'New focus':
        // 新字符重点：最后一个字符2倍权重
        return [...new Array(n - 1).fill(1.0), 2.0];

      case 'Gradual':
        // 渐进式：最后一个字符1.5倍权重
        return [...new Array(n - 1).fill(1.0), 1.5];

      case 'Weighted':
        // 难度加权：根据摩尔斯码长度
        return MorseEncoder.getDifficultyWeights(charSet);

      default:
        return new Array(n).fill(1.0);
    }
  }

  // ==================== 字符生成 ====================

  /**
   * 生成随机字符序列
   * 
   * @param charSet - 字符集
   * @param count - 字符数量
   * @param weights - 字符权重
   * @returns 字符数组
   */
  private generateCharacters(
    charSet: string,
    count: number,
    weights: number[]
  ): string[] {
    const chars = charSet.split('');
    const result: string[] = [];

    // 计算累积权重（用于加权随机选择）
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const cumulativeWeights: number[] = [];
    let sum = 0;
    for (const weight of weights) {
      sum += weight;
      cumulativeWeights.push(sum);
    }

    // 生成字符
    for (let i = 0; i < count; i++) {
      const random = Math.random() * totalWeight;
      
      // 二分查找对应的字符索引
      let selectedIndex = 0;
      for (let j = 0; j < cumulativeWeights.length; j++) {
        if (random <= cumulativeWeights[j]) {
          selectedIndex = j;
          break;
        }
      }

      result.push(chars[selectedIndex]);
    }

    return result;
  }

  // ==================== 格式化方法 ====================

  /**
   * 格式化为分组文本
   * 
   * @param chars - 字符数组
   * @param groupLength - 每组长度
   * @param groupSpacing - 组间间隔（dits）
   * @param timingCalc - 时序计算器
   * @returns 格式化后的文本
   * 
   * @example
   * formatWithGroups(['K','M','U','R','K'], 2, 1, calc)
   * // => "KM UR K"
   */
  private formatWithGroups(
    chars: string[],
    groupLength: number,
    groupSpacing: number,
  ): string {
    const groups: string[] = [];

    // 按groupLength分组
    for (let i = 0; i < chars.length; i += groupLength) {
      const group = chars.slice(i, i + groupLength).join('');
      groups.push(group);
    }

    // 组间用空格连接
    let text = groups.join(' ');

    // 如果需要额外的组间间隔（groupSpacing > 1）
    // 我们通过添加多个空格来模拟（每个空格=单词间隔）
    if (groupSpacing > 1) {
      const extraSpaces = ' '.repeat(groupSpacing - 1);
      text = groups.join(' ' + extraSpaces);
    }

    return text;
  }

  /**
   * 添加前后缀
   * 
   * @param text - 原始文本
   * @returns 添加前后缀的文本
   */
  private addPrefixSuffix(text: string): string {
    return PREFIX_SUFFIX.PREFIX + text + PREFIX_SUFFIX.SUFFIX;
  }

  // ==================== 工具方法 ====================

  /**
   * 生成单个字符的重复序列
   * 
   * 用于字符学习
   * 
   * @param char - 字符
   * @param count - 重复次数
   * @returns 文本
   * 
   * @example
   * generateSingleCharacter('K', 5)
   * // => "K K K K K"
   */
  generateSingleCharacter(char: string, count: number): string {
    return new Array(count).fill(char).join(' ');
  }

  /**
   * 验证生成的文本
   * 
   * @param text - 文本
   * @returns 是否有效
   */
  validateText(text: string): boolean {
    return MorseEncoder.isValidText(text);
  }
}