import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdvancedType, AdvancedRecord } from "../lib/types";
import { log } from "../utils/logger";

/**
 * 训练状态接口
 */
interface AdvancedState {
  // ==================== 状态 ====================

  /** 单词训练记录 */
  Word: AdvancedRecord[];

  /** 呼号训练记录 */
  Callsign: AdvancedRecord[];

  /** QTC训练记录 */
  QTC: AdvancedRecord[];

  // ==================== 操作方法 ====================
  submitRecord: (trainingType: AdvancedType, record: AdvancedRecord) => void;
}

/**
 * 创建进阶训练Store
 */
export const useAdvancedStore = create<AdvancedState>()(
  persist(
    (set) => ({
      // ==================== 初始状态 ====================
      Word: [],
      Callsign: [],
      QTC: [],

      // ==================== 操作方法 ====================
      /** 提交训练记录 */
      submitRecord: (trainingType, record) => {
        set((state) => ({
          [trainingType]: [...state[trainingType], record],
        }));
        log.info("Advanced training record submitted", "AdvancedStore", {
          trainingType,
          timestamp: record.timestamp,
          duration: record.duration,
          charSpeed: record.charSpeed,
          score: record.score,
        });
      },
    }),
    {
      name: "morse-advanced-store",
      partialize: (state) => ({
        Word: state.Word,
        Callsign: state.Callsign,
        QTC: state.QTC,
      }),
    }
  )
);