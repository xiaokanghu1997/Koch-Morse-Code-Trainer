import { MORSE_CODE_MAP } from "./constants";

/**
 * 摩尔斯编码器类
 */
export class MorseEncoder {
  /**
   * 将字符编码转为摩尔斯码
   * @param char - 要编码的字符（支持大小写）
   * @returns 摩尔斯码字符串，如果字符不支持则返回null
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
   * 批量获取字符集的难度权重
   * @param charSet - 字符集字符串
   * @returns 权重数组（与字符顺序对应）
   */
  static getDifficultyWeights(charSet: string): number[] {
    return charSet.split("").map(char => {
      const morse = this.encode(char);
      const length = morse ? morse.length : 0;
      return 1.0 + length * 0.15;
    });
  }
}