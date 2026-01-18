import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 设置状态接口
 */
interface SettingsState {
  // ==================== 状态 ====================
  
  /** 主音量（0-1） */
  volume: number;
  
  /** 深色主题 */
  darkTheme: boolean;
  
  /** 显示波形可视化 */
  showWaveform: boolean;
  
  /** 自动播放下一个练习 */
  autoPlayNext: boolean;
  
  /** 显示字符提示 */
  showCharacterHints: boolean;
  
  // ==================== Actions ====================
  
  /** 设置音量 */
  setVolume: (volume: number) => void;
  
  /** 切换主题 */
  toggleTheme: () => void;
  
  /** 设置主题 */
  setTheme: (dark: boolean) => void;
  
  /** 切换波形显示 */
  toggleWaveform: () => void;
  
  /** 设置波形显示 */
  setShowWaveform: (show: boolean) => void;
  
  /** 切换自动播放 */
  toggleAutoPlayNext: () => void;
  
  /** 设置自动播放 */
  setAutoPlayNext: (auto: boolean) => void;
  
  /** 切换字符提示 */
  toggleCharacterHints: () => void;
  
  /** 设置字符提示 */
  setShowCharacterHints: (show: boolean) => void;
  
  /** 重置为默认值 */
  reset: () => void;
}

/**
 * 默认设置
 */
const DEFAULT_SETTINGS = {
  volume: 0.8,
  darkTheme: false,
  showWaveform: false,
  autoPlayNext: false,
  showCharacterHints: true,
};

/**
 * 创建设置Store
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // ==================== 初始状态 ====================
      
      ...DEFAULT_SETTINGS,
      
      // ==================== Actions ====================
      
      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(1, volume)) }),
      
      toggleTheme: () =>
        set((state) => ({ darkTheme: !state.darkTheme })),
      
      setTheme: (dark) => set({ darkTheme: dark }),
      
      toggleWaveform: () =>
        set((state) => ({ showWaveform: !state.showWaveform })),
      
      setShowWaveform: (show) => set({ showWaveform: show }),
      
      toggleAutoPlayNext: () =>
        set((state) => ({ autoPlayNext: !state.autoPlayNext })),
      
      setAutoPlayNext: (auto) => set({ autoPlayNext: auto }),
      
      toggleCharacterHints: () =>
        set((state) => ({ showCharacterHints: !state.showCharacterHints })),
      
      setShowCharacterHints: (show) => set({ showCharacterHints: show }),
      
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'morse-settings-storage', // localStorage key
    }
  )
);