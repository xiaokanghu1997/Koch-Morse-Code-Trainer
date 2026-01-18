import { KOCH_SEQUENCES } from '../lib/constants';
import type { TrainingSet, LessonData } from '../lib/types';

/**
 * 课程管理器类
 */
export class CourseManager {
  /** 当前字符集 */
  private trainingSet: TrainingSet;
  
  /** 当前序列 */
  private sequence: string;

  /**
   * 构造函数
   * 
   * @param trainingSet - 初始字符集
   */
  constructor(trainingSet: TrainingSet = 'Koch-LCWO') {
    this.trainingSet = trainingSet;
    this.sequence = KOCH_SEQUENCES[trainingSet];
  }

  // ==================== 基础查询方法 ====================

  /**
   * 获取总课程数
   * 
   * 规则: 第1课包含2个字符，所以总课程数 = 字符数 - 1
   * 
   * @returns 课程总数
   * 
   * @example
   * // Koch-LCWO有41个字符
   * getTotalLessons() // => 40
   * 
   * // Letters有26个字符
   * getTotalLessons() // => 25
   */
  getTotalLessons(): number {
    return this.sequence.length - 1;
  }

  /**
   * 获取指定课程数据
   * 
   * @param lessonNum - 课程编号（1-based）
   * @returns 课程数据
   * @throws Error 如果课程编号无效
   * 
   * @example
   * getLesson(1)  // => { id: 1, chars: 'KM', newChar: 'M', ...}
   * getLesson(3)  // => { id: 3, chars: 'KMUR', newChar: 'R', ...}
   */
  getLesson(lessonNum: number): LessonData {
    // 验证课程编号
    if (lessonNum < 1 || lessonNum > this.getTotalLessons()) {
      throw new Error(
        `Invalid lesson number: ${lessonNum}.Must be between 1 and ${this.getTotalLessons()}`
      );
    }

    // 计算字符集（第N课包含前N+1个字符）
    const chars = this.sequence.slice(0, lessonNum + 1);
    const newChar = this.sequence[lessonNum];  // 新字符是第N+1个

    return {
      id: lessonNum,
      chars,
      newChar,
      charSet: this.trainingSet,
      description: `Lesson ${lessonNum}: ${chars} (New: ${newChar})`,
    };
  }

  /**
   * 获取所有课程列表
   * 
   * @returns 课程数组
   * 
   * @example
   * getAllLessons()
   * // => [
   * //   { id: 1, chars: 'KM', newChar: 'M', ...},
   * //   { id: 2, chars: 'KMU', newChar: 'U', ...},
   * //   ...
   * // ]
   */
  getAllLessons(): LessonData[] {
    const total = this.getTotalLessons();
    return Array.from({ length: total }, (_, i) => this.getLesson(i + 1));
  }

  // ==================== 字符集管理 ====================

  /**
   * 切换字符集
   * 
   * @param newSet - 新字符集
   * 
   * @example
   * switchTrainingSet('Letters')
   * // 现在课程基于字母序列
   */
  switchTrainingSet(newSet: TrainingSet): void {
    this.trainingSet = newSet;
    this.sequence = KOCH_SEQUENCES[newSet];
  }

  /**
   * 获取当前字符集
   */
  getCurrentTrainingSet(): TrainingSet {
    return this.trainingSet;
  }

  /**
   * 获取当前序列
   */
  getCurrentSequence(): string {
    return this.sequence;
  }

  // ==================== 字符查询方法 ====================

  /**
   * 获取字符在序列中的索引
   * 
   * 用途: 判断字符的学习顺序
   * 
   * @param char - 字符
   * @returns 索引（0-based），未找到返回-1
   * 
   * @example
   * getCharacterIndex('K') // => 0
   * getCharacterIndex('M') // => 1
   * getCharacterIndex('Z') // => -1 (如果不在序列中)
   */
  getCharacterIndex(char: string): number {
    return this.sequence.indexOf(char.toUpperCase());
  }

  /**
   * 检查字符是否在序列中
   * 
   * @param char - 字符
   * @returns 是否存在
   */
  hasCharacter(char: string): boolean {
    return this.getCharacterIndex(char) !== -1;
  }

  /**
   * 获取字符首次出现的课程编号
   * 
   * @param char - 字符
   * @returns 课程编号（1-based），未找到返回null
   * 
   * @example
   * getCharacterLesson('M') // => 1 (第1课引入)
   * getCharacterLesson('U') // => 2 (第2课引入)
   */
  getCharacterLesson(char: string): number | null {
    const index = this.getCharacterIndex(char);
    if (index === -1) return null;
    
    // 第N个字符在第N-1课引入（因为第1课有2个字符）
    return Math.max(1, index);
  }

  // ==================== 课程导航方法 ====================

  /**
   * 获取下一课
   * 
   * @param currentLesson - 当前课程编号
   * @returns 下一课数据，如果已是最后一课则返回null
   */
  getNextLesson(currentLesson: number): LessonData | null {
    const nextNum = currentLesson + 1;
    if (nextNum > this.getTotalLessons()) {
      return null;
    }
    return this.getLesson(nextNum);
  }

  /**
   * 获取上一课
   * 
   * @param currentLesson - 当前课程编号
   * @returns 上一课数据，如果已是第1课则返回null
   */
  getPreviousLesson(currentLesson: number): LessonData | null {
    const prevNum = currentLesson - 1;
    if (prevNum < 1) {
      return null;
    }
    return this.getLesson(prevNum);
  }

  /**
   * 检查是否有下一课
   */
  hasNextLesson(currentLesson: number): boolean {
    return currentLesson < this.getTotalLessons();
  }

  /**
   * 检查是否有上一课
   */
  hasPreviousLesson(currentLesson: number): boolean {
    return currentLesson > 1;
  }

  // ==================== 工具方法 ====================

  /**
   * 获取课程进度百分比
   * 
   * @param currentLesson - 当前课程编号
   * @returns 进度百分比（0-100）
   */
  getProgress(currentLesson: number): number {
    const total = this.getTotalLessons();
    return Math.round((currentLesson / total) * 100);
  }

  /**
   * 验证课程编号是否有效
   */
  isValidLessonNumber(lessonNum: number): boolean {
    return lessonNum >= 1 && lessonNum <= this.getTotalLessons();
  }
}