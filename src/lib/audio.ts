import { TIMING_CONSTANTS } from "./constants";
import { MorseEncoder } from "./encoder";
import { TimingCalculator } from "./timing";
import type { AudioConfig, AudioEvent } from "./types";
import { log } from "../utils/logger";

/**
 * 音频生成器类
 */
export class AudioGenerator {
  // ==================== AudioNode实例 ====================
  
  /** Web Audio上下文 */
  private audioContext: AudioContext | null = null;
  
  /** 正弦波振荡器（生成音调） */
  private oscillator: OscillatorNode | null = null;
  
  /** 音量控制节点（控制点划） */
  private gainNode: GainNode | null = null;
  
  /** 主音量控制节点（控制整体音量） */
  private mainGainNode: GainNode | null = null;

  /** 分析节点（用于波形可视化） */
  private analyserNode: AnalyserNode | null = null;
  
  // ==================== 状态管理 ====================
  
  /** 是否已初始化 */
  private initialized: boolean = false;
  
  /** 播放开始时间（AudioContext时间） */
  private playStartTime: number = 0;

  /** 保存事件序列（用于跳转） */
  private currentEvents: AudioEvent[] = [];

  // ==================== 初始化方法 ====================

  /**
   * 初始化Web Audio API
   * 
   * 创建并连接所有AudioNode: 
   * Oscillator → GainNode → MainGainNode → AnalyserNode → Destination
   */
  initialize(): void {
    if (this.initialized) return;

    try {
      // 创建 AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 创建振荡器（音调源）
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = "sine";  // 正弦波（纯音）
      this.oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
      
      // 创建音量控制节点（点划控制）
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      
      // 创建主音量控制节点（用户音量）
      this.mainGainNode = this.audioContext.createGain();
      this.mainGainNode.gain.setValueAtTime(0.8, this.audioContext.currentTime);
      
      // 创建分析节点（可选，用于波形可视化）
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;  // FFT大小
      
      // 连接节点
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.mainGainNode);
      this.mainGainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
      
      // 启动振荡器
      this.oscillator.start();
      
      this.initialized = true;
      log.info("AudioGenerator initialized successfully", "AudioGenerator");
      
    } catch (error) {
      log.error("Failed to initialize AudioGenerator:", "AudioGenerator", error);
      return;
    }
  }

  // ==================== 事件方法 ====================

  /**
   * 生成完整的音频事件序列（使用平滑的音量过渡避免杂音）
   * 
   * 流程:
   * 1.解析文本为摩尔斯码
   * 2.计算每个事件的精确时间点
   * 3.生成音量变化事件
   * 4.添加字符回调信息
   * 
   * @param text - 要播放的文本
   * @param config - 音频配置
   * @returns 事件数组
   */
  generateEvents(text: string, config: AudioConfig): AudioEvent[] {
    // 创建时序计算器
    const timingCalc = new TimingCalculator(config);
    const timing = timingCalc.getTiming();
    
    // 初始化事件数组和时间计数器
    const events: AudioEvent[] = [];
    let currentTime = 0;
    let charIndex = 0;

    const fadeDuration = TIMING_CONSTANTS.FADE_DURATION;
    
    // 遍历文本的每个字符
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // 处理空格（每组间隔）
      if (char === " ") {
        currentTime += timing.wordSpace;
        continue;
      }
      
      // 获取摩尔斯码
      const morse = MorseEncoder.encode(char);
      if (!morse) continue;  // 跳过不支持的字符
      
      // 添加字符开始事件（用于回调）
      events.push({
        time: currentTime,
        type: "gain",
        value: 0,  // 静音（实际值稍后设置）
        char: char,
        charIndex: charIndex,
      });
      
      // 遍历摩尔斯码的每个元素
      const elements = morse.split("");
      for (let j = 0; j < elements.length; j++) {
        const element = elements[j];
        
        // 计算元素时长
        let elementDuration = 0;
        if (element === ".") {
          elementDuration = timing.ditTime;
        } else if (element === "-") {
          elementDuration = timing.dahTime;
        } else {
          continue;  // 未知元素
        }
        
        // 淡入（防止爆音）
        events.push({
          time: currentTime,
          type: "gain",
          value: 0,
        });

        events.push({
          time: currentTime + fadeDuration,
          type: "gain",
          value: 1,
        });
        
        // 保持音量
        const fadeOutStart = currentTime + elementDuration - fadeDuration;
        if (elementDuration > 2 * fadeDuration) {
          events.push({
            time: fadeOutStart,
            type: "gain",
            value: 1,
          });
        }
        
        // 淡出
        events.push({
          time: currentTime + elementDuration,
          type: "gain",
          value: 0,
        });
        
        currentTime += elementDuration;
        
        // 元素间隔（最后一个元素后不加）
        if (j < elements.length - 1) {
          currentTime += timing.elementSpace;
        }
      }
      
      // 字符间隔（下一个字符不是空格时才加）
      const nextChar = text[i + 1];
      if (nextChar && nextChar !== " ") {
        currentTime += timing.charSpace;
      }
      
      charIndex++;
    }
    
    // 添加结束事件（确保静音）
    events.push({
      time: currentTime,
      type: "gain",
      value: 0,
    });
    
    return events;
  }

  /**
   * 保存事件序列（不调度播放）
   * 
   * 用于预加载，支持未播放时的 seek 操作
   */
  saveEvents(events: AudioEvent[]): void {
    this.currentEvents = events;
  }

  /**
   * 获取当前保存的事件序列
   */
  getCurrentEvents(): AudioEvent[] {
    return this.currentEvents;
  }

  // ==================== 调度方法 ====================

  /**
   * 调度事件序列（从头开始播放）
   * 
   * 使用setValueAtTime()预先调度所有事件
   * 保证精确的时序
   * 
   * @param events - 事件数组
   * @returns 总时长（秒）
   */
  schedule(events: AudioEvent[]): number {
    if (!this.initialized || !this.audioContext || !this.gainNode) {
      log.error("AudioGenerator not initialized", "AudioGenerator");
      return 0;
    }
    // 保存事件序列
    this.currentEvents = events;

    // 取消之前的调度
    this.stop();
    
    // 记录播放开始时间
    this.playStartTime = this.audioContext.currentTime;

    // 设置初始值
    this.gainNode.gain.setValueAtTime(0, this.playStartTime);
    
    // 调度所有事件
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const scheduleTime = this.playStartTime + event.time;
      
      if (event.type === "gain") {
        // 使用linearRampToValueAtTime实现平滑过渡
        if (i === 0) {
          this.gainNode.gain.setValueAtTime(event.value, scheduleTime);
        } else {
          this.gainNode.gain.linearRampToValueAtTime(event.value, scheduleTime);
        }
      } else if (event.type === "frequency") {
        // 频率变化事件（如果需要动态改变音调）
        if (this.oscillator) {
          this.oscillator.frequency.setValueAtTime(event.value, scheduleTime);
        }
      }
    }
    
    // 返回总时长
    const lastEvent = events[events.length - 1];
    return lastEvent ? lastEvent.time : 0;
  }

  /**
   * 从指定时间开始播放（用于进度跳转）
   */
  scheduleFrom(startTime: number): number {
    if (!this.currentEvents || this.currentEvents.length === 0) {
      log.error("No events to schedule", "AudioGenerator");
      return 0;
    }

    if (!this.initialized || !this.audioContext || !this.gainNode) {
      log.error("AudioGenerator not initialized", "AudioGenerator");
      return 0;
    }

    // 停止当前播放
    this.stop();

    // 过滤出 startTime 之后的事件
    const futureEvents = this.currentEvents.filter(e => e.time >= startTime);

    if (futureEvents.length === 0) {
      return 0;
    }

    // 调整时间偏移
    const adjustedEvents = futureEvents.map(e => ({
      ...e,
      time: e.time - startTime,
    }));

    // 记录播放开始时间
    this.playStartTime = this.audioContext.currentTime - startTime;

    // 设置初始静音
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

    // 调度调整后的事件
    for (let i = 0; i < adjustedEvents.length; i++) {
      const event = adjustedEvents[i];
      const scheduleTime = this.audioContext.currentTime + event.time;

      if (event.type === "gain") {
        if (i === 0) {
          this.gainNode.gain.setValueAtTime(event.value, scheduleTime);
        } else {
          this.gainNode.gain.linearRampToValueAtTime(event.value, scheduleTime);
        }
      }
    }

    // 返回剩余时长
    const lastEvent = adjustedEvents[adjustedEvents.length - 1];
    return lastEvent ? lastEvent.time : 0;
  }

  // ==================== 播放控制方法 ====================

  /**
   * 暂停播放
   * 
   * 暂停AudioContext（所有音频停止）
   */
  suspend(): void {
    if (this.audioContext && this.audioContext.state === "running") {
      this.audioContext.suspend();
    }
  }

  /**
   * 恢复播放
   * 
   * 恢复AudioContext
   */
  resume(): void {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  /**
   * 停止播放
   * 
   * 取消所有调度的事件
   */
  stop(): void {
    if (!this.gainNode || !this.audioContext) return;

    try {
      // 取消所有未来的值变化
      this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
      
      // 立即设置为静音
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    } catch (error) {
      log.warn("Failed to cancel scheduled values:", "AudioGenerator", error);
    }
  }

  /**
   * 获取当前播放时间
   * 
   * @returns 当前时间（相对于播放开始，秒）
   */
  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    return this.audioContext.currentTime - this.playStartTime;
  }

  // ==================== 参数设置方法 ====================

  /**
   * 设置音调频率
   * 
   * @param frequency - 频率（Hz）
   */
  setFrequency(frequency: number): void {
    if (! this.oscillator || !this.audioContext) return;
    
    this.oscillator.frequency.setValueAtTime(
      frequency,
      this.audioContext.currentTime
    );
  }

  /**
   * 设置主音量
   * 
   * @param volume - 音量（0-1）
   */
  setVolume(volume: number): void {
    if (!this.mainGainNode || !this.audioContext) return;
    
    this.mainGainNode.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      this.audioContext.currentTime
    );
  }

  // ==================== 波形数据方法 ====================

  /**
   * 获取时域波形数据
   * 
   * 用于波形可视化
   * 
   * @returns Uint8Array数据（0-255）
   */
  getTimeDomainData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(0);
    }

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteTimeDomainData(dataArray);
    
    return dataArray;
  }

  /**
   * 获取频域数据
   * 
   * 用于频谱可视化
   * 
   * @returns Uint8Array数据（0-255）
   */
  getFrequencyData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(0);
    }

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);
    
    return dataArray;
  }

  /**
   * 获取AnalyserNode（供外部使用）
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  // ==================== 资源管理 ====================

  /**
   * 释放所有资源
   * 
   * 调用时机: 组件卸载或不再需要时
   */
  dispose(): void {
    if (!this.initialized) return;

    try {
      // 停止振荡器
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }

      // 断开所有节点
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }

      if (this.mainGainNode) {
        this.mainGainNode.disconnect();
        this.mainGainNode = null;
      }

      if (this.analyserNode) {
        this.analyserNode.disconnect();
        this.analyserNode = null;
      }

      // 关闭AudioContext
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }

      this.initialized = false;
      log.info("AudioGenerator disposed", "AudioGenerator");
    } catch (error) {
      log.error("Error disposing AudioGenerator:", "AudioGenerator", error);
    }
  }
}