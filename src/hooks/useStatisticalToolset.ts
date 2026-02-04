import { useCallback } from "react";
import { useTrainingStore } from "../stores/trainingStore";
import * as statisticalToolset from "../services/statisticalToolset";
import type { 
  TrainingRecord,
  LessonRecords,
  DatasetRecords,
  TimeStatTypes,
  TimeStatsResult,
} from "../lib/types";

interface DataFilter {
  /** 指定数据集名称 */
  datasetName?: string;
  /** 指定课程编号 */
  lessonNumber?: number;
}

export interface UseStatisticalToolsetReturn {
  // 基础统计

  /** 获取课程统计 */
  getLessonStats: (datasetName: string, lessonNumber: number) => LessonRecords | undefined;
  /** 获取数据集统计 */
  getDatasetStats: (datasetName: string) => DatasetRecords | undefined;
  /** 获取全局统计 */
  getGlobalStats: () => {totalDuration: number; recordCount: number; averageAccuracy: number};
  /** 获取指定数据集的所有课程统计信息 */
  getLessonStatsForDataset: (datasetName: string) => {
    lessons: Array<{
      lessonNumber: number;
      recordCount: number;
      averageAccuracy: number;
    }>;
    datasetAverageAccuracy: number;
  };

  // 时间范围统计

  /** 获取时间范围统计结果 */
  getTimeStats: (timeStatType: string, filter?: DataFilter) => TimeStatsResult;
  /** 获取某年各天的练习次数 */
  getDailyRecordCounts: (year: number, filter?: DataFilter) => Array<[string, number]>;
  /** 获取各数据集的统计信息 */
  getAllDatasetStats: () => Array<{
    datasetName: string;
    lessonProgress: string;
    totalRecordCount: string;
    totalDuration: string;
    averageAccuracy: string;
  }>;
  /** 获取某年内的概览统计 */
  getYearOverviewStats: (year: number, filter?: DataFilter) => {
    totalRecordCount: number;
    totalDuration: number;
    averageAccuracy: number;
  };
  /** 获取包含所有练习的年份 */
  getAllYears: (filter?: DataFilter) => number[];

  // 格式化工具
  /** 格式化时长（秒）为字符串 */
  formatDuration: (duration: number) => string;
  /** 格式化准确率为字符串 */
  formatAccuracy: (accuracy: number) => string;
}

/**
 * 统计分析 Hook
 * 
 * 功能：
 * - 获取数据
 * - 对数据进行统计
 */
export const useStatisticalToolset = (): UseStatisticalToolsetReturn => {
  /** 从 Store 获取数据和方法 */
  const globalRecords = useTrainingStore((state) => state.globalRecords);
  const getDatasetStatsFromStore = useTrainingStore((state) => state.getDatasetStats);
  const getLessonStatsFromStore = useTrainingStore((state) => state.getLessonStats);

  /** 获取过滤后的记录 */
  const getFilteredRecords = useCallback((filter?: DataFilter): TrainingRecord[] => {
    if (!filter) {
      // 无过滤器，返回所有记录
      return Object.values(globalRecords.datasets).flatMap((dataset) =>
        Object.values(dataset.lessons).flatMap((lesson) => lesson.records)
      );
    }

    const { datasetName, lessonNumber } = filter;

    if (datasetName && lessonNumber !== undefined) {
      // 指定数据集和课程
      const lesson = globalRecords.datasets[datasetName]?.lessons[lessonNumber];
      return lesson?.records || [];
    }

    if (datasetName) {
      // 只指定数据集
      const dataset = globalRecords.datasets[datasetName];
      return dataset
        ? Object.values(dataset.lessons).flatMap((lesson) => lesson.records)
        : [];
    }

    if (lessonNumber !== undefined) {
      // 只指定课程编号（跨所有数据集）
      return Object.values(globalRecords.datasets).flatMap(
        (dataset) => dataset.lessons[lessonNumber]?.records || []
      );
    }

    return [];
  }, [globalRecords]);

  // 基础统计

  /** 获取课程统计 */
  const getLessonStats = useCallback((datasetName: string, lessonNumber: number) => {
    return getLessonStatsFromStore(datasetName, lessonNumber);
  }, [getLessonStatsFromStore]);
  
  /** 获取数据集统计 */
  const getDatasetStats = useCallback((datasetName: string) => {
    return getDatasetStatsFromStore(datasetName);
  }, [getDatasetStatsFromStore]);

  /** 获取全局统计 */
  const getGlobalStats = useCallback(() => {
    return {
      totalDuration: globalRecords.totalDuration,
      recordCount: globalRecords.recordCount,
      averageAccuracy: globalRecords.averageAccuracy
    };
  }, [globalRecords])

  /** 获取指定数据集的所有课程统计信息 */
  const getLessonStatsForDataset = useCallback((datasetName: string) => {
    return statisticalToolset.getLessonStatsForDataset(globalRecords, datasetName);
  }, [globalRecords]);

  // 时间范围统计
  
  /** 获取时间范围统计结果 */
  const getTimeStats = useCallback(
    (timeStatType: string, filter?: DataFilter): TimeStatsResult => {
      const records = getFilteredRecords(filter);
      return statisticalToolset.getTimeStats(records, timeStatType as TimeStatTypes);
    }, 
    [getFilteredRecords]
  );
  
  /** 获取某年各天的练习次数 */
  const getDailyRecordCounts = useCallback(
    (year: number, filter?: DataFilter): Array<[string, number]> => {
      const records = getFilteredRecords(filter);
      return statisticalToolset.getDailyRecordCounts(records, year);
    },
    [getFilteredRecords]
  );

  /** 获取各数据集的统计信息 */
  const getAllDatasetStats = useCallback(() => {
    return statisticalToolset.getAllDatasetStats(globalRecords);
  }, [globalRecords]);

  /** 获取某年内的概览统计 */
  const getYearOverviewStats = useCallback((year: number, filter?: DataFilter) => {
    const records = getFilteredRecords(filter);
    return statisticalToolset.getYearOverviewStats(records, year);
  }, [getFilteredRecords]);

  /** 获取包含所有练习的年份 */
  const getAllYears = useCallback((filter?: DataFilter): number[] => {
    const records = getFilteredRecords(filter);
    return statisticalToolset.getAllYears(records);
  }, [getFilteredRecords]);

  // 格式化工具

  /** 格式化时长（秒）为字符串 */
  const formatDuration = useCallback((duration: number): string => {
    return statisticalToolset.formatDuration(duration);
  }, []);

  /** 格式化准确率为字符串 */
  const formatAccuracy = useCallback((accuracy: number): string => {
    return statisticalToolset.formatAccuracy(accuracy);
  }, []);

  // 返回接口

  return {
    getLessonStats,
    getDatasetStats,
    getGlobalStats,
    getLessonStatsForDataset,
    getTimeStats,
    getDailyRecordCounts,
    getAllDatasetStats,
    getYearOverviewStats,
    getAllYears,
    formatDuration,
    formatAccuracy,
  };
};