import { AudioGenerator } from "../lib/audio";
import type { AudioConfig, PlaybackState, AudioEvent } from "../lib/types";
import { log } from "../utils/logger";

/**
 * 播放控制器类
 * 
 * 功能：
 * - 播放/暂停/停止/重播
 * - 进度条拖动
 * - 状态管理
 */
export class PlayerController {
  // ==================== 核心组件 ====================
  
  /** 音频生成器实例 */
  private audioGenerator: AudioGenerator;
  
  /** 播放状态实例 */
  private playbackState: PlaybackState;
  
  // ==================== 内部状态 ====================
  
  /** 当前播放文本 */
  private currentText: string = "";

  /** 当前音频配置 */
  private currentConfig: AudioConfig | null = null;

  /** 当前生成的音频事件序列 */
  private currentEvents: AudioEvent[] = [];
  
  // ==================== 进度追踪 ====================

  /** 进度更新定时器 */
  private progressInterval: number | null = null;

  /** 进度更新间隔 */
  private readonly PROGRESS_UPDATE_INTERVAL = 100; // ms
  
  // ==================== 回调 ====================

  /** 状态变化回调 */
  private stateChangeCallbacks?: (state: PlaybackState) => void;

  // ==================== 构造函数 ====================
  constructor() {
    // 创建音频生成器
    this.audioGenerator = new AudioGenerator();

    // 音频生成器初始化
    this.audioGenerator.initialize();
    
    // 初始化状态
    this.playbackState = {
      status: "idle",
      currentTime: 0,
      totalDuration: 0,
      pausedAt: 0,
    };
  }

  // ==================== 播放控制方法 ====================

  /**
   * 预加载文本（生成事件序列但不播放）
   * 
   * @param text - 要预加载的文本
   * @param config - 音频配置
   */
  preload(text: string, config: AudioConfig): void {
    try {
      // 保存当前文本和配置
      this.currentText = text;
      this.currentConfig = config;

      // 设置音调
      this.audioGenerator.setFrequency(config.tone);

      // 生成事件序列
      const events = this.audioGenerator.generateEvents(text, config);

      // 保存到 PlayerController
      this.audioGenerator.saveEvents(events);
      this.currentEvents = events;

      // 计算时长
      const duration = events.length > 0 
        ? events[events.length - 1].time
        : 0;

      // 更新总时长（但保持 idle 状态）
      this.playbackState.totalDuration = duration;

      // 触发状态回调
      this.emitStateChange();

      log.info("Content preloaded", "PlayerController", {
        textLength: text.length,
        duration: duration.toFixed(1),
      });
    } catch (error) {
      log.error("Failed to preload content", "PlayerController", error);
    }
  }

  /**
   * 播放文本
   * 
   * @param text - 要播放的文本
   * @param config - 音频配置
   * @returns Promise（播放开始后resolve）
   */
  async play(text: string, config: AudioConfig): Promise<void> {
    try {
      // 保存当前文本和配置
      this.currentText = text;
      this.currentConfig = config;

      // 停止当前播放
      this.stop();

      // 应用音频参数
      this.audioGenerator.setFrequency(config.tone);

      // 生成事件序列
      this.currentEvents = this.audioGenerator.generateEvents(text, config);

      // 调度音频播放
      const duration = this.audioGenerator.schedule(this.currentEvents);

      // 更新状态
      this.playbackState.status = "playing";
      this.playbackState.currentTime = 0;
      this.playbackState.totalDuration = duration;
      this.playbackState.pausedAt = 0;

      // 启动进度追踪
      this.startProgressTracking();

      // 触发状态回调
      this.emitStateChange();

      log.info("Playback started", "PlayerController", {
        textLength: text.length,
        duration: duration.toFixed(1), 
      });
    } catch (error) {
      log.error("Failed to start playback", "PlayerController", error);
      return;
    }
  }

  /**
   * 暂停播放
   * 
   * 记录暂停时间点，暂停AudioContext
   */
  pause(): void {
    if (this.playbackState.status !== "playing") return;

    // 暂停音频
    this.audioGenerator.suspend();

    // 记录暂停时间
    this.playbackState.pausedAt = this.audioGenerator.getCurrentTime();
    this.playbackState.status = "paused";
    this.playbackState.currentTime = this.playbackState.pausedAt;

    // 更新状态
    this.stopProgressTracking();

    // 触发状态回调
    this.emitStateChange();

    log.info("Playback paused", "PlayerController");
  }

  /**
   * 恢复播放
   * 
   * 从暂停点继续播放
   */
  resume(): void {
    if (this.playbackState.status !== "paused") return;

    // 恢复音频
    this.audioGenerator.resume();

    // 更新状态
    this.playbackState.status = "playing";

    // 继续进度追踪
    this.startProgressTracking();

    // 触发状态回调
    this.emitStateChange();

    log.info("Playback resumed", "PlayerController");
  }

  /**
   * 停止播放
   * 
   * 完全停止并重置状态
   */
  stop(): void {
    if (this.playbackState.status === "idle") return;

    // 停止音频
    this.audioGenerator.stop();

    // 确保 AudioContext 恢复初始状态
    this.audioGenerator.resume();

    // 停止进度追踪
    this.stopProgressTracking();

    // 重置状态
    this.playbackState.status = "idle";
    this.playbackState.currentTime = 0;
    this.playbackState.pausedAt = 0;

    // 触发状态回调
    this.emitStateChange();

    log.info("Playback stopped", "PlayerController");
  }

  /**
   * 重新播放
   * 
   * 从头开始播放
   */
  async replay(): Promise<void> {
    if (!this.currentText || !this.currentConfig) {
      log.warn("No content to replay", "PlayerController");
      return;
    }

    await this.play(this.currentText, this.currentConfig);
  }

  /**
   * 跳转到指定时间
   * 
   * 跳转到指定位置进行播放
   */
  seek(time: number): void {
    if (!this.currentText || !this.currentConfig) {
      log.warn("Cannot seek: no content loaded", "PlayerController");
      return;
    }

    // 限制时间范围
    const clampedTime = Math.max(0, Math.min(time, this.playbackState.totalDuration));

    // 记录之前的状态
    const wasPlaying = this.playbackState.status === "playing";

    // 停止当前播放
    this.audioGenerator.stop();

    // 从指定时间开始调度
    this.audioGenerator.scheduleFrom(clampedTime);

    // 更新状态
    this.playbackState.currentTime = clampedTime;

    if (wasPlaying) {
      // 如果之前是播放状态，继续播放
      this.playbackState.status = "playing";
      this.startProgressTracking();
    } else {
      // 否则保持暂停状态
      this.audioGenerator.suspend();
      this.playbackState.status = "paused";
      this.playbackState.pausedAt = clampedTime;
      this.stopProgressTracking();
    }

    // 触发状态回调
    this.emitStateChange();

    log.info("Seek to time", "PlayerController", { time: clampedTime.toFixed(2) });
  }

  // ==================== 状态获取 ====================

  /**
   * 获取当前播放状态
   */
  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }

  /**
   * 获取当前播放时间
   */
  getCurrentTime(): number {
    return this.playbackState.currentTime;
  }

  /**
   * 获取总播放时长
   */
  getTotalDuration(): number {
    return this.playbackState.totalDuration;
  }

  // ==================== 参数设置 ====================

  /**
   * 设置音调频率
   * 
   * @param frequency - 频率（Hz）
   */
  setFrequency(frequency: number): void {
    this.audioGenerator.setFrequency(frequency);
  }

  /**
   * 设置音量
   * 
   * @param volume - 音量（0-1）
   */
  setVolume(volume: number): void {
    this.audioGenerator.setVolume(volume);
  }

  // ==================== 回调管理 ====================

  /**
   * 设置状态变化回调
   * 
   * @param callback - 回调函数
   */
  onStateChange(callback: (state: PlaybackState) => void): void {
    this.stateChangeCallbacks = callback;
  }

  /**
   * 触发状态变化回调
   */
  private emitStateChange(): void {
    if (this.stateChangeCallbacks) {
      this.stateChangeCallbacks(this.getPlaybackState());
    }
  }

  // ==================== 进度追踪 ====================

  /**
   * 启动进度追踪
   */
  private startProgressTracking(): void {
    // 清除之前的定时器
    this.stopProgressTracking();

    // 启动新的定时器
    this.progressInterval = setInterval(() => {
      this.updateProgress();
    }, this.PROGRESS_UPDATE_INTERVAL);
  }

  /**
   * 停止进度追踪
   */
  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * 更新播放进度
   */
  private updateProgress(): void {
    if (this.playbackState.status !== "playing") return;

    // 获取当前播放时间
    const currentTime = this.audioGenerator.getCurrentTime();
    this.playbackState.currentTime = currentTime;

    // 检查是否播放结束
    if (currentTime >= this.playbackState.totalDuration) {
      this.handlePlaybackComplete();
      return;
    }

    // 触发状态回调
    this.emitStateChange();
  }

  /**
   * 处理播放完成
   */
  private handlePlaybackComplete(): void {
    this.stop();
    log.info("Playback completed", "PlayerController");
  }

  // ==================== 波形数据 ====================

  /**
   * 获取AnalyserNode
   * 
   * 用于波形可视化
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.audioGenerator.getAnalyserNode();
  }

  /**
   * 获取时域波形数据
   */
  getTimeDomainData(): Uint8Array {
    return this.audioGenerator.getTimeDomainData();
  }

  // ==================== 资源清理 ====================

  /**
   * 销毁控制器
   * 
   * 释放所有资源
   */
  dispose(): void {
    // 停止播放
    this.stop();

    // 销毁音频生成器
    this.audioGenerator.dispose();

    // 清除回调
    this.stateChangeCallbacks = undefined;

    log.info("PlayerController disposed", "PlayerController");
  }
}