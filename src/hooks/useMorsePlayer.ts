import { useState, useRef, useEffect, useCallback } from "react";
import { PlayerController } from "../services/playerController";
import { useSettingsStore } from "../stores/settingsStore";
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
  play: (text: string, config: GeneratorConfig) => Promise<void>;
  /** 暂停 */
  pause: () => void;
  /** 恢复 */
  resume: () => void;
  /** 停止 */
  stop: () => void;
  /** 重播 */
  replay: () => Promise<void>;
  /** 跳转 */
  seek: (time: number) => void;
  /** 获取波形数据 */
  getWaveformData: () => [number, number][];
}

/**
 * 摩尔斯播放器 Hook
 * 
 * 功能：
 * - 播放/暂停/停止/重播
 * - 进度控制（seek）
 * - 自动同步音量
 */
export const useMorsePlayer = (): UseMorsePlayerReturn => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    status: "idle",
    currentTime: 0,
    totalDuration: 0,
    pausedAt: 0,
  });

  const playerRef = useRef<PlayerController | null>(null);
  const { volume } = useSettingsStore();

  // 初始化播放器

  useEffect(() => {
    const player = new PlayerController();
    
    // 监听状态变化
    player.onStateChange((state) => {
      setPlaybackState(state);
    });

    // 设置音量
    player.setVolume(volume / 100);
    
    playerRef.current = player;
    
    return () => {
      player.dispose();
    };
  }, []);

  // 音量同步

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume / 100);
    }
  }, [volume]);

  // 播放控制方法

  /** 预加载 */ 
  const preload = useCallback((text: string, config: GeneratorConfig) => {
    if (!playerRef.current) {
      log.warn("PlayerController not initialized", "useMorsePlayer");
      return;
    }

    playerRef.current.preload(text, {
      charSpeed: config.charSpeed,
      effSpeed: config.effSpeed,
      tone: config.tone,
    });
  }, []);

  /** 播放 */
  const play = useCallback(async (text: string, config: GeneratorConfig) => {
    if (!playerRef.current) {
      log.warn("PlayerController not initialized", "useMorsePlayer");
      return;
    }

    try {
      await playerRef.current.play(text, {
        charSpeed: config.charSpeed,
        effSpeed: config.effSpeed,
        tone: config.tone,
      });
      log.info("Playback started", "useMorsePlayer");
    } catch (error) {
      log.error("Failed to start playback", "useMorsePlayer", error);
      return;
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

  /** 重播 */
  const replay = useCallback(async () => {
    if (!playerRef.current) {
      log.warn("PlayerController not initialized", "useMorsePlayer");
      return;
    }

    try {
      await playerRef.current.replay();
      log.info("Replay started", "useMorsePlayer");
    } catch (error) {
      log.error("Failed to replay", "useMorsePlayer", error);
      return;
    }
  }, []);

  /** 跳转到指定位置 */
  const seek = useCallback((time: number) => {
    playerRef.current?.seek(time);
  }, []);

  /** 获取波形数据 */
  const getWaveformData = useCallback((): [number, number][] => {
    if (!playerRef.current) {
      log.warn("PlayerController not initialized", "useMorsePlayer");
      return [];
    }
    return playerRef.current.getWaveformData();
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
    replay,
    seek,
    getWaveformData,
  };
};