import { useState, useRef, useEffect, useCallback } from "react";
import { AudioPlayer } from "../services/audioPlayer";
import type { GeneratorConfig, PlaybackState } from "../lib/types";
import { log } from "../utils/logger";

export interface UseMorsePlayerReturn {
  /** 播放状态 */
  playbackState: PlaybackState;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 是否暂停 */
  isPaused: boolean;
  /** 是否空闲 */
  isIdle: boolean;
  /** 预加载 */
  preload: (text: string, config: GeneratorConfig) => void;
  /** 播放 */
  play: () => Promise<void>;
  /** 暂停 */
  pause: () => void;
  /** 恢复 */
  resume: () => void;
  /** 停止 */
  stop: () => void;
  /** 跳转 */
  seek: (time: number) => void;
  /** 波形数据 */
  waveformData: [number, number][];
}

/**
 * 摩尔斯播放器 Hook
 * 
 * 功能：
 * - 封装 AudioPlayer
 * - 提供 React 组件可用的接口
 * - 管理播放器生命周期
 */
export const useMorsePlayer = (): UseMorsePlayerReturn => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    status: "idle",
    currentTime: 0,
    totalDuration: 0,
    pausedAt: 0,
  });

  // 波形数据
  const [waveformData, setWaveformData] = useState<[number, number][]>([]);

  const playerRef = useRef<AudioPlayer | null>(null);

  // 初始化播放器
  useEffect(() => {
    const player = new AudioPlayer();
    player.initialize();
    
    // 监听状态变化
    player.onStateChange((state) => {
      setPlaybackState(state);
    });
    
    playerRef.current = player;
    
    log.info("Morse player initialized", "useMorsePlayer");
    
    // 清理
    return () => {
      player.dispose();
      log.info("Morse player disposed", "useMorsePlayer");
    };
  }, []);

  // 播放控制方法

  /** 预加载 */
  const preload = useCallback((text: string, config: GeneratorConfig) => {
    if (!playerRef.current) {
      log.warn("Player not initialized", "useMorsePlayer");
      return;
    }

    // 提取音频配置
    const audioConfig = {
      charSpeed: config.charSpeed,
      effSpeed: config.effSpeed,
      tone: config.tone,
    };

    playerRef.current.preload(text, audioConfig);

    const newWaveformData = playerRef.current.getWaveformData();
    setWaveformData(newWaveformData);
  }, []);

  /** 播放 */
  const play = useCallback(async () => {
    if (!playerRef.current) {
      log.warn("Player not initialized", "useMorsePlayer");
      return;
    }

    try {
      await playerRef.current.play();
    } catch (error) {
      log.error("Failed to play", "useMorsePlayer", error);
    }
  }, []);

  /** 暂停 */
  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  /** 恢复 */
  const resume = useCallback(() => {
    playerRef.current?.resume();
  }, []);

  /** 停止 */
  const stop = useCallback(() => {
    playerRef.current?.stop();
  }, []);

  /** 跳转到指定位置 */
  const seek = useCallback((time: number) => {
    playerRef.current?.seek(time);
  }, []);

  // 返回接口
  return {
    playbackState,
    isPlaying: playbackState.status === "playing",
    isPaused: playbackState.status === "paused",
    isIdle: playbackState.status === "idle",
    preload,
    play,
    pause,
    resume,
    stop,
    seek,
    waveformData,
  };
};