import { useState, useRef, useEffect, useCallback } from 'react';
import { PlayerController } from '../services/playerController';
import { TextGenerator } from '../services/textGenerator';
import { PreviewGenerator } from '../services/previewGenerator';
import { PREVIEW_CONFIG } from '../lib/constants';
import type { GeneratorConfig } from '../lib/types';

/**
 * useMorseGenerator Hook返回值类型
 */
interface UseMorseGeneratorReturn {
  // 文本生成
  generateText: (config: GeneratorConfig) => string;
  
  // 预览播放
  playPreview: (config: GeneratorConfig) => void;
  stopPreview: () => void;
  isPreviewPlaying: boolean;
  previewCountdown: number;
  
  // 配置管理
  saveConfig: (config: GeneratorConfig) => void;
  loadConfig: () => GeneratorConfig | null;
}

/**
 * 配置存储键
 */
const CONFIG_STORAGE_KEY = 'morse_generator_config';

/**
 * 摩尔斯生成器Hook
 */
export const useMorseGenerator = (): UseMorseGeneratorReturn => {
  // ==================== 状态管理 ====================
  
  /** 预览播放状态 */
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  
  /** 预览倒计时 */
  const [previewCountdown, setPreviewCountdown] = useState(PREVIEW_CONFIG.DURATION as number);
  
  // ==================== Refs ====================
  
  /** 播放控制器实例 */
  const playerRef = useRef<PlayerController | null>(null);
  
  /** 倒计时定时器ID */
  const countdownTimerRef = useRef<number | null>(null);
  
  // ==================== 初始化 ====================
  
  useEffect(() => {
    // 创建播放控制器
    playerRef.current = new PlayerController();
    playerRef.current.initialize();

    // 监听播放完成
    const unsubscribe = playerRef.current.onPlaybackFinished(() => {
      setIsPreviewPlaying(false);
      setPreviewCountdown(PREVIEW_CONFIG.DURATION as number);
      clearCountdownTimer();
    });

    // 清理
    return () => {
      unsubscribe();
      clearCountdownTimer();
      playerRef.current?.dispose();
    };
  }, []);

  // ==================== 倒计时管理 ====================
  
  /**
   * 启动倒计时
   */
  const startCountdown = useCallback(() => {
    clearCountdownTimer();

    setPreviewCountdown(PREVIEW_CONFIG.DURATION);

    countdownTimerRef.current = window.setInterval(() => {
      setPreviewCountdown(prev => {
        if (prev <= 1) {
          clearCountdownTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /**
   * 清除倒计时定时器
   */
  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // ==================== 文本生成 ====================
  
  /**
   * 生成完整训练文本
   */
  const generateText = useCallback((config: GeneratorConfig): string => {
    const textGen = new TextGenerator();

    // 注意：这里需要知道当前课程编号
    // 实际使用时可能需要从外部传入或从store获取
    // 这里简化处理，使用完整字符集
    const { trainingSet } = config;

    const text = textGen.generate({
      charSet: trainingSet,  // 简化：直接使用字符集名称
      mode: config.practiceMode,
      groupLength: config.groupLength,
      groupSpacing: config.groupSpacing,
      targetDuration: config.duration * 60,  // 转换为秒
      audioConfig: {
        charSpeed: config.charSpeed,
        effSpeed: config.effSpeed,
        tone: config.tone,
        volume: config.volume,
      },
      usePrefixSuffix: config.usePrefixSuffix,
    });

    return text;
  }, []);

  // ==================== 预览播放 ====================
  
  /**
   * 播放预览
   */
  const playPreview = useCallback((config: GeneratorConfig) => {
    if (!playerRef.current) return;

    // 生成预览文本
    const previewGen = new PreviewGenerator();
    const previewText = previewGen.generatePreview(config.trainingSet, {
      charSpeed: config.charSpeed,
      effSpeed: config.effSpeed,
      tone: config.tone,
      volume: config.volume,
    });

    console.log('Preview text:', previewText);

    // 播放
    playerRef.current.play(previewText, {
      charSpeed: config.charSpeed,
      effSpeed: config.effSpeed,
      tone: config.tone,
      volume: config.volume,
    });

    // 更新状态
    setIsPreviewPlaying(true);
    
    // 启动倒计时
    startCountdown();
  }, [startCountdown]);

  /**
   * 停止预览
   */
  const stopPreview = useCallback(() => {
    if (!playerRef.current) return;

    playerRef.current.stop();
    setIsPreviewPlaying(false);
    setPreviewCountdown(PREVIEW_CONFIG.DURATION);
    clearCountdownTimer();
  }, [clearCountdownTimer]);

  // ==================== 配置管理 ====================
  
  /**
   * 保存配置到localStorage
   */
  const saveConfig = useCallback((config: GeneratorConfig) => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      console.log('Config saved');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }, []);

  /**
   * 从localStorage加载配置
   */
  const loadConfig = useCallback((): GeneratorConfig | null => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        console.log('Config loaded');
        return config;
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    return null;
  }, []);

  // ==================== 返回值 ====================
  
  return {
    generateText,
    playPreview,
    stopPreview,
    isPreviewPlaying,
    previewCountdown,
    saveConfig,
    loadConfig,
  };
};