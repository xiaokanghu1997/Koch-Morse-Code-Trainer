import { useRef, useEffect, useCallback, useState } from 'react';
import { log } from '../utils/logger';

/**
 * 波形配置接口
 */
interface WaveformConfig {
  /** 线条颜色 */
  lineColor?: string;
  /** 线条宽度 */
  lineWidth?: number;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 是否填充 */
  fill?: boolean;
  /** 填充颜色 */
  fillColor?: string;
}

/**
 * useWaveform Hook返回值类型
 */
interface UseWaveformReturn {
  /** Canvas引用 */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** 是否正在绘制 */
  isActive: boolean;
  /** 开始绘制 */
  start: () => void;
  /** 停止绘制 */
  stop: () => void;
  /** 更新配置 */
  updateConfig: (config: WaveformConfig) => void;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: WaveformConfig = {
  lineColor: '#0078d4',
  lineWidth: 2,
  backgroundColor: '#f5f5f5',
  fill: false,
  fillColor: 'rgba(0, 120, 212, 0.1)',
};

/**
 * 波形可视化Hook
 * 
 * @param analyserNode - Web Audio API的AnalyserNode
 * @param initialConfig - 初始配置
 */
export const useWaveform = (
  analyserNode: AnalyserNode | null,
  initialConfig?: WaveformConfig
): UseWaveformReturn => {
  // ==================== 状态管理 ====================
  
  /** 是否正在绘制 */
  const [isActive, setIsActive] = useState(false);
  
  /** 配置 */
  const [config, setConfig] = useState<WaveformConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  
  // ==================== Refs ====================
  
  /** Canvas引用 */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  /** 动画帧ID */
  const animationFrameRef = useRef<number | null>(null);
  
  /** 数据缓冲区 */
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // ==================== 初始化 ====================
  
  useEffect(() => {
    if (!analyserNode) return;

    // 创建数据缓冲区
    const bufferLength = analyserNode.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    log.info('Waveform initialized', 'Waveform', { bufferLength });

    // 清理
    return () => {
      stop();
    };
  }, [analyserNode]);

  // ==================== 绘制方法 ====================
  
  /**
   * 绘制波形
   */
  const draw = useCallback(() => {
    if (!canvasRef.current || !analyserNode || !dataArrayRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dataArray = dataArrayRef.current;
    const bufferLength = dataArrayRef.current.length;

    // 获取时域数据
    analyserNode.getByteTimeDomainData(dataArray as Uint8Array<ArrayBuffer>);

    // 清空画布
    ctx.fillStyle = config.backgroundColor || DEFAULT_CONFIG.backgroundColor! ;
    ctx.fillRect(0, 0, width, height);

    // 开始绘制路径
    ctx.lineWidth = config.lineWidth || DEFAULT_CONFIG.lineWidth!;
    ctx.strokeStyle = config.lineColor || DEFAULT_CONFIG.lineColor!;
    ctx.beginPath();

    // 计算每个数据点的x坐标间距
    const sliceWidth = width / bufferLength;
    let x = 0;

    // 绘制波形
    for (let i = 0; i < bufferLength; i++) {
      // 将数据值(0-255)转换为y坐标(0-height)
      const v = dataArrayRef.current[i] / 128.0;  // 归一化到0-2
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    // 绘制到画布右边缘
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // 如果需要填充
    if (config.fill) {
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = config.fillColor || DEFAULT_CONFIG.fillColor!;
      ctx.fill();
    }

    // 继续下一帧
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(draw);
    }
  }, [analyserNode, isActive, config]);

  // ==================== 控制方法 ====================
  
  /**
   * 开始绘制
   */
  const start = useCallback(() => {
    if (!analyserNode) {
      log.warn('Cannot start waveform: no analyser node', 'Waveform');
      return;
    }

    if (isActive) return;

    setIsActive(true);
    log.info('Waveform started', 'Waveform');
  }, [analyserNode, isActive]);

  /**
   * 停止绘制
   */
  const stop = useCallback(() => {
    if (!isActive) return;

    setIsActive(false);

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    log.info('Waveform stopped', 'Waveform');
  }, [isActive]);

  /**
   * 更新配置
   */
  const updateConfig = useCallback((newConfig: WaveformConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // ==================== 自动绘制 ====================
  
  useEffect(() => {
    if (isActive) {
      draw();
    }
  }, [isActive, draw]);

  // ==================== Canvas尺寸自适应 ====================
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置Canvas实际像素尺寸（考虑DPI）
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // 缩放上下文以匹配DPI
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    updateCanvasSize();

    // 监听窗口大小变化
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // ==================== 返回值 ====================
  
  return {
    canvasRef,
    isActive,
    start,
    stop,
    updateConfig,
  };
};