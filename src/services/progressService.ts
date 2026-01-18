import { Store } from '@tauri-apps/plugin-store';
import type { ProgressData, LessonProgress, GlobalStats } from '../lib/types';

/**
 * 进度服务类
 */
export class ProgressService {
  /** Tauri Store实例 */
  private store: Store | null = null;

  /** 内存缓存（提高性能） */
  private cache: ProgressData | null = null;

  /** Store文件路径 */
  private storePath: string;

  /**
   * 构造函数
   * 
   * @param storePath - 存储文件路径（默认：progress.dat）
   */
  constructor(storePath: string = 'progress.dat') {
    this.storePath = storePath;
  }

  // ==================== 初始化 ====================

  /**
   * 初始化服务
   * 
   * 加载已有数据或创建默认数据
   */
  async initialize(): Promise<void> {
    try {
      // 初始化Store
      this.store = await Store.load(this.storePath);

      // 尝试加载数据
      const data = await this.loadData();

      if (data) {
        this.cache = data;
        console.log('Progress data loaded');
      } else {
        // 创建默认数据
        this.cache = this.createDefaultData();
        await this.saveData();
        console.log('Default progress data created');
      }
    } catch (error) {
      console.error('Failed to initialize ProgressService:', error);
      this.cache = this.createDefaultData();
    }
  }

  /**
   * 创建默认数据
   */
  private createDefaultData(): ProgressData {
    return {
      currentLesson: 1,
      lessons: {},
      stats: {
        totalPracticeTime: 0,
        characterErrors: {},
        lastPracticeDate: new Date().toISOString(),
      },
    };
  }

  /**
   * 加载数据
   */
  private async loadData(): Promise<ProgressData | null> {
    if (!this.store) return null;
    try {
      const data = await this.store.get('progressData');
      return data as ProgressData | null;
    } catch (error) {
      console.error('Failed to load data:', error);
      return null;
    }
  }

  /**
   * 保存数据
   */
  private async saveData(): Promise<void> {
    if (!this.cache || !this.store) return;

    try {
      await this.store.set('progressData', this.cache);
      await this.store.save();
    } catch (error) {
      console.error('Failed to save data:', error);
      throw error;
    }
  }

  // ==================== 当前课程管理 ====================

  /**
   * 获取当前学习课程
   */
  async getCurrentLesson(): Promise<number> {
    if (!this.cache) await this.initialize();
    return this.cache! .currentLesson;
  }

  /**
   * 保存当前学习课程
   * 
   * @param lessonNum - 课程编号
   */
  async saveCurrentLesson(lessonNum: number): Promise<void> {
    if (! this.cache) await this.initialize();

    this.cache! .currentLesson = lessonNum;
    await this.saveData();

    console.log(`Current lesson set to ${lessonNum}`);
  }

  // ==================== 课程进度管理 ====================

  /**
   * 获取课程进度
   * 
   * @param lessonNum - 课程编号
   */
  async getLessonProgress(lessonNum: number): Promise<LessonProgress> {
    if (!this.cache) await this.initialize();

    const lessonData = this.cache!.lessons[lessonNum];

    if (lessonData) {
      return {
        lessonNum,
        ...lessonData,
      };
    }

    // 返回默认值
    return {
      lessonNum,
      practiceCount: 0,
      accuracyHistory: [],
      lastPracticeDate: new Date().toISOString(),
    };
  }

  /**
   * 增加练习次数
   * 
   * @param lessonNum - 课程编号
   */
  async incrementPracticeCount(lessonNum: number): Promise<void> {
    if (!this.cache) await this.initialize();

    if (! this.cache!.lessons[lessonNum]) {
      this.cache!.lessons[lessonNum] = {
        practiceCount: 0,
        accuracyHistory: [],
        lastPracticeDate: new Date().toISOString(),
      };
    }

    this.cache! .lessons[lessonNum].practiceCount++;
    this.cache!.lessons[lessonNum].lastPracticeDate = new Date().toISOString();

    await this.saveData();
  }

  /**
   * 获取练习次数
   * 
   * @param lessonNum - 课程编号
   */
  async getPracticeCount(lessonNum: number): Promise<number> {
    const progress = await this.getLessonProgress(lessonNum);
    return progress.practiceCount;
  }

  // ==================== 准确率管理 ====================

  /**
   * 保存准确率
   * 
   * @param lessonNum - 课程编号
   * @param accuracy - 准确率（0-1）
   */
  async saveAccuracy(lessonNum: number, accuracy: number): Promise<void> {
    if (!this.cache) await this.initialize();

    if (!this.cache!.lessons[lessonNum]) {
      this.cache!.lessons[lessonNum] = {
        practiceCount: 0,
        accuracyHistory: [],
        lastPracticeDate: new Date().toISOString(),
      };
    }

    // 添加到历史记录（保留最近20条）
    this.cache!.lessons[lessonNum].accuracyHistory.push(accuracy);
    if (this.cache!.lessons[lessonNum].accuracyHistory.length > 20) {
      this.cache!.lessons[lessonNum].accuracyHistory.shift();
    }

    this.cache!.lessons[lessonNum].lastPracticeDate = new Date().toISOString();

    await this.saveData();

    console.log(`Accuracy saved: Lesson ${lessonNum}, ${(accuracy * 100).toFixed(1)}%`);
  }

  /**
   * 获取准确率历史
   * 
   * @param lessonNum - 课程编号
   */
  async getAccuracyHistory(lessonNum: number): Promise<number[]> {
    const progress = await this.getLessonProgress(lessonNum);
    return progress.accuracyHistory;
  }

  /**
   * 获取平均准确率
   * 
   * @param lessonNum - 课程编号
   */
  async getAverageAccuracy(lessonNum: number): Promise<number> {
    const history = await this.getAccuracyHistory(lessonNum);

    if (history.length === 0) return 0;

    const sum = history.reduce((acc, val) => acc + val, 0);
    return sum / history.length;
  }

  // ==================== 字符错误统计 ====================

  /**
   * 记录字符错误
   * 
   * @param char - 字符
   */
  async recordCharacterError(char: string): Promise<void> {
    if (!this.cache) await this.initialize();

    const upperChar = char.toUpperCase();

    if (!this.cache!.stats.characterErrors[upperChar]) {
      this.cache!.stats.characterErrors[upperChar] = 0;
    }

    this.cache!.stats.characterErrors[upperChar]++;

    await this.saveData();
  }

  /**
   * 批量记录字符错误
   * 
   * @param chars - 字符数组
   */
  async recordCharacterErrors(chars: string[]): Promise<void> {
    if (! this.cache) await this.initialize();

    for (const char of chars) {
      const upperChar = char.toUpperCase();

      if (!this.cache!.stats.characterErrors[upperChar]) {
        this.cache!.stats.characterErrors[upperChar] = 0;
      }

      this.cache!.stats.characterErrors[upperChar]++;
    }

    await this.saveData();
  }

  /**
   * 获取薄弱字符列表
   * 
   * @param limit - 返回数量限制
   * @returns 字符错误统计数组（降序）
   */
  async getWeakCharacters(limit: number = 10): Promise<Array<{ char: string; errors: number }>> {
    if (!this.cache) await this.initialize();

    const errors = this.cache!.stats.characterErrors;

    // 转换为数组并排序
    const sorted = Object.entries(errors)
      .map(([char, errors]) => ({ char, errors }))
      .sort((a, b) => b.errors - a.errors)
      .slice(0, limit);

    return sorted;
  }

  /**
   * 清除字符错误统计
   */
  async clearCharacterErrors(): Promise<void> {
    if (!this.cache) await this.initialize();

    this.cache!.stats.characterErrors = {};
    await this.saveData();

    console.log('Character errors cleared');
  }

  // ==================== 练习时长管理 ====================

  /**
   * 获取总练习时长
   * 
   * @returns 时长（秒）
   */
  async getTotalPracticeTime(): Promise<number> {
    if (! this.cache) await this.initialize();
    return this.cache!.stats.totalPracticeTime;
  }

  /**
   * 增加练习时长
   * 
   * @param seconds - 时长（秒）
   */
  async addPracticeTime(seconds: number): Promise<void> {
    if (!this.cache) await this.initialize();

    this.cache!.stats.totalPracticeTime += seconds;
    this.cache!.stats.lastPracticeDate = new Date().toISOString();

    await this.saveData();
  }

  // ==================== 数据管理 ====================

  /**
   * 重置所有进度
   * 
   * 清空所有数据（保留设置）
   */
  async resetProgress(): Promise<void> {
    this.cache = this.createDefaultData();
    await this.saveData();

    console.log('Progress reset');
  }

  /**
   * 导出数据
   * 
   * @returns 完整的进度数据
   */
  async exportData(): Promise<ProgressData> {
    if (!this.cache) await this.initialize();
    return JSON.parse(JSON.stringify(this.cache!));
  }

  /**
   * 导入数据
   * 
   * @param data - 进度数据
   */
  async importData(data: ProgressData): Promise<void> {
    // 验证数据格式
    if (!this.validateData(data)) {
      throw new Error('Invalid data format');
    }

    this.cache = data;
    await this.saveData();

    console.log('Data imported');
  }

  /**
   * 验证数据格式
   * 
   * @param data - 待验证数据
   */
  private validateData(data: any): data is ProgressData {
    return (
      data &&
      typeof data.currentLesson === 'number' &&
      typeof data.lessons === 'object' &&
      typeof data.stats === 'object' &&
      typeof data.stats.totalPracticeTime === 'number' &&
      typeof data.stats.characterErrors === 'object'
    );
  }

  // ==================== 统计分析 ====================

  /**
   * 获取全局统计
   */
  async getGlobalStats(): Promise<GlobalStats> {
    if (!this.cache) await this.initialize();
    return { ...this.cache! .stats };
  }

  /**
   * 获取已完成课程数
   * 
   * 定义：平均准确率 >= 90% 的课程
   */
  async getCompletedLessonsCount(): Promise<number> {
    if (!this.cache) await this.initialize();

    let count = 0;

    for (const lessonNum in this.cache!.lessons) {
      const avgAccuracy = await this.getAverageAccuracy(Number(lessonNum));
      if (avgAccuracy >= 0.9) {
        count++;
      }
    }

    return count;
  }

  /**
   * 获取总练习次数
   */
  async getTotalPracticeCount(): Promise<number> {
    if (!this.cache) await this.initialize();

    let total = 0;

    for (const lessonNum in this.cache!.lessons) {
      total += this.cache!.lessons[lessonNum].practiceCount;
    }

    return total;
  }

  /**
   * 获取学习天数
   * 
   * 基于首次练习日期计算
   */
  async getLearningDays(): Promise<number> {
    if (! this.cache) await this.initialize();

    // 找出最早的练习日期
    let earliestDate: Date | null = null;

    for (const lessonNum in this.cache!.lessons) {
      const date = new Date(this.cache! .lessons[lessonNum].lastPracticeDate);
      if (! earliestDate || date < earliestDate) {
        earliestDate = date;
      }
    }

    if (!earliestDate) return 0;

    // 计算天数差
    const now = new Date();
    const diffMs = now.getTime() - earliestDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // ==================== 资源清理 ====================

  /**
   * 关闭Store
   */
  async dispose(): Promise<void> {
    if (!this.store) return;
    try {
      await this.store.save();
      console.log('Progress data saved');
    } catch (error) {
      console.error('Failed to save on dispose:', error);
    }
  }
}