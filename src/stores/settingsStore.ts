import { labelClassNames } from "@fluentui/react-components";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 设置状态接口
 */
interface SettingsState {
  // ==================== 状态 ====================
  
  /** 主题 */
  theme: "Light" | "Dark";

  /** 语言 */
  language: "English" | "中文";

  /** 窗口透明度（10-100） */
  opacity: number;

  /** 主音量（0-100） */
  volume: number;
  
  // ==================== 操作方法 ====================
  
  /** 设置主题 */
  setTheme: (theme: "Light" | "Dark") => void;

  /** 设置语言 */
  setLanguage: (language: "English" | "中文") => void;

  /** 设置窗口透明度 */
  setOpacity: (opacity: number) => void;

  /** 设置主音量 */
  setVolume: (volume: number) => void;

  /** 重置所有设置为默认值 */
  reset: () => void;
}

/**
 * 默认设置
 */
const DEFAULT_SETTINGS = {
  theme: "Light" as const,
  language: "English" as const,
  opacity: 100,
  volume: 80,
};

/**
 * 创建设置Store
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // ==================== 初始状态 ====================
      
      ...DEFAULT_SETTINGS,
      
      // ==================== 操作方法 ====================

      /** 设置主题 */
      setTheme: (theme) => set({ theme }),

      /** 设置语言 */
      setLanguage: (language) => set({ language }),

      /** 设置窗口透明度 */
      setOpacity: (opacity) => set({ opacity: Math.max(10, Math.min(100, opacity)) }),

      /** 设置主音量 */
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),

      /** 重置所有设置为默认值 */
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "morse-settings-storage",
      // 只持久化 theme 和 volume 设置
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        volume: state.volume,
      }),
    }
  )
);