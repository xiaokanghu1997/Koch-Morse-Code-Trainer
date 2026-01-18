import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_GENERATOR_CONFIG } from '../lib/constants';
import type { GeneratorConfig } from '../lib/types';

/**
 * 生成器状态接口
 */
interface GeneratorState {
  // ==================== 状态 ====================
  
  /** 当前配置 */
  config: GeneratorConfig;
  
  /** 生成的文本 */
  generatedText: string;
  
  /** 预览播放状态 */
  isPreviewPlaying: boolean;
  
  // ==================== Actions ====================
  
  /** 设置配置 */
  setConfig: (config: GeneratorConfig) => void;
  
  /** 部分更新配置 */
  updateConfig: (updates: Partial<GeneratorConfig>) => void;
  
  /** 设置生成的文本 */
  setGeneratedText: (text: string) => void;
  
  /** 设置预览播放状态 */
  setIsPreviewPlaying: (playing: boolean) => void;
  
  /** 重置配置为默认值 */
  resetConfig: () => void;
  
  /** 重置所有状态 */
  reset: () => void;
}

/**
 * 创建生成器Store
 */
export const useGeneratorStore = create<GeneratorState>()(
  persist(
    (set) => ({
      // ==================== 初始状态 ====================
      
      config: DEFAULT_GENERATOR_CONFIG,
      generatedText: '',
      isPreviewPlaying: false,
      
      // ==================== Actions ====================
      
      setConfig: (config) => set({ config }),
      
      updateConfig: (updates) =>
        set((state) => ({
          config: { ...state.config, ...updates },
        })),
      
      setGeneratedText: (text) => set({ generatedText: text }),
      
      setIsPreviewPlaying: (playing) => set({ isPreviewPlaying: playing }),
      
      resetConfig: () => set({ config: DEFAULT_GENERATOR_CONFIG }),
      
      reset: () =>
        set({
          config: DEFAULT_GENERATOR_CONFIG,
          generatedText: '',
          isPreviewPlaying: false,
        }),
    }),
    {
      name: 'morse-generator-storage', // localStorage key
      partialize: (state) => ({ config: state.config }), // 只持久化config
    }
  )
);