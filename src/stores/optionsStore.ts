import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OptionsConfig } from "../lib/types";

/**
 * 默认生成器配置
 */
const INITIAL_CONFIG: OptionsConfig = {
  // 音频参数
  charSpeed: 20,
  effSpeed: 10,
  tone: 600,

  // 生成参数
  datasetName: "Koch-LCWO",
  practiceMode: "Gradual",
  groupLength: 5,
  randomGroupLength: false,
  groupSpace: 1,
  groupCount: 10,
  startDelay: 3,
  usePrefixSuffix: false,
  showWaveform: false,
};

/**
 * 生成器状态接口
 */
interface OptionsState {
  // ==================== 状态 ====================

  /** 已保存的配置 */
  savedConfig: OptionsConfig;
  
  // ==================== 操作方法 ====================

  /** 保存配置 */
  saveConfig: (config: OptionsConfig) => void;
  
  /** 重置配置 */
  reset: () => void;
}

/**
 * 创建生成器Store
 */
export const useOptionsStore = create<OptionsState>()(
  persist(
    (set) => ({
      // ==================== 初始状态 ====================
      
      savedConfig: INITIAL_CONFIG,
      
      // ==================== 操作方法 ====================
      
      saveConfig: (config) => set({ savedConfig: config }),

      reset: () => set({ savedConfig: INITIAL_CONFIG }),
    }),
    {
      name: "morse-options-storage",
      partialize: (state) => ({
        savedConfig: state.savedConfig,
      }),
    }
  )
);