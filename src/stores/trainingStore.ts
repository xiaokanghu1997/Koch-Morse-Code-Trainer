import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { 
  TrainingRecord,
  LessonRecords,
  DatasetRecords,
  GlobalRecords,
} from "../lib/types";
import {
  calculateLessonStats,
  calculateDatasetStats,
  calculateGlobalStats,
} from "../services/statisticalToolset";
import { CHARACTER_SET } from "../lib/constants";
import { log } from "../utils/logger";

/**
 * 训练状态接口
 */
interface TrainingState {
  // ==================== 状态 ====================

  /** 当前训练数据集 */
  currentDatasetName: string;

  /** 当前正在练习的课程编号 */
  currentLessonNumber: number;
  
  /** 所有训练记录 */
  globalRecords: GlobalRecords;

  // ==================== 操作方法 ====================

  /** 提交训练记录 */
  submitRecord: (datasetName: string, lessonNumber: number, record: TrainingRecord) => void;

  /** 设置当前训练集 */
  setDatasetName: (datasetName: string) => void;

  /** 设置当前课程编号 */
  setLessonNumber: (lessonNumber: number) => void;

  /** 获取数据集统计信息 */
  getDatasetStats: (datasetName: string) => DatasetRecords | undefined;

  /** 获取课程统计信息 */
  getLessonStats: (datasetName: string, lessonNumber: number) => LessonRecords | undefined;

  /** 从生成器配置中同步训练集 */
  syncFromGeneratorConfig: (generatorDatasetName: string) => void;

  /** 导出训练数据 */
  exportData: () => void;

  /** 导入训练数据 */
  importData: (jsonData: string) => void;

  /** 清空所有训练数据 */
  clearAllData: () => void;
}

/**
 * 创建训练Store
 */
export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      // ==================== 初始状态 ====================
      currentDatasetName: "Koch-LCWO",

      currentLessonNumber: 1,

      globalRecords: {
        totalDuration: 0,
        recordCount: 0,
        averageAccuracy: 0,
        datasets: {},
      },

      // ==================== 操作方法 ====================

      /** 提交训练记录 */
      submitRecord: (datasetName, lessonNumber, record) => {
        set((state) => {
          // 深拷贝避免直接修改状态
          const newRecords: GlobalRecords = {
            ...state.globalRecords,
            datasets: { ...state.globalRecords.datasets },
          };

          // 确保数据集存在
          if (!newRecords.datasets[datasetName]) {
            newRecords.datasets[datasetName] = {
              totalDuration: 0,
              recordCount: 0,
              averageAccuracy: 0,
              lessons: {},
            };
          }

          // 深拷贝数据集
          const dataset: DatasetRecords = {
            ...newRecords.datasets[datasetName],
            lessons: { ...newRecords.datasets[datasetName].lessons },
          };

          // 确保课程存在
          if (!dataset.lessons[lessonNumber]) {
            dataset.lessons[lessonNumber] = {
              totalDuration: 0,
              recordCount: 0,
              averageAccuracy: 0,
              records: [],
            };
          }

          // 深拷贝课程
          const lesson: LessonRecords = {
            ...dataset.lessons[lessonNumber],
            records: [...dataset.lessons[lessonNumber].records],
          };

          // 添加新记录
          lesson.records.push(record);

          // 重新进行课程统计
          const lessonStats = calculateLessonStats(lesson.records);
          lesson.totalDuration = lessonStats.totalDuration;
          lesson.recordCount = lessonStats.recordCount;
          lesson.averageAccuracy = lessonStats.averageAccuracy;

          // 更新课程
          dataset.lessons[lessonNumber] = lesson;

          // 重新进行数据集统计
          const datasetStats = calculateDatasetStats(dataset.lessons);
          dataset.totalDuration = datasetStats.totalDuration;
          dataset.recordCount = datasetStats.recordCount;
          dataset.averageAccuracy = datasetStats.averageAccuracy;

          // 更新数据集
          newRecords.datasets[datasetName] = dataset;

          // 重新进行全局统计
          const globalStats = calculateGlobalStats(newRecords.datasets);
          newRecords.totalDuration = globalStats.totalDuration;
          newRecords.recordCount = globalStats.recordCount;
          newRecords.averageAccuracy = globalStats.averageAccuracy;

          log.info("Training record submitted", "TrainingStore", {
            dataset: datasetName,
            lesson: lessonNumber,
            accuracy: record.accuracy,
            duration: record.duration,
          });

          return { globalRecords: newRecords };
        });
      },

      /** 设置当前训练集 */
      setDatasetName: (datasetName) => {
        // 检测数据集是否存在
        if (!(datasetName in CHARACTER_SET)) {
          log.error(`Unknown training dataset: ${datasetName}`, "TrainingStore");
          return;
        }
        // 获取已有记录的课程，如果不存在则返回第1课
        const dataset = get().globalRecords.datasets[datasetName];
        const latestLessonNumber =
          dataset && Object.keys(dataset.lessons).length > 0
            ? Math.max(...Object.keys(dataset.lessons).map(Number)) // 计算最新课程编号
            : 1; // 如果没有记录则重置为1

        set({ currentDatasetName: datasetName, currentLessonNumber: latestLessonNumber })
      },

      /** 设置当前课程编号 */
      setLessonNumber: (lessonNumber) => {
        const datasetName = get().currentDatasetName;

        if (!(datasetName in CHARACTER_SET)) {
          log.error(`${datasetName} not found in CHARACTER_SET`, "TrainingStore");
          return;
        }

        const characterSet = CHARACTER_SET[datasetName as keyof typeof CHARACTER_SET];
        const totalLessons = characterSet.length - 1; // 获取训练集的总课程数

        if (lessonNumber < 1 || lessonNumber > totalLessons) {
          log.error(`Invalid lesson number: ${lessonNumber}`, "TrainingStore");
          return;
        }

        set({ currentLessonNumber: lessonNumber });
      },

      /** 获取数据集统计信息 */
      getDatasetStats: (datasetName) => {
        return get().globalRecords.datasets[datasetName];
      },

      /** 获取课程统计信息 */
      getLessonStats: (datasetName, lessonNumber) => {
        return get().globalRecords.datasets[datasetName]?.lessons[lessonNumber];
      },

      /** 从生成器配置中同步训练集 */
      syncFromGeneratorConfig: (generatorDatasetName) => {
        const state = get();

        // 验证数据集是否存在
        if (!(generatorDatasetName in CHARACTER_SET)) {
          log.error(`Unknown generator dataset: ${generatorDatasetName}`, "TrainingStore");
          return;
        }

        // 如果训练集名称相同，不需要修改（保持当前课程编号）
        if (state.currentDatasetName === generatorDatasetName) {
          log.info("Dataset already synced", "TrainingStore", {
            datasetName: generatorDatasetName,
            lessonNumber: state.currentLessonNumber,
          });
          return;
        }

        // 训练集名称不同，更新训练集名称和课程编号
        const dataset = state.globalRecords.datasets[generatorDatasetName];
        let newLessonNumber = 1;  // 默认课程编号为1
        // 如果数据集中有记录，设置为最新课程编号
        if (dataset && Object.keys(dataset.lessons).length > 0) {
          newLessonNumber = Math.max(...Object.keys(dataset.lessons).map(Number));
        }
        set({
          currentDatasetName: generatorDatasetName,
          currentLessonNumber: newLessonNumber,
        });
        log.info("Synced with generator config", "TrainingStore", {
          datasetName: generatorDatasetName,
          lessonNumber: newLessonNumber,
        });
      },

      /** 导出训练数据 */
      exportData: () => {
        const state = get();
        const exportData = {
          currentDatasetName: state.currentDatasetName,
          currentLessonNumber: state.currentLessonNumber,
          globalRecords: state.globalRecords,
        }
        log.info("Training data exported", "TrainingStore", {
          recordCount: state.globalRecords.recordCount,
        });
        return JSON.stringify(exportData, null, 2);
      },

      /** 导入训练数据 */
      importData: (jsonData) => {
        try {
          const importedData = JSON.parse(jsonData);

          // 验证数据格式
          if (!importedData.globalRecords) {
            log.error("Invalid data format", "TrainingStore");
            return;
          }

          // 验证 globalRecords 结构
          if (
            typeof importedData.globalRecords.totalDuration !== "number" ||
            typeof importedData.globalRecords.recordCount !== "number" ||
            typeof importedData.globalRecords.averageAccuracy !== "number" ||
            typeof importedData.globalRecords.datasets !== "object"
          ) {
            log.error("Invalid globalRecords structure", "TrainingStore");
            return;
          }

          const convertedRecords = { ... importedData.globalRecords };

          Object.keys(convertedRecords.datasets).forEach((datasetName) => {
            const dataset = convertedRecords.datasets[datasetName];
            Object.keys(dataset.lessons).forEach((lessonNumber) => {
              const lesson = dataset.lessons[lessonNumber];
              lesson.records = lesson.records.map((record: any) => {
                // 如果 timestamp 是数字，转换为 ISO 字符串
                if (typeof record.timestamp === "number") {
                  return {
                    ...record,
                    timestamp: new Date(record.timestamp).toISOString(),
                  };
                }
                // 如果已经是字符串，保持不变
                return record;
              });
            });
          });

          set({
            currentDatasetName: importedData.currentDatasetName || "Koch-LCWO",
            currentLessonNumber: importedData.currentLessonNumber || 1,
            globalRecords: convertedRecords,
          });

          log.info("Training data imported", "TrainingStore", {
            recordCount: convertedRecords.recordCount,
          });
          return;
        } catch (error) {
          log.error("Failed to import data", "TrainingStore", { error });
          return;
        }
      },

      /** 清空所有训练数据 */
      clearAllData: () => {
        set({
          currentDatasetName: "Koch-LCWO",
          currentLessonNumber: 1,
          globalRecords: {
            totalDuration: 0,
            recordCount: 0,
            averageAccuracy: 0,
            datasets: {},
          },
        });
        log.info("All training data cleared", "TrainingStore");
      },
    }),
    {
      name: "morse-training-store",
      partialize: (state) => ({ 
        currentDatasetName: state.currentDatasetName,
        currentLessonNumber: state.currentLessonNumber,
        globalRecords: state.globalRecords,
      }),
    }
  )
);