import { MorseEncoder } from "../lib/encoder";
import { PREFIX_SUFFIX } from "../lib/constants";
import type { TextGeneratorOptions, PracticeModes } from "../lib/types";
import { log } from "../utils/logger";

/**
 * 文本生成器类
 */
export class TextGenerator {
  /**
   * 生成训练文本
   * 
   * @param options - 生成选项
   * @returns 格式化的文本
   */
  generate(options: TextGeneratorOptions): string {
    const {
      charSet,
      mode,
      groupLength,
      randomGroupLength,
      groupSpace,
      groupCount,
      usePrefixSuffix,
    } = options;

    // 计算字符权重
    const weights = this.calculateWeights(charSet, mode);

    // 生成文本
    let text: string;
    if (randomGroupLength) {
      // 随机组长度
      text = this.generateWithRandomGroups(
        charSet,
        groupCount,
        groupSpace,
        weights
      );
    } else {
      // 固定组长度
      text = this.generateWithFixedGroups(
        charSet,
        groupLength,
        groupCount,
        groupSpace,
        weights
      );
    }

    // 添加前后缀（如果需要）
    if (usePrefixSuffix) {
      text = this.addPrefixSuffix(text);
    }

    log.debug("Text generated", "TextGenerator", { 
      length: text.length,
      groups: groupCount,
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
  private calculateWeights(charSet: string, mode: PracticeModes): number[] {
    const chars = charSet.split("");
    const n = chars.length;

    switch (mode) {
      case "Uniform":
        // 均匀分布：所有字符权重相同
        return new Array(n).fill(1.0);

      case "New focus":
        // 新字符重点：最后一个字符2倍权重
        return [...new Array(n - 1).fill(1.0), 2.0];

      case "Gradual":
        // 渐进式：最后一个字符1.5倍权重
        return [...new Array(n - 1).fill(1.0), 1.5];

      case "Weighted":
        // 难度加权：根据摩尔斯码长度
        return MorseEncoder.getDifficultyWeights(charSet);

      default:
        return new Array(n).fill(1.0);
    }
  }

  // ==================== 文本字符生成 ====================

  /**
   * 生成字符序列
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
    const chars = charSet.split("");
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

  /**
   * 生成固定长度的字符序列
   * 
   * @param charSet - 字符集
   * @param groupLength - 每组长度
   * @param groupCount - 组数
   * @param groupSpace - 组间间隔
   * @param weights - 字符权重
   * @returns 格式化后的文本
   */
  private generateWithFixedGroups(
    charSet: string,
    groupLength: number,
    groupCount: number,
    groupSpace: number,
    weights: number[]
  ): string {

    // 生成所需总字符数
    const totalCharCount = groupLength * groupCount;
    // 生成字符序列
    const chars = this.generateCharacters(charSet, totalCharCount, weights);

    // 按groupLength分组
    const groups: string[] = [];
    for (let i = 0; i < chars.length; i += groupLength) {
      const group = chars.slice(i, i + groupLength).join("");
      groups.push(group);
    }

    // groupSpace 表示组间隔的倍数（基于 WORD_SPACE_RATIO）
    if (groupSpace === 1) {
      // 标准间隔：一个空格 = WORD_SPACE_RATIO (7 dits)
      return groups.join(" ");
    } else {
      // n倍间隔：n个空格 = n * WORD_SPACE_RATIO (7 dits)
      const spaces = " ".repeat(groupSpace);
      return groups.join(spaces);
    }
  }

  /**
   * 生成随机长度的字符序列
   * 
   * @param charSet - 字符集
   * @param groupCount - 组数
   * @param groupSpace - 组间间隔
   * @param weights - 字符权重
   * @returns 格式化后的文本
   */
  private generateWithRandomGroups(
    charSet: string,
    groupCount: number,
    groupSpace: number,
    weights: number[]
  ): string {
    const groups: string[] = [];

    // 生成指定数量的组
    for (let i = 0; i < groupCount; i++) {
      // 随机生成组长度（2到7）
      const currentGroupLength = Math.floor(Math.random() * 6) + 2;
      // 生成该组的字符
      const chars = this.generateCharacters(charSet, currentGroupLength, weights);
      // 转为字符串
      groups.push(chars.join(""));
    }

    // groupSpace 表示组间隔的倍数（基于 WORD_SPACE_RATIO）
    if (groupSpace === 1) {
      // 标准间隔：一个空格 = WORD_SPACE_RATIO (7 dits)
      return groups.join(" ");
    } else {
      // n倍间隔：n个空格 = n * WORD_SPACE_RATIO (7 dits)
      const spaces = " ".repeat(groupSpace);
      return groups.join(spaces);
    }
  }

  // ==================== 前后缀添加 ====================

  /**
   * 添加前后缀
   * 
   * @param text - 原始文本
   * @param groupSpace - 组间间隔
   * @returns 添加前后缀的文本
   */
  private addPrefixSuffix(text: string): string {
    return PREFIX_SUFFIX.PREFIX + " " + text + " " + PREFIX_SUFFIX.SUFFIX;
  }

  // ==================== 单字符生成 ====================

  /**
   * 生成单个字符的重复序列
   * 
   * 用于字符学习
   * 
   * @param char - 字符
   * @param count - 重复次数
   * @returns 文本
   */
  generateSingleCharacter(char: string, count: number): string {
    return new Array(count).fill(char).join("");
  }
}