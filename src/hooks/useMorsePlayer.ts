import { useState, useRef, useEffect, useCallback } from 'react';
import { PlayerController } from '../services/playerController';
import type { AudioConfig, PlaybackState } from '../lib/types';
import { log } from '../utils/logger';

/**
 * 字符播放回调函数类型
 */
type CharacterPlayCallback = (char: string, index: number) => void;

/**
 * 播放完成回调函数类型
 */
type PlaybackFinishedCallback = () => void;

/**
 * useMorsePlayer Hook返回值类型
 */
interface UseMorsePlayerReturn {
  // 播放控制
  playText: (text: string, config: AudioConfig) => Promise<void>;
  playCharacter: (char: string, config: AudioConfig, repeat?: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  replay: () => void;
  setPosition: (milliseconds: number) => void;
  
  // 状态
  state: PlaybackState;
  isPlaying: boolean;
  isPaused: boolean;
  isIdle: boolean;
  remainingTime: number;
  
  // 事件监听
  onCharacterPlay: (callback: CharacterPlayCallback) => void;
  onPlaybackFinished: (callback: PlaybackFinishedCallback) => void;
  
  // 参数设置
  setFrequency: (freq: number) => void;
  setVolume: (volume: number) => void;
  
  // 波形数据（可选）
  getAnalyserNode: () => AnalyserNode | null;
}

/**
 * 摩尔斯播放器Hook
 */
export const useMorsePlayer = (): UseMorsePlayerReturn => {
  // ==================== 状态管理 ====================
  
  /** 播放状态 */
  const [state, setState] = useState<PlaybackState>({
    status: 'idle',
    currentTime: 0,
    totalDuration: 0,
    pausedAt: 0,
    currentCharIndex: 0,
    currentChar: null,
    text: '',
  });
  
  /** 剩余时间 */
  const [remainingTime, setRemainingTime] = useState(0);
  
  // ==================== Refs ====================
  
  /** 播放控制器实例 */
  const playerRef = useRef<PlayerController | null>(null);
  
  /** 字符播放回调列表 */
  const charCallbacksRef = useRef<CharacterPlayCallback[]>([]);
  
  /** 播放完成回调列表 */
  const finishCallbacksRef = useRef<PlaybackFinishedCallback[]>([]);
  
  // ==================== 初始化 ====================
  
  useEffect(() => {
    // 创建播放控制器
    const player = new PlayerController();
    player.initialize();
    playerRef.current = player;

    // 监听状态变化
    const unsubscribeState = player.onStateChange((newState) => {
      setState(newState);
      setRemainingTime(player.getRemainingTime());
    });

    // 监听字符播放
    const unsubscribeChar = player.onCharacterPlay((char, index) => {
      charCallbacksRef.current.forEach(callback => callback(char, index));
    });

    // 监听播放完成
    const unsubscribeFinish = player.onPlaybackFinished(() => {
      finishCallbacksRef.current.forEach(callback => callback());
    });

    // 清理
    return () => {
      unsubscribeState();
      unsubscribeChar();
      unsubscribeFinish();
      player.dispose();
    };
  }, []);

  // ==================== 播放控制方法 ====================
  
  /**
   * 播放文本
   */
  const playText = useCallback(async (text: string, config: AudioConfig) => {
    if (!playerRef.current) return;
    
    try {
      await playerRef.current.play(text, config);
    } catch (error) {
      log.error('Failed to play text', 'MorsePlayer', error);
      throw error;
    }
  }, []);

  /**
   * 播放单个字符
   */
  const playCharacter = useCallback(
    async (char: string, config: AudioConfig, repeat: number = 1) => {
      if (!playerRef.current) return;
      
      try {
        await playerRef.current.playCharacter(char, config, repeat);
      } catch (error) {
        log.error('Failed to play character', 'MorsePlayer', error);
        throw error;
      }
    },
    []
  );

  /**
   * 暂停
   */
  const pause = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.pause();
  }, []);

  /**
   * 恢复
   */
  const resume = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.resume();
  }, []);

  /**
   * 停止
   */
  const stop = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.stop();
  }, []);

  /**
   * 重播
   */
  const replay = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.replay();
  }, []);

  /**
   * 设置播放位置
   */
  const setPosition = useCallback((milliseconds: number) => {
    if (!playerRef.current) return;
    playerRef.current.setPosition(milliseconds);
  }, []);

  // ==================== 事件监听方法 ====================
  
  /**
   * 注册字符播放回调
   */
  const onCharacterPlay = useCallback((callback: CharacterPlayCallback) => {
    charCallbacksRef.current.push(callback);
  }, []);

  /**
   * 注册播放完成回调
   */
  const onPlaybackFinished = useCallback((callback: PlaybackFinishedCallback) => {
    finishCallbacksRef.current.push(callback);
  }, []);

  // ==================== 参数设置方法 ====================
  
  /**
   * 设置音调频率
   */
  const setFrequency = useCallback((freq: number) => {
    if (!playerRef.current) return;
    playerRef.current.setFrequency(freq);
  }, []);

  /**
   * 设置音量
   */
  const setVolume = useCallback((volume: number) => {
    if (!playerRef.current) return;
    playerRef.current.setVolume(volume);
  }, []);

  /**
   * 获取 AnalyserNode（用于波形可视化）
   */
  const getAnalyserNode = useCallback((): AnalyserNode | null => {
    if (!playerRef.current) return null;
    return playerRef.current.getAnalyserNode();
  }, []);

  // ==================== 计算属性 ====================
  
  const isPlaying = state.status === 'playing';
  const isPaused = state.status === 'paused';
  const isIdle = state.status === 'idle';

  // ==================== 返回值 ====================
  
  return {
    // 播放控制
    playText,
    playCharacter,
    pause,
    resume,
    stop,
    replay,
    setPosition,
    
    // 状态
    state,
    isPlaying,
    isPaused,
    isIdle,
    remainingTime,
    
    // 事件监听
    onCharacterPlay,
    onPlaybackFinished,
    
    // 参数设置
    setFrequency,
    setVolume,
    
    // 波形数据
    getAnalyserNode,
  };
};