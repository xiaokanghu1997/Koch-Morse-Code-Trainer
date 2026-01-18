import { useState, useEffect, useCallback } from 'react';
import { ProgressService } from '../services/progressService';
import type { LessonProgress, GlobalStats } from '../lib/types';

/**
 * useProgress Hook返回值类型
 */
interface UseProgressReturn {
  // 当前课程
  currentLesson: number;
  setCurrentLesson: (num: number) => Promise<void>;
  
  // 课程进度
  getLessonProgress: (lessonNum: number) => Promise<LessonProgress>;
  incrementPracticeCount: (lessonNum: number) => Promise<void>;
  saveAccuracy: (lessonNum: number, accuracy: number) => Promise<void>;
  getAccuracyHistory: (lessonNum: number) => Promise<number[]>;
  
  // 字符错误
  recordCharacterError: (char: string) => Promise<void>;
  recordCharacterErrors: (chars: string[]) => Promise<void>;
  weakCharacters: Array<{ char: string; errors: number }>;
  refreshWeakCharacters: () => Promise<void>;
  
  // 全局统计
  totalPracticeTime: number;
  globalStats: GlobalStats | null;
  refreshGlobalStats: () => Promise<void>;
  
  // 数据管理
  resetProgress: () => Promise<void>;
  exportData: () => Promise<any>;
  importData: (data: any) => Promise<void>;
  
  // 状态
  isLoading: boolean;
  error: string | null;
}

/**
 * 进度管理Hook
 */
export const useProgress = (): UseProgressReturn => {
  // ==================== 状态管理 ====================
  
  /** 当前课程 */
  const [currentLesson, setCurrentLessonState] = useState(1);
  
  /** 薄弱字符列表 */
  const [weakCharacters, setWeakCharacters] = useState<Array<{ char: string; errors: number }>>([]);
  
  /** 总练习时长 */
  const [totalPracticeTime, setTotalPracticeTime] = useState(0);
  
  /** 全局统计 */
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  
  /** 加载状态 */
  const [isLoading, setIsLoading] = useState(true);
  
  /** 错误信息 */
  const [error, setError] = useState<string | null>(null);
  
  // ==================== Service实例 ====================
  
  const [progressService] = useState(() => new ProgressService());

  // ==================== 初始化 ====================
  
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 初始化服务
        await progressService.initialize();

        // 加载当前课程
        const lesson = await progressService.getCurrentLesson();
        setCurrentLessonState(lesson);

        // 加载薄弱字符
        const weak = await progressService.getWeakCharacters(10);
        setWeakCharacters(weak);

        // 加载统计数据
        const time = await progressService.getTotalPracticeTime();
        setTotalPracticeTime(time);

        const stats = await progressService.getGlobalStats();
        setGlobalStats(stats);

        console.log('✅ Progress data loaded');
      } catch (err) {
        console.error('Failed to initialize progress:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // 清理
    return () => {
      progressService.dispose();
    };
  }, [progressService]);

  // ==================== 当前课程管理 ====================
  
  /**
   * 设置当前课程
   */
  const setCurrentLesson = useCallback(async (num: number) => {
    try {
      await progressService.saveCurrentLesson(num);
      setCurrentLessonState(num);
    } catch (err) {
      console.error('Failed to set current lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to set lesson');
      throw err;
    }
  }, [progressService]);

  // ==================== 课程进度管理 ====================
  
  /**
   * 获取课程进度
   */
  const getLessonProgress = useCallback(async (lessonNum: number) => {
    try {
      return await progressService.getLessonProgress(lessonNum);
    } catch (err) {
      console.error('Failed to get lesson progress:', err);
      throw err;
    }
  }, [progressService]);

  /**
   * 增加练习次数
   */
  const incrementPracticeCount = useCallback(async (lessonNum: number) => {
    try {
      await progressService.incrementPracticeCount(lessonNum);
    } catch (err) {
      console.error('Failed to increment practice count:', err);
      throw err;
    }
  }, [progressService]);

  /**
   * 保存准确率
   */
  const saveAccuracy = useCallback(
    async (lessonNum: number, accuracy: number) => {
      try {
        await progressService.saveAccuracy(lessonNum, accuracy);
      } catch (err) {
        console.error('Failed to save accuracy:', err);
        throw err;
      }
    },
    [progressService]
  );

  /**
   * 获取准确率历史
   */
  const getAccuracyHistory = useCallback(
    async (lessonNum: number) => {
      try {
        return await progressService.getAccuracyHistory(lessonNum);
      } catch (err) {
        console.error('Failed to get accuracy history:', err);
        throw err;
      }
    },
    [progressService]
  );

  // ==================== 字符错误管理 ====================
  
  /**
   * 记录字符错误
   */
  const recordCharacterError = useCallback(
    async (char: string) => {
      try {
        await progressService.recordCharacterError(char);
        // 刷新薄弱字符列表
        await refreshWeakCharacters();
      } catch (err) {
        console.error('Failed to record character error:', err);
        throw err;
      }
    },
    [progressService]
  );

  /**
   * 批量记录字符错误
   */
  const recordCharacterErrors = useCallback(
    async (chars: string[]) => {
      try {
        await progressService.recordCharacterErrors(chars);
        // 刷新薄弱字符列表
        await refreshWeakCharacters();
      } catch (err) {
        console.error('Failed to record character errors:', err);
        throw err;
      }
    },
    [progressService]
  );

  /**
   * 刷新薄弱字符列表
   */
  const refreshWeakCharacters = useCallback(async () => {
    try {
      const weak = await progressService.getWeakCharacters(10);
      setWeakCharacters(weak);
    } catch (err) {
      console.error('Failed to refresh weak characters:', err);
    }
  }, [progressService]);

  // ==================== 全局统计 ====================
  
  /**
   * 刷新全局统计
   */
  const refreshGlobalStats = useCallback(async () => {
    try {
      const time = await progressService.getTotalPracticeTime();
      setTotalPracticeTime(time);

      const stats = await progressService.getGlobalStats();
      setGlobalStats(stats);
    } catch (err) {
      console.error('Failed to refresh global stats:', err);
    }
  }, [progressService]);

  // ==================== 数据管理 ====================
  
  /**
   * 重置进度
   */
  const resetProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      await progressService.resetProgress();
      
      // 重新加载数据
      setCurrentLessonState(1);
      setWeakCharacters([]);
      setTotalPracticeTime(0);
      setGlobalStats(null);
      
      console.log('✅ Progress reset');
    } catch (err) {
      console.error('Failed to reset progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [progressService]);

  /**
   * 导出数据
   */
  const exportData = useCallback(async () => {
    try {
      return await progressService.exportData();
    } catch (err) {
      console.error('Failed to export data:', err);
      throw err;
    }
  }, [progressService]);

  /**
   * 导入数据
   */
  const importData = useCallback(
    async (data: any) => {
      try {
        setIsLoading(true);
        await progressService.importData(data);
        
        // 重新加载数据
        const lesson = await progressService.getCurrentLesson();
        setCurrentLessonState(lesson);
        
        await refreshWeakCharacters();
        await refreshGlobalStats();
        
        console.log('✅ Data imported');
      } catch (err) {
        console.error('Failed to import data:', err);
        setError(err instanceof Error ? err.message : 'Failed to import');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [progressService, refreshWeakCharacters, refreshGlobalStats]
  );

  // ==================== 返回值 ====================
  
  return {
    // 当前课程
    currentLesson,
    setCurrentLesson,
    
    // 课程进度
    getLessonProgress,
    incrementPracticeCount,
    saveAccuracy,
    getAccuracyHistory,
    
    // 字符错误
    recordCharacterError,
    recordCharacterErrors,
    weakCharacters,
    refreshWeakCharacters,
    
    // 全局统计
    totalPracticeTime,
    globalStats,
    refreshGlobalStats,
    
    // 数据管理
    resetProgress,
    exportData,
    importData,
    
    // 状态
    isLoading,
    error,
  };
};