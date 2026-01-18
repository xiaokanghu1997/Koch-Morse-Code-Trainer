import { KOCH_SEQUENCES, PREVIEW_CONFIG } from '../lib/constants';
import { TimingCalculator } from '../lib';
import type { TrainingSet, AudioConfig } from '../lib/types';

/**
 * 预览生成器类
 */
export class PreviewGenerator {
  /**
   * 生成预览文本
   * 
   * 特点:
   * - 包含整个字符集的所有字符
   * - 字符循环重复直到填满20秒
   * - 每5个字符一组
   * 
   * @param trainingSet - 字符集
   * @param config - 音频配置
   * @returns 预览文本
   * 
   * @example
   * generatePreview('Koch-LCWO', { charSpeed: 20, ...})
   * // => "KMURE SNAPT LWIJK Z=FOY ..."
   */
  generatePreview(trainingSet: TrainingSet, config: AudioConfig): string {
    // 1.获取字符集序列
    const sequence = KOCH_SEQUENCES[trainingSet];
    const chars = sequence.split('');

    // 2.创建时序计算器
    const timingCalc = new TimingCalculator(config);

    // 3.估算需要的字符数
    const estimatedCount = this.estimateCharCount(config, PREVIEW_CONFIG.DURATION);

    // 4.生成字符序列（循环使用字符集）
    const generatedChars: string[] = [];
    for (let i = 0; i < estimatedCount; i++) {
      generatedChars.push(chars[i % chars.length]);
    }

    // 5.格式化为分组文本
    let text = this.formatIntoGroups(generatedChars, PREVIEW_CONFIG.GROUP_LENGTH);

    // 6.精确调整时长
    text = this.refineForExactDuration(text, timingCalc, PREVIEW_CONFIG.DURATION);

    return text;
  }

  // ==================== 私有方法 ====================

  /**
   * 估算所需字符数量
   * 
   * @param config - 音频配置
   * @param targetDuration - 目标时长（秒）
   * @returns 估算的字符数
   */
  private estimateCharCount(config: AudioConfig, targetDuration: number): number {
    const timingCalc = new TimingCalculator(config);
    return timingCalc.estimateCharCountForDuration(
      targetDuration,
      PREVIEW_CONFIG.GROUP_LENGTH
    );
  }

  /**
   * 格式化为分组
   * 
   * @param chars - 字符数组
   * @param groupLength - 每组长度
   * @returns 格式化文本
   */
  private formatIntoGroups(chars: string[], groupLength: number): string {
    const groups: string[] = [];

    for (let i = 0; i < chars.length; i += groupLength) {
      const group = chars.slice(i, i + groupLength).join('');
      groups.push(group);
    }

    return groups.join(' ');
  }

  /**
   * 精确调整时长
   * 
   * 通过迭代调整字符数量，使时长接近目标值
   * 
   * @param initialText - 初始文本
   * @param timingCalc - 时序计算器
   * @param targetDuration - 目标时长
   * @returns 调整后的文本
   */
  private refineForExactDuration(
    initialText: string,
    timingCalc: TimingCalculator,
    targetDuration: number
  ): string {
    let text = initialText;
    let actualDuration = timingCalc.calculateTextDuration(text);

    // 最多迭代3次
    let iterations = 0;
    const maxIterations = 3;
    const tolerance = 1.0;  // 1秒误差可接受

    while (
      Math.abs(actualDuration - targetDuration) > tolerance &&
      iterations < maxIterations
    ) {
      // 计算调整比例
      const ratio = targetDuration / actualDuration;

      // 移除空格，计算新的字符数
      const charsOnly = text.replace(/ /g, '');
      const newCharCount = Math.round(charsOnly.length * ratio);

      // 重新生成（使用原字符集循环）
      const sequence = charsOnly;
      const newChars: string[] = [];
      for (let i = 0; i < newCharCount; i++) {
        newChars.push(sequence[i % sequence.length]);
      }

      // 重新格式化
      text = this.formatIntoGroups(newChars, PREVIEW_CONFIG.GROUP_LENGTH);
      actualDuration = timingCalc.calculateTextDuration(text);

      iterations++;
    }

    console.log(
      `Preview: ${iterations} iterations, final duration: ${actualDuration.toFixed(1)}s`
    );

    return text;
  }
}