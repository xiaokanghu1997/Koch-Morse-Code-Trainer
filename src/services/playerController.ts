import { AudioGenerator } from '../lib';
import { TextGenerator } from './textGenerator';
import type { AudioConfig, PlaybackState, AudioEvent } from '../lib/types';

/**
 * 字符播放回调函数类型
 */
type CharacterPlayCallback = (char: string, index: number, timestamp: number) => void;

/**
 * 播放完成回调函数类型
 */
type PlaybackFinishedCallback = (duration: number, charCount: number) => void;

/**
 * 播放控制器类
 */
export class PlayerController {
  // ==================== 核心组件 ====================
  
  /** 音频生成器实例 */
  private audioGenerator: AudioGenerator;
  
  /** 当前播放状态 */
  private currentState: PlaybackState;
  
  /** 当前音频配置 */
  private currentConfig: AudioConfig | null = null;
  
  /** 当前播放的事件序列 */
  private currentEvents: AudioEvent[] = [];
  
  // ==================== 回调管理 ====================
  
  /** 字符播放回调列表 */
  private characterCallbacks: CharacterPlayCallback[] = [];
  
  /** 播放完成回调列表 */
  private finishedCallbacks: PlaybackFinishedCallback[] = [];
  
  /** 状态变化回调列表 */
  private stateChangeCallbacks: Array<(state: PlaybackState) => void> = [];
  
  // ==================== 定时器管理 ====================
  
  /** 字符回调定时器ID列表 */
  private scheduledTimers: number[] = [];
  
  /** 进度更新定时器ID */
  private progressTimer: number | null = null;
  
  /** 播放完成定时器ID */
  private finishTimer: number | null = null;

  /**
   * 构造函数
   */
  constructor() {
    // 创建音频生成器
    this.audioGenerator = new AudioGenerator();
    
    // 初始化状态
    this.currentState = {
      status: 'idle',
      currentTime: 0,
      totalDuration: 0,
      pausedAt: 0,
      currentCharIndex: 0,
      currentChar: null,
      text: '',
    };
  }

  // ==================== 初始化方法 ====================

  /**
   * 初始化音频系统
   * 
   * 必须在播放前调用（通常在组件挂载时）
   */
  initialize(): void {
    if (!this.audioGenerator.isInitialized()) {
      this.audioGenerator.initialize();
      console.log('PlayerController initialized');
    }
  }

  // ==================== 播放控制方法 ====================

  /**
   * 播放文本
   * 
   * 完整流程:
   * 1.停止当前播放
   * 2.更新状态为loading
   * 3.生成音频事件
   * 4.调度音频和回调
   * 5.开始播放
   * 
   * @param text - 要播放的文本
   * @param config - 音频配置
   * @returns Promise（播放开始后resolve）
   */
  async play(text: string, config: AudioConfig): Promise<void> {
    // 1.确保已初始化
    this.initialize();

    // 2.停止当前播放
    this.stop();

    // 3.更新状态为loading
    this.updateState({
      status: 'loading',
      text,
      currentTime: 0,
      totalDuration: 0,
      currentCharIndex: 0,
      currentChar: null,
    });

    // 4.保存配置
    this.currentConfig = config;

    // 5.应用音频参数
    this.audioGenerator.setFrequency(config.tone);
    this.audioGenerator.setVolume(config.volume);

    // 6.生成事件序列
    this.currentEvents = this.audioGenerator.generateEvents(text, config);

    // 7.调度音频
    const totalDuration = this.audioGenerator.schedule(this.currentEvents);

    // 8.调度字符回调
    this.scheduleCharacterCallbacks(this.currentEvents);

    // 9.调度播放完成
    this.schedulePlaybackFinished(totalDuration, text);

    // 10.更新状态为playing
    this.updateState({
      status: 'playing',
      totalDuration,
    });

    // 11.启动进度追踪
    this.startProgressTracking();

    console.log(`Playing: "${text}" (${totalDuration.toFixed(1)}s)`);
  }

  /**
   * 播放单个字符
   * 
   * @param char - 字符
   * @param config - 音频配置
   * @param repeat - 重复次数
   */
  async playCharacter(
    char: string,
    config: AudioConfig,
    repeat: number = 1
  ): Promise<void> {
    // 生成重复文本（字符间用空格分隔）
    const textGen = new TextGenerator();
    const text = textGen.generateSingleCharacter(char, repeat);

    // 播放
    await this.play(text, config);
  }

  /**
   * 暂停播放
   * 
   * 记录暂停时间点，暂停AudioContext
   */
  pause(): void {
    if (this.currentState.status !== 'playing') {
      console.warn('Cannot pause: not playing');
      return;
    }

    // 1.记录暂停时间
    const pausedAt = this.audioGenerator.getCurrentTime();

    // 2.暂停AudioContext
    this.audioGenerator.suspend();

    // 3.清除所有定时器
    this.clearTimers();

    // 4.更新状态
    this.updateState({
      status: 'paused',
      pausedAt,
    });

    console.log(`Paused at ${pausedAt.toFixed(1)}s`);
  }

  /**
   * 恢复播放
   * 
   * 从暂停点继续播放
   */
  resume(): void {
    if (this.currentState.status !== 'paused') {
      console.warn('Cannot resume: not paused');
      return;
    }

    // 1.恢复AudioContext
    this.audioGenerator.resume();

    // 2.重新调度剩余的字符回调
    this.rescheduleCallbacks();

    // 3.重新调度播放完成
    const remaining = this.currentState.totalDuration - this.currentState.pausedAt;
    this.schedulePlaybackFinished(remaining, this.currentState.text);

    // 4.更新状态
    this.updateState({
      status: 'playing',
    });

    // 5.重启进度追踪
    this.startProgressTracking();

    console.log(`Resumed from ${this.currentState.pausedAt.toFixed(1)}s`);
  }

  /**
   * 停止播放
   * 
   * 完全停止并重置状态
   */
  stop(): void {
    // 1.停止音频
    this.audioGenerator.stop();

    // 2.清除所有定时器
    this.clearAllTimers();

    // 3.重置状态
    this.updateState({
      status: 'idle',
      currentTime: 0,
      totalDuration: 0,
      pausedAt: 0,
      currentCharIndex: 0,
      currentChar: null,
      text: '',
    });

    console.log('Stopped');
  }

  /**
   * 重新播放当前文本
   * 
   * 从头开始播放当前文本
   */
  replay(): void {
    const { text } = this.currentState;
    if (! text || ! this.currentConfig) {
      console.warn('Cannot replay: no text to play');
      return;
    }

    this.play(text, this.currentConfig);
  }

  // ==================== 回调调度 ====================

  /**
   * 调度字符播放回调
   * 
   * @param events - 事件序列
   */
  private scheduleCharacterCallbacks(events: AudioEvent[]): void {
    // 清除旧的定时器
    this.clearCharacterTimers();

    // 遍历事件，找出包含字符信息的事件
    for (const event of events) {
      if (event.char !== undefined && event.charIndex !== undefined) {
        // 计算延迟时间（毫秒）
        const delay = event.time * 1000;

        // 创建定时器
        const timerId = window.setTimeout(() => {
          // 触发所有字符回调
          this.characterCallbacks.forEach(callback => {
            callback(event.char!, event.charIndex!, event.time);
          });

          // 更新状态
          this.updateState({
            currentCharIndex: event.charIndex! ,
            currentChar: event.char! ,
          });
        }, delay);

        // 保存定时器ID
        this.scheduledTimers.push(timerId);
      }
    }

    console.log(`Scheduled ${this.scheduledTimers.length} character callbacks`);
  }

  /**
   * 重新调度回调（用于resume）
   * 
   * 只调度尚未触发的回调
   */
  private rescheduleCallbacks(): void {
    const { pausedAt } = this.currentState;

    // 清除旧定时器
    this.clearCharacterTimers();

    // 重新调度剩余的回调
    for (const event of this.currentEvents) {
      if (
        event.char !== undefined &&
        event.charIndex !== undefined &&
        event.time > pausedAt
      ) {
        // 计算相对于当前时间的延迟
        const delay = (event.time - pausedAt) * 1000;

        const timerId = window.setTimeout(() => {
          this.characterCallbacks.forEach(callback => {
            callback(event.char!, event.charIndex!, event.time);
          });

          this.updateState({
            currentCharIndex: event.charIndex!,
            currentChar: event.char!,
          });
        }, delay);

        this.scheduledTimers.push(timerId);
      }
    }
  }

  /**
   * 调度播放完成回调
   * 
   * @param duration - 持续时间（秒）
   * @param text - 文本
   */
  private schedulePlaybackFinished(duration: number, text: string): void {
    // 清除旧定时器
    if (this.finishTimer !== null) {
      window.clearTimeout(this.finishTimer);
    }

    // 创建新定时器
    this.finishTimer = window.setTimeout(() => {
      // 触发完成回调
      const charCount = text.replace(/ /g, '').length;
      this.finishedCallbacks.forEach(callback => {
        callback(duration, charCount);
      });

      // 更新状态
      this.updateState({
        status: 'idle',
      });

      console.log(`Playback finished: ${duration.toFixed(1)}s, ${charCount} chars`);
    }, duration * 1000);
  }

  // ==================== 进度追踪 ====================

  /**
   * 启动进度追踪
   * 
   * 每100ms更新一次当前时间
   */
  private startProgressTracking(): void {
    // 清除旧定时器
    if (this.progressTimer !== null) {
      window.clearInterval(this.progressTimer);
    }

    // 创建新定时器
    this.progressTimer = window.setInterval(() => {
      if (this.currentState.status === 'playing') {
        const currentTime = this.audioGenerator.getCurrentTime();
        this.updateState({ currentTime });
      }
    }, 100);  // 每100ms更新
  }

  // ==================== 定时器清理 ====================

  /**
   * 清除字符回调定时器
   */
  private clearCharacterTimers(): void {
    this.scheduledTimers.forEach(id => window.clearTimeout(id));
    this.scheduledTimers = [];
  }

  /**
   * 清除所有定时器
   */
  private clearAllTimers(): void {
    // 清除字符回调定时器
    this.clearCharacterTimers();

    // 清除进度定时器
    if (this.progressTimer !== null) {
      window.clearInterval(this.progressTimer);
      this.progressTimer = null;
    }

    // 清除完成定时器
    if (this.finishTimer !== null) {
      window.clearTimeout(this.finishTimer);
      this.finishTimer = null;
    }
  }

  /**
   * 清除定时器（用于pause）
   */
  private clearTimers(): void {
    this.clearCharacterTimers();

    if (this.progressTimer !== null) {
      window.clearInterval(this.progressTimer);
      this.progressTimer = null;
    }

    if (this.finishTimer !== null) {
      window.clearTimeout(this.finishTimer);
      this.finishTimer = null;
    }
  }

  // ==================== 状态管理 ====================

  /**
   * 更新状态
   * 
   * @param updates - 部分状态更新
   */
  private updateState(updates: Partial<PlaybackState>): void {
    this.currentState = {
      ...this.currentState,
      ...updates,
    };

    // 触发状态变化回调
    this.stateChangeCallbacks.forEach(callback => {
      callback(this.currentState);
    });
  }

  /**
   * 获取当前状态
   */
  getState(): PlaybackState {
    return { ...this.currentState };
  }

  /**
   * 获取剩余时间
   */
  getRemainingTime(): number {
    return Math.max(0, this.currentState.totalDuration - this.currentState.currentTime);
  }

  // ==================== 回调注册 ====================

  /**
   * 注册字符播放回调
   * 
   * @param callback - 回调函数
   * @returns 取消注册的函数
   */
  onCharacterPlay(callback: CharacterPlayCallback): () => void {
    this.characterCallbacks.push(callback);

    // 返回取消注册函数
    return () => {
      const index = this.characterCallbacks.indexOf(callback);
      if (index > -1) {
        this.characterCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 注册播放完成回调
   * 
   * @param callback - 回调函数
   * @returns 取消注册的函数
   */
  onPlaybackFinished(callback: PlaybackFinishedCallback): () => void {
    this.finishedCallbacks.push(callback);

    return () => {
      const index = this.finishedCallbacks.indexOf(callback);
      if (index > -1) {
        this.finishedCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 注册状态变化回调
   * 
   * @param callback - 回调函数
   * @returns 取消注册的函数
   */
  onStateChange(callback: (state: PlaybackState) => void): () => void {
    this.stateChangeCallbacks.push(callback);

    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  // ==================== 音频参数设置 ====================

  /**
   * 设置音调频率
   * 
   * @param frequency - 频率（Hz）
   */
  setFrequency(frequency: number): void {
    this.audioGenerator.setFrequency(frequency);
    if (this.currentConfig) {
      this.currentConfig.tone = frequency;
    }
  }

  /**
   * 设置音量
   * 
   * @param volume - 音量（0-1）
   */
  setVolume(volume: number): void {
    this.audioGenerator.setVolume(volume);
    if (this.currentConfig) {
      this.currentConfig.volume = volume;
    }
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

    // 清除所有回调
    this.characterCallbacks = [];
    this.finishedCallbacks = [];
    this.stateChangeCallbacks = [];

    // 销毁音频生成器
    this.audioGenerator.dispose();

    console.log('PlayerController disposed');
  }
}