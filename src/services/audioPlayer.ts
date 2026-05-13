import * as Tone from "tone";
import { MorseEncoder } from "../lib/encoder";
import { TimingCalculator } from "../lib/timing";
import { useSettingsStore } from "../stores/settingsStore";
import type { AudioConfig, PlaybackState } from "../lib/types";
import { log } from "../utils/logger";

/**
 * 播放事件接口（内部使用）
 */
interface PlaybackEvent {
  time: number;
  duration: number;
  frequency?: number;
  attack?: number;
  release?: number;
}

/**
 * 音频播放器类
 */
export class AudioPlayer {
  // ==================== Tone.js 组件 ====================
  
  // 独立的 Context（包含独立的 Transport）
  private context: Tone.Context | null = null;
  private synth: Tone.Synth | null = null;
  private part: Tone.Part | null = null;
  private transport: ReturnType<typeof Tone.getTransport> | null = null;
  
  // ==================== 状态 ====================
  
  private initialized: boolean = false;
  private totalDuration: number = 0;
  private waveformData: [number, number][] = [];
  
  private playbackState: PlaybackState = {
    status: "idle",
    currentTime: 0,
    totalDuration: 0,
    pausedAt: 0,
  };
  
  // ==================== 进度追踪 ====================
  
  private progressInterval: number | null = null;
  private readonly PROGRESS_UPDATE_INTERVAL = 16;
  
  // ==================== 回调 ====================
  
  private stateChangeCallback?: (state: PlaybackState) => void;
  
  // ==================== 构造函数 ====================
  
  constructor() {
    // 创建独立的 Context
    this.context = new Tone.Context();
    // 获取这个 Context 的 Transport
    this.transport = this.context.transport;
  }
  
  // ==================== 初始化方法 ====================
  
  initialize(): void {
    if (this.initialized || !this.context) return;
    
    try {
      // 在独立的 Context 中创建 Synth
      this.synth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.005,
          decay: 0,
          sustain: 1,
          release: 0.005,
        },
        context: this.context,  // 绑定到独立 Context
      }).toDestination();
      
      this.initialized = true;
      log.info("AudioPlayer initialized", "AudioPlayer");
      
    } catch (error) {
      log.error("Failed to initialize AudioPlayer", "AudioPlayer", error);
    }
  }
  
  // ==================== 内容加载方法 ====================
  
  preload(text: string, config: AudioConfig, toneMap?: Map<number, number>): void {
    if (!this.initialized || !this.synth) {
      log.error("AudioPlayer not initialized", "AudioPlayer");
      return;
    }
    
    try {
      this.stop();
      
      // 设置默认音调（当事件没有指定音调时使用）
      this.synth.frequency.value = config.tone;
      
      // 传入 toneMap 以支持每个字符不同的音调
      const playbackEvents = this.generatePlaybackEvents(text, config, toneMap);
      this.scheduleEvents(playbackEvents);
      
      this.totalDuration = this.calculateDuration(text, config);
      this.waveformData = this.generateWaveformData(text, config);
      
      this.playbackState.totalDuration = this.totalDuration;
      this.emitStateChange();
      
      log.info("Content preloaded", "AudioPlayer", {
        textLength: text.length,
        duration: this.totalDuration.toFixed(2),
        hasToneMap: !!toneMap,
      });
      
    } catch (error) {
      log.error("Failed to preload content", "AudioPlayer", error);
    }
  }
  
  // ==================== 播放控制方法 ====================
  
  async play(): Promise<void> {
    if (!this.initialized || !this.synth || !this.part || !this.transport || !this.context) {
      log.warn("AudioPlayer not ready", "AudioPlayer");
      return;
    }
    
    try {
      // 先恢复 Context（等待完成）
      if (this.context.state !== "running") {
        await this.context.resume();
        
        // 额外等待一小段时间，确保音频系统完全就绪
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const volume = useSettingsStore.getState().volume;
      this.synth.volume.value = Tone.gainToDb(volume / 100);
      
      this.transport.start();
      
      this.playbackState.status = "playing";
      this.startProgressTracking();
      this.emitStateChange();
      
      log.info("Playback started", "AudioPlayer");
      
    } catch (error) {
      log.error("Failed to start playback", "AudioPlayer", error);
    }
  }
  
  pause(): void {
    if (this.playbackState.status !== "playing" || !this.transport) return;
    
    if (this.synth) {
      this.synth.triggerRelease();
    }
    
    this.transport.pause();
    
    this.playbackState.pausedAt = this.transport.seconds;
    this.playbackState.status = "paused";
    this.playbackState.currentTime = this.playbackState.pausedAt;
    
    this.stopProgressTracking();
    this.emitStateChange();
    
    log.info("Playback paused", "AudioPlayer");
  }
  
  resume(): void {
    if (this.playbackState.status !== "paused" || !this.transport) return;
    
    this.transport.start();
    
    this.playbackState.status = "playing";
    this.startProgressTracking();
    this.emitStateChange();
    
    log.info("Playback resumed", "AudioPlayer");
  }
  
  stop(): void {
    if (!this.transport) return;
    
    if (this.synth) {
      this.synth.triggerRelease();
    }
    
    this.transport.stop();
    
    this.stopProgressTracking();
    
    this.playbackState.status = "idle";
    this.playbackState.currentTime = 0;
    this.playbackState.pausedAt = 0;
    
    this.emitStateChange();
    
    log.info("Playback stopped", "AudioPlayer");
  }
  
  seek(time: number): void {
    if (!this.transport) return;
    
    const clampedTime = Math.max(0, Math.min(time, this.totalDuration));
    
    this.transport.seconds = clampedTime;
    
    this.playbackState.currentTime = clampedTime;
    
    if (this.playbackState.status === "paused") {
      this.playbackState.pausedAt = clampedTime;
    }
    
    this.emitStateChange();
    
    log.info("Seek to time", "AudioPlayer", { time: clampedTime.toFixed(2) });
  }
  
  // ==================== 状态获取方法 ====================
  
  getCurrentTime(): number {
    return this.transport?.seconds || 0;
  }
  
  getTotalDuration(): number {
    return this.totalDuration;
  }
  
  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }
  
  getWaveformData(): [number, number][] {
    return this.waveformData;
  }
  
  // ==================== 回调管理 ====================
  
  onStateChange(callback: (state: PlaybackState) => void): void {
    this.stateChangeCallback = callback;
  }
  
  private emitStateChange(): void {
    if (this.stateChangeCallback) {
      this.stateChangeCallback(this.getPlaybackState());
    }
  }
  
  // ==================== 进度追踪 ====================
  
  private startProgressTracking(): void {
    this.stopProgressTracking();
    
    this.progressInterval = window.setInterval(() => {
      this.updateProgress();
    }, this.PROGRESS_UPDATE_INTERVAL);
  }
  
  private stopProgressTracking(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
  
  private updateProgress(): void {
    if (this.playbackState.status !== "playing" || !this.transport) return;
    
    const currentTime = this.transport.seconds;
    this.playbackState.currentTime = Math.min(currentTime, this.totalDuration);
    
    if (currentTime >= this.totalDuration - 0.02) {
      this.handlePlaybackComplete();
      return;
    }
    
    this.emitStateChange();
  }
  
  private handlePlaybackComplete(): void {
    if (!this.transport) return;
    
    this.stopProgressTracking();
    
    if (this.synth) {
      this.synth.triggerRelease();
    }
    
    this.transport.pause();
    
    this.playbackState.status = "paused";
    this.playbackState.pausedAt = this.totalDuration;
    this.playbackState.currentTime = this.totalDuration;
    
    this.emitStateChange();
    
    log.info("Playback completed", "AudioPlayer");
  }

  // ==================== 包络时间计算 ====================
  private calculateEnvelopeTimes(frequency: number): { attack: number; release: number } {
    // 计算周期时间
    const period = 1 / frequency;
    // 包络时间为周期时间的5倍
    const envelopeTime = period * 5;

    return { attack: envelopeTime, release: envelopeTime };
  }
  
  // ==================== 事件生成方法 ====================
  
  private generatePlaybackEvents(
    text: string, 
    config: AudioConfig,
    toneMap?: Map<number, number>
  ): PlaybackEvent[] {
    const events: PlaybackEvent[] = [];
    const timingCalc = new TimingCalculator(config);
    const timing = timingCalc.getTiming();
    
    const startMargin = 0.1;
    let currentTime = startMargin;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === " ") {
        currentTime += timing.wordSpace;
        continue;
      }
      
      const morse = MorseEncoder.encode(char);
      if (!morse) continue;

      // 获取当前字符的频率（如果 toneMap 存在）
      const frequency = toneMap?.get(i) ?? config.tone;
      // 根据频率计算包络时间
      const envelope = this.calculateEnvelopeTimes(frequency);
      
      const elements = morse.split("");
      for (let j = 0; j < elements.length; j++) {
        const element = elements[j];
        
        let duration = 0;
        if (element === ".") {
          duration = timing.ditTime;
        } else if (element === "-") {
          duration = timing.dahTime;
        } else {
          continue;
        }
        
        events.push({
          time: currentTime,
          duration: duration,
          frequency: frequency,
          attack: envelope.attack,
          release: envelope.release,
        });
        
        currentTime += duration;
        
        if (j < elements.length - 1) {
          currentTime += timing.elementSpace;
        }
      }

      const nextChar = text[i + 1];
      if (nextChar && nextChar !== " ") {
        currentTime += timing.charSpace;
      }
    }
    
    return events;
  }
  
  private scheduleEvents(events: PlaybackEvent[]): void {
    if (this.part) {
      this.part.dispose();
      this.part = null;
    }
    
    if (!this.context || !this.synth) return;
    
    // 在独立 Context 中创建 Part
    this.part = new Tone.Part({
      callback: (time, value) => {
        if (this.synth) {
          // 动态设置包络参数
          if (value.attack !== undefined) {
            this.synth.envelope.attack = value.attack;
          }
          if (value.release !== undefined) {
            this.synth.envelope.release = value.release;
          }
          const frequency = value.frequency || this.synth.frequency.value;
          // 播放音符
          this.synth.triggerAttackRelease(
            frequency,
            value.duration,
            time
          );
        }
      },
      events: events.map(e => ({ 
        time: e.time, 
        duration: e.duration,
        frequency: e.frequency,
        attack: e.attack,
        release: e.release
      })),
      context: this.context,
    });
    
    this.part.loop = false;
    this.part.start(0);
  }
  
  private calculateDuration(text: string, config: AudioConfig): number {
    const timingCalc = new TimingCalculator(config);
    const baseDuration = timingCalc.calculateTextDuration(text);
    const margin = 0.1;
    return baseDuration + margin * 2;
  }
  
  private generateWaveformData(text: string, config: AudioConfig): [number, number][] {
    const keyPoints = this.generateWaveformKeyPoints(text, config);
    return this.interpolateWaveform(keyPoints, 0.016);
  }
  
  private generateWaveformKeyPoints(text: string, config: AudioConfig): [number, number][] {
    const points: [number, number][] = [];
    const timingCalc = new TimingCalculator(config);
    const timing = timingCalc.getTiming();
    
    const startMargin = 0.1;
    let currentTime = startMargin;
    
    points.push([0, 0]);
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === " ") {
        currentTime += timing.wordSpace;
        continue;
      }
      
      const morse = MorseEncoder.encode(char);
      if (!morse) continue;
      
      const elements = morse.split("");
      for (let j = 0; j < elements.length; j++) {
        const element = elements[j];
        
        let duration = 0;
        if (element === ".") {
          duration = timing.ditTime;
        } else if (element === "-") {
          duration = timing.dahTime;
        } else {
          continue;
        }
        
        points.push([currentTime, 1]);
        points.push([currentTime + duration, 0]);
        
        currentTime += duration;
        
        if (j < elements.length - 1) {
          currentTime += timing.elementSpace;
        }
      }

      const nextChar = text[i + 1];
      if (nextChar && nextChar !== " ") {
        currentTime += timing.charSpace;
      }
    }
    
    const endMargin = 0.1;
    points.push([currentTime + endMargin, 0]);
    
    return points;
  }
  
  private interpolateWaveform(
    keyPoints: [number, number][],
    interval: number
  ): [number, number][] {
    if (keyPoints.length === 0) return [];
    
    const result: [number, number][] = [];

    // 添加所有关键点（确保点划边界精确）
    for (const point of keyPoints) {
      result.push([point[0], point[1]]);
    }

    // 在关键点之间插值
    for (let i = 0; i < keyPoints.length - 1; i++) {
      const startTime = keyPoints[i][0];
      const endTime = keyPoints[i + 1][0];
      const value = keyPoints[i][1];
      
      for (let time = startTime + interval; time < endTime; time += interval) {
        result.push([time, value]);
      }
    }

    // 按时间排序
    result.sort((a, b) => a[0] - b[0]);

    // 去重（相同时间点只保留第一个）
    const uniqueResult: [number, number][] = [];
    for (let i = 0; i < result.length; i++) {
      if (i === 0 || Math.abs(result[i][0] - result[i - 1][0]) > 1e-4) {
        uniqueResult.push(result[i]);
      }
    }

    return uniqueResult;
  }
  
  // ==================== 资源管理 ====================
  
  dispose(): void {
    if (!this.initialized) return;
    
    try {
      this.stop();
      
      if (this.part) {
        this.part.dispose();
        this.part = null;
      }
      
      if (this.synth) {
        this.synth.dispose();
        this.synth = null;
      }
      
      // 释放独立的 Context
      if (this.context) {
        this.context.dispose();
        this.context = null;
      }
      
      this.transport = null;
      this.stateChangeCallback = undefined;
      
      this.initialized = false;
      log.info("AudioPlayer disposed", "AudioPlayer");
      
    } catch (error) {
      log.error("Error disposing AudioPlayer", "AudioPlayer", error);
    }
  }
}