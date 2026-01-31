import { useState, useRef, useCallback, useEffect } from "react";

export type TimingPhase = "idle" | "delay" | "playing";

export interface UseTimingReturn {
  /** 当前阶段 */
  phase: TimingPhase;
  /** 倒计时秒数 */
  countdown: number;
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 总时长（秒） */
  totalDuration: number;
  /** 格式化延迟倒计时 (MM:SS) */
  formattedDelayCountdown: string;
  /** 格式化的倒计时 (MM:SS) */
  formattedCountdown: string;
  /** 格式化的当前时间 (MM:SS) */
  formattedCurrentTime: string;
  /** 格式化的总时长 (MM:SS) */
  formattedTotalDuration: string;
  /** 开始延迟倒计时 */
  startDelay: (seconds: number, onComplete: () => void) => void;
  /** 设置总时长 */
  setTotalDuration: (duration: number) => void;
  /** 开始播放计时 */
  startPlaying: (duration: number) => void;
  /** 更新当前时间 */
  updateCurrentTime: (time: number) => void;
  /** 暂停计时（不重置状态） */
  pause: () => void;
  /** 恢复计时 */
  resume: () => void;
  /** 停止计时 */
  stop: () => void;
  /** 重置 */
  reset: () => void;
}

/**
 * 格式化时间为 MM:SS
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return "00:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 时间管理 Hook
 * 
 * 功能：
 * - 延迟倒计时
 * - 播放倒计时
 * - 播放时间追踪（00:00 格式）
 */
export const useTiming = (): UseTimingReturn => {
  const [phase, setPhase] = useState<TimingPhase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  const timerRef = useRef<number | null>(null);

  /** 清除定时器 */
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** 开始延迟倒计时 */
  const startDelay = useCallback((seconds: number, onComplete: () => void) => {
    clearTimer();
    setPhase("delay");
    setCountdown(seconds);

    timerRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearTimer();
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  /** 开始播放计时 */
  const startPlaying = useCallback((duration: number) => {
    clearTimer();
    setPhase("playing");
    setTotalDuration(duration);
    setCurrentTime(0);
    setCountdown(Math.ceil(duration));

    timerRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  /** 更新当前播放时间 */
  const updateCurrentTime = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  /** 暂停计时（不重置状态） */
  const pause = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  /** 停止计时 */
  const stop = useCallback(() => {
    clearTimer();
    setPhase("idle");
  }, [clearTimer]);

  /** 恢复计时 */
  const resume = useCallback(() => {
    if (phase !== "playing") return;
    clearTimer();
    // 继续倒计时
    timerRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [phase, clearTimer]);

  /** 重置所有状态 */
  const reset = useCallback(() => {
    clearTimer();
    setPhase("idle");
    setCountdown(0);
    setCurrentTime(0);
    setTotalDuration(0);
  }, [clearTimer]);

  /** 清理 */
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // 返回接口
  return {
    phase,
    countdown,
    currentTime,
    totalDuration,
    formattedDelayCountdown: formatTime(countdown),
    formattedCountdown: formatTime(countdown),
    formattedCurrentTime: formatTime(currentTime),
    formattedTotalDuration: formatTime(totalDuration),
    startDelay,
    setTotalDuration: (duration: number) => setTotalDuration(duration),
    startPlaying,
    updateCurrentTime,
    pause,
    resume,
    stop,
    reset,
  };
};