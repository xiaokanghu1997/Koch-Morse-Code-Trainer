import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BasicsRecord } from "../lib/types";
import { CHARACTER_SET } from "../lib/constants";
import { log } from "../utils/logger";

/**
 * 训练状态接口
 */
interface BasicsState {
  // ==================== 状态 ====================

  /** 当前训练数据集 */
  currentDatasetName: string;

  /** 当前正在练习的课程编号 */
  currentLessonNumber: number;
  
  /** 所有训练记录 */
  datasets: Record<string, Record<number, BasicsRecord[]>>;

  // ==================== 操作方法 ====================

  /** 提交训练记录 */
  submitRecord: (datasetName: string, lessonNumber: number, record: BasicsRecord) => void;

  /** 设置当前训练集 */
  setDatasetName: (datasetName: string) => void;

  /** 设置当前课程编号 */
  setLessonNumber: (lessonNumber: number) => void;

  /** 从音频配置中同步训练集 */
  syncFromOptionsConfig: (optionsDatasetName: string) => void;

  /** 导出训练数据 */
  exportData: () => string;

  /** 导入训练数据 */
  importData: (jsonData: string) => void;

  /** 清空所有训练数据 */
  clearAllData: () => void;

  /** 修改训练记录 */
  modifyRecord: (
    datasetName: string, 
    lessonNumber: number, 
    recordIndex: number, 
    updatedRecord: { timestamp: number; accuracy: number; duration: number }
  ) => boolean;
}

/**
 * 创建训练Store
 */
export const useBasicsStore = create<BasicsState>()(
  persist(
    (set, get) => ({
      // ==================== 初始状态 ====================
      currentDatasetName: "Koch-LCWO",
      currentLessonNumber: 1,
      datasets: {},

      // ==================== 操作方法 ====================
      /** 提交训练记录 */
      submitRecord: (datasetName, lessonNumber, record) => {
        set((state) => ({
          // 深拷贝避免直接修改状态
          datasets: {
            ...state.datasets,
            [datasetName]: {
              ...state.datasets[datasetName],
              [lessonNumber]: [
                ...(state.datasets[datasetName]?.[lessonNumber] || []),
                record,
              ],
            },
          },
        }));
        log.info("Basics training record submitted", "BasicsStore", {
          dataset: datasetName,
          lesson: lessonNumber,
          accuracy: record.accuracy,
          duration: record.duration,
        });
      },

      /** 设置当前训练集 */
      setDatasetName: (datasetName) => {
        // 检测数据集是否存在
        if (!(datasetName in CHARACTER_SET)) {
          log.error(`Unknown basic training dataset: ${datasetName}`, "BasicsStore");
          return;
        }
        // 获取已有记录的课程，如果不存在则返回第1课
        const dataset = get().datasets[datasetName];
        const latestLessonNumber =
          dataset && Object.keys(dataset).length > 0
            ? Math.max(...Object.keys(dataset).map(Number)) // 计算最新课程编号
            : 1; // 如果没有记录则重置为1
        set({ currentDatasetName: datasetName, currentLessonNumber: latestLessonNumber })
      },

      /** 设置当前课程编号 */
      setLessonNumber: (lessonNumber) => {
        const datasetName = get().currentDatasetName;
        if (!(datasetName in CHARACTER_SET)) {
          log.error(`${datasetName} not found in CHARACTER_SET`, "BasicsStore");
          return;
        }
        const characterSet = CHARACTER_SET[datasetName as keyof typeof CHARACTER_SET];
        const totalLessons = characterSet.length - 1; // 获取训练集的总课程数
        if (lessonNumber < 1 || lessonNumber > totalLessons) {
          log.error(`Invalid lesson number: ${lessonNumber}`, "BasicsStore");
          return;
        }
        set({ currentLessonNumber: lessonNumber });
      },

      /** 从音频配置中同步训练集 */
      syncFromOptionsConfig: (optionsDatasetName) => {
        const state = get();
        // 验证数据集是否存在
        if (!(optionsDatasetName in CHARACTER_SET)) {
          log.error(`Unknown options dataset: ${optionsDatasetName}`, "BasicsStore");
          return;
        }
        // 如果训练集名称相同，不需要修改（保持当前课程编号）
        if (state.currentDatasetName === optionsDatasetName) {
          log.info("Dataset already synced", "BasicsStore", {
            datasetName: optionsDatasetName,
            lessonNumber: state.currentLessonNumber,
          });
          return;
        }
        // 训练集名称不同，更新训练集名称和课程编号
        const dataset = state.datasets[optionsDatasetName];
        let newLessonNumber = 1;  // 默认课程编号为1
        // 如果数据集中有记录，设置为最新课程编号
        if (dataset && Object.keys(dataset).length > 0) {
          newLessonNumber = Math.max(...Object.keys(dataset).map(Number));
        }
        set({
          currentDatasetName: optionsDatasetName,
          currentLessonNumber: newLessonNumber,
        });
        log.info("Synced with options config", "BasicsStore", {
          datasetName: optionsDatasetName,
          lessonNumber: newLessonNumber,
        });
      },

      /** 导出训练数据 */
      exportData: () => {
        const state = get();
        const exportData = {
          currentDatasetName: state.currentDatasetName,
          currentLessonNumber: state.currentLessonNumber,
          datasets: state.datasets,
        }
        log.info("Basics training data exported", "BasicsStore", {
          datasetCount: Object.keys(state.datasets).length,
        });
        return JSON.stringify(exportData, null, 2);
      },

      /** 导入训练数据 */
      importData: (jsonData) => {
        try {
          const importedData = JSON.parse(jsonData);
          // 验证数据格式
          if (!importedData.datasets) {
            log.error("Invalid data format", "BasicsStore");
            return;
          }
          // 验证 datasets 结构
          if (typeof importedData.datasets !== "object") {
            log.error("Invalid datasets structure", "BasicsStore");
            return;
          }
          set({
            currentDatasetName: importedData.currentDatasetName || "Koch-LCWO",
            currentLessonNumber: importedData.currentLessonNumber || 1,
            datasets: importedData.datasets,
          });
          log.info("Basics training data imported", "BasicsStore", {
            datasetCount: Object.keys(importedData.datasets).length,
          });
          return;
        } catch (error) {
          log.error("Failed to import data", "BasicsStore", { error });
          return;
        }
      },

      /** 清空所有训练数据 */
      clearAllData: () => {
        set({
          currentDatasetName: "Koch-LCWO",
          currentLessonNumber: 1,
          datasets: {},
        });
        log.info("All basics training data cleared", "BasicsStore");
      },

      /** 修改训练记录 */
      modifyRecord: (datasetName, lessonNumber, recordIndex, updatedRecord) => {
        const state = get();
        // 验证数据
        const lessonRecords = state.datasets[datasetName]?.[lessonNumber];
        if (!lessonRecords || recordIndex < 0 || recordIndex >= lessonRecords.length) {
          log.error("Invalid record index for modification", "BasicsStore", {
            dataset: datasetName,
            lesson: lessonNumber,
            recordIndex: recordIndex,          });
          return false;
        }
        // 更新记录
        set((state) => ({
          datasets: {
            ...state.datasets,
            [datasetName]: {
              ...state.datasets[datasetName],
              [lessonNumber]: state.datasets[datasetName][lessonNumber].map((record, index) =>
                index === recordIndex ? { ...updatedRecord } : record
              ),
            },
          },
        }));
        log.info("Basics training record modified", "BasicsStore", {
          dataset: datasetName,
          lesson: lessonNumber,
          recordIndex: recordIndex,
        });
        return true;
      },
    }),
    {
      name: "morse-basics-store",
      partialize: (state) => ({ 
        currentDatasetName: state.currentDatasetName,
        currentLessonNumber: state.currentLessonNumber,
        datasets: state.datasets,
      }),
    }
  )
);