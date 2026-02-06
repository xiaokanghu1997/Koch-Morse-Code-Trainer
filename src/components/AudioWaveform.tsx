import { makeStyles, tokens } from "@fluentui/react-components";
import React, { useState, useEffect, useMemo, useRef } from "react";
import type { PlaybackState } from "../lib/types";

interface AudioWaveformProps {
  /** 波形数据：[[时间, 值], ...] */
  waveformData: [number, number][];
  
  /** 播放状态 */
  playbackState: PlaybackState;
  
  /** 图表高度（px） */
  height?: number;
  
  /** 视窗时间长度（秒） */
  windowDuration?: number;
  
  /** 播放位置比例（0-1，0.8 表示靠右 80%） */
  playheadPosition?: number;
}

const useStyles = makeStyles({
  container: {
    width: "100%",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    boxShadow: tokens.shadow2,
    overflow: "hidden",
  },
  svg: {
    display: "block",
    width: "100%",
  },
});

export const AudioWaveform = React.memo(({
  waveformData,
  playbackState,
  height = 60,
  windowDuration = 5,
  playheadPosition = 1,
}: AudioWaveformProps) => {
  const styles = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动状态
  const [autoScroll, setAutoScroll] = useState(true);

  // 拖动状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);

  // 窗口波形宽度
  const [localWindowDuration, setLocalWindowDuration] = useState(windowDuration);

  // SVG viewBox 宽度（固定值，方便计算）
  const viewBoxWidth = 1000;
  const viewBoxHeight = 100;
  const strokePadding = 2; // 防止边界线被裁剪

  // 计算视窗时间范围
  const viewportRange = useMemo(() => {
    const currentTime = playbackState.currentTime;
    const totalDuration = playbackState.totalDuration;
    
    let viewStart: number;
    let viewEnd: number;
    
    if (autoScroll && playbackState.status === "playing") {
      // 自动滚动：当前时间在 100% 位置
      viewStart = currentTime - localWindowDuration * playheadPosition;
      viewEnd = currentTime + localWindowDuration * (1 - playheadPosition);

      // 限制范围
      const minStart = -localWindowDuration * playheadPosition;
      const maxEnd = totalDuration + localWindowDuration * (1 - playheadPosition);

      viewStart = Math.max(minStart, viewStart);
      viewEnd = Math.min(maxEnd, viewEnd);

      // 确保窗口宽度固定
      if (viewEnd - viewStart < localWindowDuration) {
        if (viewStart === minStart) {
          viewEnd = viewStart + localWindowDuration;
        } else {
          viewStart = viewEnd - localWindowDuration;
        }
      }
    } else {
      // 暂停/停止状态：完全基于 dragOffset，允许自由拖动
      // 以当前时间为锚点，应用偏移
      const anchorTime = currentTime - localWindowDuration * playheadPosition;
      viewStart = anchorTime + dragOffset;
      viewEnd = viewStart + localWindowDuration;

      // 允许查看整个音频范围
      const minStart = -localWindowDuration;
      const maxStart = totalDuration;

      viewStart = Math.max(minStart, Math.min(maxStart, viewStart));
      viewEnd = viewStart + localWindowDuration;
    }
    
    return { start: viewStart, end: viewEnd };
  }, [
    playbackState.currentTime,
    playbackState.totalDuration,
    playbackState.status,
    autoScroll,
    dragOffset,
    localWindowDuration,
    playheadPosition,
  ]);

  // 过滤并转换数据为 SVG 坐标
  const pathData = useMemo(() => {
    const currentTime = playbackState.currentTime;
    const { start: viewStart, end: viewEnd } = viewportRange;

    // 过滤数据：保留视窗内 + 边界外各一个点
    const visibleData = (() => {
      // 找到视窗范围内的索引
      let startIndex = -1;
      let endIndex = -1;
      
      for (let i = 0; i < waveformData.length; i++) {
        const time = waveformData[i][0];
        
        if (time >= currentTime) {
          endIndex = i - 1;
          break;
        }
        
        if (startIndex === -1 && time >= viewStart) {
          startIndex = i;
        }
        
        if (time > viewEnd && endIndex === -1) {
          endIndex = i;
          break;
        }
      }
      
      if (startIndex === -1) return [];
      if (endIndex === -1) endIndex = waveformData.length - 1;
      
      // 扩展左右边界（各包含一个边界外的点）
      const expandedStart = Math.max(0, startIndex - 1);
      const expandedEnd = Math.min(waveformData.length - 1, endIndex + 1);
      
      return waveformData.slice(expandedStart, expandedEnd + 1);
    })();
    
    if (visibleData.length === 0) {
      return "";
    }
    
    // 时间到 X 坐标的转换函数
    const timeToX = (time: number) => {
      return ((time - viewStart) / localWindowDuration) * viewBoxWidth;
    };
    
    // 值到 Y 坐标的转换函数（0=高，1=低，反转 Y 轴）
    const valueToY = (value: number) => {
      return value === 1 ? viewBoxHeight * 0.2 : viewBoxHeight * 0.8;
    };
    
    // 生成阶梯式路径
    const points: string[] = [];
    let prevX = timeToX(visibleData[0][0]);
    let prevY = valueToY(visibleData[0][1]);
    
    // 起始点
    points.push(`M ${prevX} ${prevY}`);
    
    // 遍历所有点，生成阶梯
    for (let i = 1; i < visibleData.length; i++) {
      const [time, value] = visibleData[i];
      const x = timeToX(time);
      const y = valueToY(value);
      
      // 阶梯效果：先水平，再垂直
      points.push(`L ${x} ${prevY}`);  // 水平线
      points.push(`L ${x} ${y}`);      // 垂直线
      
      prevX = x;
      prevY = y;
    }
    
    return points.join(" ");
  }, [
    waveformData, 
    playbackState.currentTime, 
    viewportRange, 
    localWindowDuration, 
    viewBoxWidth, 
    viewBoxHeight
  ]);

  // 鼠标拖动处理
  const handleMouseDown = (e: React.MouseEvent) => {
    // 播放时禁止拖动
    if (playbackState.status === "playing" && autoScroll) return;
    
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartOffset(dragOffset);
    setAutoScroll(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const deltaX = e.clientX - dragStartX;
    
    // 像素偏移转换为时间偏移（注意方向相反）
    const timeOffset = -(deltaX / containerWidth) * localWindowDuration;
    
    setDragOffset(dragStartOffset + timeOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 滚轮缩放处理
  const handleWheel = (e: React.WheelEvent) => {
    // 播放时禁止缩放
    if (playbackState.status === "playing") return;

    e.preventDefault();  // 阻止页面滚动

    if (!containerRef.current) return;
    
    const delta = e.deltaY;  // 滚轮滚动量（正数=向下，负数=向上）
    
    // 缩放因子：每次滚动改变 5%
    const zoomSpeed = 0.1;

    // 获取鼠标在容器中的相对位置
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const containerWidth = containerRect.width;
    const mouseRatio = mouseX / containerWidth;  // 0-1，表示鼠标在容器中的位置

    // 计算缩放前鼠标位置对应的时间
    const currentViewStart = viewportRange.start;
    const mouseTime = currentViewStart + mouseRatio * localWindowDuration;
    
    setLocalWindowDuration((prevDuration) => {
      const factor = delta > 0 ? (1 + zoomSpeed) : (1 - zoomSpeed);
      const newDuration = prevDuration * factor;
      const clampedDuration = Math.max(0.5, Math.min(60, newDuration));
      // 计算缩放后鼠标位置对应的时间，并调整 viewStart 以保持鼠标位置不变
      const newViewStart = mouseTime - mouseRatio * clampedDuration;
      // 计算需要的 dragOffset 来保持 viewStart 不变
      const currentTime = playbackState.currentTime;
      const anchorTime = currentTime - clampedDuration * playheadPosition;
      const newDragOffset = newViewStart - anchorTime;
      setDragOffset(newDragOffset);
      
      return clampedDuration;
    });
  };

  // 当从暂停/停止变为播放时，立即恢复自动滚动
  useEffect(() => {
  if (playbackState.status === "playing") {
      setAutoScroll(true);
      setDragOffset(0);
      setLocalWindowDuration(windowDuration); 
  }
  }, [playbackState.status, windowDuration]);

  // 停止或重播时，重置状态
  useEffect(() => {
    if (playbackState.status === "idle") {
      setAutoScroll(true);
      setDragOffset(0);
      setIsDragging(false);
      setLocalWindowDuration(windowDuration);
    }
  }, [playbackState.status, windowDuration]);

  // 当 windowDuration 变化时更新本地状态
  useEffect(() => {
    setLocalWindowDuration(windowDuration);
  }, [windowDuration]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      <svg
        className={styles.svg}
        height={height}
        viewBox={`-${strokePadding} -${strokePadding} ${viewBoxWidth + strokePadding * 2} ${viewBoxHeight + strokePadding * 2}`}
        preserveAspectRatio="none"
      >
        {/* 网格线 */}
        <g opacity="0.8">
          {/* 垂直线（主次网格） */}
          {Array.from({ length: 39 }, (_, i) => {
            const index = i + 1;
            const x = (viewBoxWidth / 40) * index;
            const isMajor = index % 4 === 0;
            
            return (
              <line
                key={`grid-v-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={viewBoxHeight}
                stroke={tokens.colorNeutralStroke1}
                strokeWidth={isMajor ? "1" : "0.5"}
                opacity={isMajor ? "1" : "0.5"}
              />
            );
          })}
          
          {/* 水平线 */}
          {[0.2, 0.5, 0.8].map((ratio) => (
            <line
              key={`grid-h-${ratio}`}
              x1={0}
              y1={viewBoxHeight * ratio}
              x2={viewBoxWidth}
              y2={viewBoxHeight * ratio}
              stroke={tokens.colorNeutralStroke1}
              strokeWidth={ratio === 0.5 ? "1" : "0.5"}
            />
          ))}
        </g>
        {/* 方波阶梯线 */}
        <path
          d={pathData}
          fill="none"
          stroke={tokens.colorBrandForeground1}
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
});

AudioWaveform.displayName = "AudioWaveform";