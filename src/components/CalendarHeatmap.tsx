import { Text, makeStyles, tokens } from "@fluentui/react-components";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { CalendarHeatmapTexts, CalendarDayItem } from "../lib/types";
import { useSettingsStore } from "../stores/settingsStore";

// 图表输入数据结构
interface CalendarHeatmapProps {
  days: CalendarDayItem[];
  todayCount?: number;
  texts: CalendarHeatmapTexts;
}

// 单天位置信息数据结构
interface PositionedCalendarDayItem extends CalendarDayItem {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 月份轮廓数据结构
interface MonthOutline {
  month: number;
  path: string;
  centerX: number;
}

// 网格点数据结构
interface GridPoint {
  x: number;
  y: number;
}

// 网格边数据结构
interface GridEdge {
  start: GridPoint;
  end: GridPoint;
}

// 热力图级别定义
const HEATMAP_LEVELS = [
  { threshold: (v: number) => v > 0 && v <= 2,  color: tokens.colorPaletteGreenForeground2  },
  { threshold: (v: number) => v > 2 && v <= 5,  color: tokens.colorPaletteGreenForeground1  },
  { threshold: (v: number) => v > 5 && v <= 10, color: tokens.colorPaletteGreenBackground3  },
  { threshold: (v: number) => v > 10 && v <= 20, color: tokens.colorPaletteGreenBackground2 },
  { threshold: (v: number) => v > 20,            color: tokens.colorPaletteGreenBackground1 },
];

/**
 * 获取热力图颜色
 * @param value 热力图值
 * @returns 对应的颜色字符串
 */
const getHeatmapColor = (value: number): string => {
  return HEATMAP_LEVELS.find(l => l.threshold(value))?.color
    ?? tokens.colorNeutralBackground2Selected;
};

/**
 * 生成网格点的唯一键
 * @param point 网格点对象
 * @returns 唯一键字符串
 */
const pointKey = (point: GridPoint) => `${point.x},${point.y}`;

/**
 * 生成无向边的唯一键
 * @param a 网格点 A
 * @param b 网格点 B
 * @returns 唯一键字符串
 */
const undirectedEdgeKey = (a: GridPoint, b: GridPoint) => {
  const keyA = pointKey(a);
  const keyB = pointKey(b);
  return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
};

/**
 * 构建指定月份的轮廓路径
 * @param month 要构建轮廓的月份（0-11）
 * @param monthDays 属于该月份的日历天数据数组
 * @param positionedDayMap 包含所有日历天位置信息的 Map 对象，键为 "weekIndex-weekdayIndex"
 * @param cellSize 日期格子的大小
 * @param gap 日期格子之间的间距
 * @param gridOffsetX 网格在 SVG 中的 X 轴偏移
 * @param gridOffsetY 网格在 SVG 中的 Y 轴偏移
 * @returns 包含月份轮廓信息的对象，如果该月份没有有效的日历天则返回 null
 */
const buildMonthOutline = (
  month: number,
  monthDays: PositionedCalendarDayItem[],
  positionedDayMap: Map<string, PositionedCalendarDayItem>,
  cellSize: number,
  gap: number,
  gridOffsetX: number,
  gridOffsetY: number
): MonthOutline | null => {
  if (monthDays.length === 0) return null;

  // 收集月份边界的网格边
  const boundaryEdges = new Map<string, GridEdge>();

  for (const day of monthDays) {
    const { weekIndex, weekdayIndex } = day;

    const topNeighbor = positionedDayMap.get(`${weekIndex}-${weekdayIndex - 1}`);
    const bottomNeighbor = positionedDayMap.get(`${weekIndex}-${weekdayIndex + 1}`);
    const leftNeighbor = positionedDayMap.get(`${weekIndex - 1}-${weekdayIndex}`);
    const rightNeighbor = positionedDayMap.get(`${weekIndex + 1}-${weekdayIndex}`);

    const sameMonthTop = topNeighbor?.month === month;
    const sameMonthBottom = bottomNeighbor?.month === month;
    const sameMonthLeft = leftNeighbor?.month === month;
    const sameMonthRight = rightNeighbor?.month === month;

    // 四个角点（逻辑网格点）
    const topLeft = { x: weekIndex, y: weekdayIndex };
    const topRight = { x: weekIndex + 1, y: weekdayIndex };
    const bottomLeft = { x: weekIndex, y: weekdayIndex + 1 };
    const bottomRight = { x: weekIndex + 1, y: weekdayIndex + 1 };

    // 上边界
    if (!sameMonthTop) {
      boundaryEdges.set(
        undirectedEdgeKey(topLeft, topRight),
        { start: topLeft, end: topRight }
      );
    }
    // 下边界
    if (!sameMonthBottom) {
      boundaryEdges.set(
        undirectedEdgeKey(bottomLeft, bottomRight),
        { start: bottomLeft, end: bottomRight }
      );
    }
    // 左边界
    if (!sameMonthLeft) {
      boundaryEdges.set(
        undirectedEdgeKey(topLeft, bottomLeft),
        { start: topLeft, end: bottomLeft }
      );
    }
    // 右边界
    if (!sameMonthRight) {
      boundaryEdges.set(
        undirectedEdgeKey(topRight, bottomRight),
        { start: topRight, end: bottomRight }
      );
    }
  }

  if (boundaryEdges.size === 0) {
    return null;
  }

  // 构建点到边的邻接关系
  const adjacency = new Map<string, GridEdge[]>();

  for (const edge of boundaryEdges.values()) {
    const startKey = pointKey(edge.start);
    const endKey = pointKey(edge.end);

    if (!adjacency.has(startKey)) adjacency.set(startKey, []);
    if (!adjacency.has(endKey)) adjacency.set(endKey, []);

    adjacency.get(startKey)!.push(edge);
    adjacency.get(endKey)!.push(edge);
  }

  // 将边串成闭合 loop
  const visitedEdges = new Set<string>();
  const loops: GridPoint[][] = [];

  const getOtherPoint = (edge: GridEdge, current: GridPoint): GridPoint => {
    if (edge.start.x === current.x && edge.start.y === current.y) {
      return edge.end;
    }
    return edge.start;
  };

  for (const edge of boundaryEdges.values()) {
    const startEdgeKey = undirectedEdgeKey(edge.start, edge.end);
    if (visitedEdges.has(startEdgeKey)) continue;

    const loop: GridPoint[] = [];
    let currentEdge = edge;
    let currentPoint = edge.start;
    const loopStartPoint = edge.start;

    while (true) {
      const currentEdgeKey = undirectedEdgeKey(currentEdge.start, currentEdge.end);
      visitedEdges.add(currentEdgeKey);

      loop.push(currentPoint);

      const nextPoint = getOtherPoint(currentEdge, currentPoint);
      const nextPointKey = pointKey(nextPoint);
      const candidateEdges = adjacency.get(nextPointKey) ?? [];

      // 找到下一条还未访问的边
      const nextEdge = candidateEdges.find((candidate) => {
        const candidateKey = undirectedEdgeKey(candidate.start, candidate.end);
        return !visitedEdges.has(candidateKey);
      });

      currentPoint = nextPoint;

      // 如果没有下一条边了，说明轮廓到头
      if (!nextEdge) {
        loop.push(currentPoint);
        break;
      }

      currentEdge = nextEdge;

      // 如果回到了起点并且后续边也都访问过了，轮廓闭合
      if (
        currentPoint.x === loopStartPoint.x &&
        currentPoint.y === loopStartPoint.y
      ) {
        loop.push(currentPoint);
        break;
      }
    }

    if (loop.length >= 2) {
      loops.push(loop);
    }
  }

  // 将逻辑网格点转换为像素坐标
  const toPixelPoint = (point: GridPoint) => ({
    x: gridOffsetX + point.x * (cellSize + gap) - gap / 2,
    y: gridOffsetY + point.y * (cellSize + gap) - gap / 2,
  });

  // 生成 SVG path
  const path = loops
    .map((loop) => {
      if (loop.length === 0) return "";

      const first = toPixelPoint(loop[0]);
      const commands = [`M ${first.x} ${first.y}`];

      for (let i = 1; i < loop.length; i++) {
        const p = toPixelPoint(loop[i]);
        commands.push(`L ${p.x} ${p.y}`);
      }

      commands.push("Z");
      return commands.join(" ");
    })
    .filter(Boolean)
    .join(" ");
  
  // 计算月份标签水平中心
  const minX = Math.min(...monthDays.map((item) => item.x));
  const maxX = Math.max(...monthDays.map((item) => item.x + item.width));
  const centerX = (minX + maxX) / 2;

  return {
    month,
    path,
    centerX,
  };
};

// 组件样式定义
const useStyles = makeStyles({
  chartContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "transparent",
    margin: "0px",
    overflow: "hidden",
    position: "relative",
    minHeight: 0,
    minWidth: 0,
    "& *": {
      cursor: "default !important",
      boxSizing: "border-box",
    },
  },
  chartArea: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  svg: {
    display: "block",
    width: "100%",
    height: "100%",
    overflow: "visible",
    backgroundColor: "transparent",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
    marginTop: "-16px",
    marginBottom: "3px",
    zIndex: 1,
  },
  legendLeft: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    minWidth: 0,
    paddingLeft: "35px",
  },
  legendText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    lineHeight: "20px",
    whiteSpace: "nowrap",
  },
  legendSwatches: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
  },
  legendSwatch: {
    width: "10px",
    height: "10px",
    borderRadius: "2px",
    flexShrink: 0,
    marginBottom: "-2px",
  },
  todayCountContainer: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    minWidth: 0,
  },
  todayCountLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    lineHeight: "20px",
    whiteSpace: "nowrap",
  },
  todayCountValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "20px",
    whiteSpace: "nowrap",
  },
  tooltip: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
    position: "absolute",
    pointerEvents: "none",
    zIndex: 20,
    padding: "5px 8px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground5,
    boxShadow: tokens.shadow2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    transition: "left 120ms ease-out, top 120ms ease-out, opacity 120ms ease-out",
  },
  tooltipTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  tooltipMarker: {
    width: "10px",
    height: "10px",
    borderRadius: "2px",
    flexShrink: 0,
    marginTop: "1px",
  },
  tooltipTitle: {
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: "20px",
    marginTop: "-1px",
  },
  tooltipRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tooltipLabel: {
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
  },
  tooltipValue: {
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: "right",
  },
});

export const CalendarHeatmap = React.memo(
  ({
    days,
    todayCount = 0,
    texts,
  }: CalendarHeatmapProps) => {
    const styles = useStyles();

    // 从设置中获取当前语言
    const { language } = useSettingsStore();

    // 图表容器 DOM，用于获取当前可用尺寸
    const containerRef = useRef<HTMLDivElement>(null);

    // 图表实际绘制区域 DOM，尺寸由容器尺寸和边距共同决定
    const chartAreaRef = useRef<HTMLDivElement>(null);
    const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

    // Tooltip 相关状态
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [hoveredDay, setHoveredDay] = useState<PositionedCalendarDayItem | null>(null);
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
    const [hiddenLevels, setHiddenLevels] = useState<Set<number>>(new Set());
    const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

    // 监听容器尺寸变化
    useEffect(() => {
      const element = chartAreaRef.current;
      if (!element) return;

      const updateSize = () => {
        const rect = element.getBoundingClientRect();
        setChartSize({
          width: rect.width,
          height: rect.height,
        });
      };

      updateSize();

      const observer = new ResizeObserver(() => {
        updateSize();
      });

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }, []);

    // 核心几何布局计算
    const geometry = useMemo(() => {
      const width = chartSize.width;
      const height = chartSize.height;

      const margin = {
        top: 7,
        right: 3,
        bottom: 0,
        left: 35,
      };

      const innerWidth = Math.max(0, width - margin.left - margin.right);
      const innerHeight = Math.max(0, height - margin.top - margin.bottom);

      const maxWeekIndex = days.length > 0 ? Math.max(...days.map((item) => item.weekIndex)) : 0;
      const totalWeeks = maxWeekIndex + 1;

      // cell 尺寸与 gap
      const preferredGap = 3;

      const cellSizeByHeight =
        totalWeeks > 0 ? (innerHeight - preferredGap * 6) / 7 : 0;

      const cellSizeByWidth =
        totalWeeks > 0
          ? (innerWidth - preferredGap * (totalWeeks - 1)) / totalWeeks
          : 0;

      const cellSize = Math.max(0, Math.min(cellSizeByHeight, cellSizeByWidth));
      const gap = preferredGap;

      const gridWidth =
        totalWeeks > 0 ? totalWeeks * cellSize + (totalWeeks - 1) * gap : 0;
      const gridHeight = 7 * cellSize + 6 * gap;

      const gridOffsetX = margin.left + Math.max(0, (innerWidth - gridWidth) / 2);
      const gridOffsetY = margin.top + Math.max(0, (innerHeight - gridHeight) / 2);

      const positionedDays: PositionedCalendarDayItem[] = days.map((item) => {
        const x = gridOffsetX + item.weekIndex * (cellSize + gap);
        const y = gridOffsetY + item.weekdayIndex * (cellSize + gap);

        return {
          ...item,
          x,
          y,
          width: cellSize,
          height: cellSize,
        };
      });

      const positionedDayMap = new Map<string, PositionedCalendarDayItem>();
      for (const item of positionedDays) {
        positionedDayMap.set(`${item.weekIndex}-${item.weekdayIndex}`, item);
      }

      // 星期标签位置
      const weekdayLabels = texts.weekdays.map((label, index) => ({
        label,
        x: gridOffsetX - 7,
        y: gridOffsetY + index * (cellSize + gap) + cellSize / 2 + 2.5,
      }));

      // 月份轮廓计算
      const monthOutlines: MonthOutline[] = [];
      for (let month = 0; month < 12; month++) {
        const monthDays = positionedDays.filter((item) => item.month === month);
        const outline = buildMonthOutline(
          month,
          monthDays,
          positionedDayMap,
          cellSize,
          gap,
          gridOffsetX,
          gridOffsetY
        );

        if (outline) {
          monthOutlines.push(outline);
        }
      }

      return {
        width,
        height,
        positionedDays,
        positionedDayMap,
        weekdayLabels,
        monthOutlines,
        gridOffsetX,
        gridOffsetY,
        gridWidth,
        gridHeight,
        cellSize,
        gap,
      };
    }, [chartSize, days, texts.weekdays]);

    const legendColors = HEATMAP_LEVELS.map(l => l.color);

    // 判断某个日期值是否因为图例交互而被隐藏
    const isDayHidden = (value: number) => 
      value > 0 && HEATMAP_LEVELS.some((l, i) => l.threshold(value) && hiddenLevels.has(i));

    // 判断某个日期值是否因为图例 hover 而被强调
    const isLevelHovered = (value: number) =>
      hoveredLevel !== null && value > 0 && HEATMAP_LEVELS[hoveredLevel]?.threshold(value) === true;

    const {
      width,
      height,
      positionedDays,
      positionedDayMap,
      weekdayLabels,
      monthOutlines,
      gridOffsetX,
      gridOffsetY,
      gridWidth,
      gridHeight,
      cellSize,
      gap,
    } = geometry;

    // Tooltip 位置计算
    const tooltipPosition = useMemo(() => {
      if (!hoveredDay || !mousePosition) {
        return null;
      }

      const containerRect = containerRef.current?.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();

      if (!containerRect) {
        return null;
      }

      const tooltipWidth = tooltipRect?.width ?? 160;
      const tooltipHeight = tooltipRect?.height ?? 56;
      const offsetX = 16;
      const offsetY = 16;
      const preferRight = mousePosition.x < containerRect.width / 2;
      const preferBottom = mousePosition.y < containerRect.height / 2;

      let left = preferRight
        ? mousePosition.x + offsetX
        : mousePosition.x - tooltipWidth - offsetX;

      let top = preferBottom
        ? mousePosition.y + offsetY
        : mousePosition.y - tooltipHeight - offsetY;

      if (left < 0) {
        left = 0;
      }

      if (left + tooltipWidth > containerRect.width) {
        left = containerRect.width - tooltipWidth;
      }

      if (top < 0) {
        top = 0;
      }

      if (top + tooltipHeight > containerRect.height) {
        top = containerRect.height - tooltipHeight;
      }

      return { left, top };
    }, [hoveredDay, mousePosition]);

    // 图例交互
    const handleToggleLevel = (index: number) => {
      setHiddenLevels((prev) => {
        const next = new Set(prev);
        next.has(index) ? next.delete(index) : next.add(index);
        return next;
      });
    };

    return (
      <div ref={containerRef} className={styles.chartContainer}>
        <div ref={chartAreaRef} className={styles.chartArea}>
          {chartSize.width > 0 && chartSize.height > 0 && (
            <svg
              className={styles.svg}
              width={width}
              height={height}
              role="img"
              aria-label={
                days.length > 0
                  ? `Calendar heatmap for ${days[0].date.slice(0, 4)}`
                  : "Calendar heatmap"
              }
            >
              {/* 月份标签 */}
              {monthOutlines.map((item) => (
                <text
                  key={`month-label-${item.month}`}
                  x={item.centerX}
                  y={16}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={tokens.colorNeutralForeground1}
                  fontFamily={tokens.fontFamilyBase}
                  fontSize={tokens.fontSizeBase300}
                  pointerEvents="none"
                >
                  {texts.months[item.month]}
                </text>
              ))}

              {/* 星期标签 */}
              {weekdayLabels.map((item, index) => (
                <text
                  key={`weekday-label-${index}`}
                  x={item.x}
                  y={item.y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={tokens.colorNeutralForeground1}
                  fontFamily={tokens.fontFamilyBase}
                  fontSize={tokens.fontSizeBase300}
                  pointerEvents="none"
                >
                  {item.label}
                </text>
              ))}

              {/* 日期格子 */}
              {positionedDays.map((item) => {
                const isTooltipHovered = hoveredDay?.date === item.date && item.value > 0;
                const isLegendHovered = isLevelHovered(item.value) && !isDayHidden(item.value);
                const expand = isLegendHovered || isTooltipHovered ? 0.5 : 0;
                return (
                  <rect
                    key={item.date}
                    x={item.x - expand}
                    y={item.y - expand}
                    width={item.width + expand * 2}
                    height={item.height + expand * 2}
                    rx={1.5}
                    fill={
                    isDayHidden(item.value) 
                      ? tokens.colorNeutralBackground2Selected 
                      : getHeatmapColor(item.value)
                    }
                    stroke={
                      isTooltipHovered || isLegendHovered
                        ? tokens.colorNeutralForeground1
                        : "none"
                    }
                    strokeWidth={isTooltipHovered || isLegendHovered ? 1.5 : 0}
                    style={{
                      filter:
                        isTooltipHovered
                          ? `drop-shadow(0 0 1.5px ${tokens.colorNeutralForeground1})`
                          : "none",
                      opacity: hoveredLevel !== null && !hiddenLevels.has(hoveredLevel) && !isLegendHovered && item.value > 0 ? 0.4 : 1,
                      transition: "opacity 150ms ease, fill 150ms ease",
                    }}
                  />
                );
              })}

              {/* 月份轮廓 */}
              {monthOutlines.map((item) => (
                <path
                  key={`month-outline-${item.month}`}
                  d={item.path}
                  fill="none"
                  stroke={tokens.colorNeutralForeground1}
                  strokeWidth={1.5}
                  strokeLinejoin="bevel"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
              ))}

              {/* Tooltip 交互层 */}
              <rect
                x={gridOffsetX}
                y={gridOffsetY}
                width={gridWidth}
                height={gridHeight}
                fill="transparent"
                onMouseMove={(event) => {
                  const containerRect = containerRef.current?.getBoundingClientRect();
                  if (!containerRect) {
                    setHoveredDay(null);
                    setMousePosition(null);
                    return;
                  }

                  const x = event.clientX - containerRect.left;
                  const y = event.clientY - containerRect.top;

                  const step = cellSize + gap;
                  const relativeX = x - gridOffsetX;
                  const relativeY = y - gridOffsetY;

                  if (
                    relativeX < 0 ||
                    relativeY < 0 ||
                    relativeX > gridWidth ||
                    relativeY > gridHeight
                  ) {
                    setHoveredDay(null);
                    setMousePosition(null);
                    return;
                  }

                  // 关键：gap 不再作为空白区，而是吸附到最近格子
                  const weekIndex = Math.round((relativeX - cellSize / 2) / step);
                  const weekdayIndex = Math.round((relativeY - cellSize / 2) / step);

                  const nextHoveredDay = positionedDayMap.get(`${weekIndex}-${weekdayIndex}`) ?? null;

                  if (!nextHoveredDay || nextHoveredDay.value <= 0 || isDayHidden(nextHoveredDay.value)) {
                    setHoveredDay(null);
                    setMousePosition(null);
                    return;
                  }

                  setHoveredDay((prev) => prev?.date === nextHoveredDay.date ? prev : nextHoveredDay);

                  setMousePosition({ x, y });
                }}
                onMouseLeave={() => {
                  setHoveredDay(null);
                  setMousePosition(null);
                }}
              />
            </svg>
          )}
        </div>

        {/* 图例和今日训练计数显示区域 */}
        <div className={styles.footer}>
          {/* 图例 */}
          <div className={styles.legendLeft}>
            <Text className={styles.legendText}>{texts.less}</Text>
            <div className={styles.legendSwatches}>
              {legendColors.map((color, index) => (
                <div
                  key={`legend-swatch-${index}`}
                  className={styles.legendSwatch}
                  onClick={() => handleToggleLevel(index)}
                  onMouseEnter={() => setHoveredLevel(index)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  style={{ 
                    backgroundColor: hiddenLevels.has(index)
                      ? tokens.colorNeutralBackground2Selected
                      : color,
                  }}
                />
              ))}
            </div>
            <Text className={styles.legendText}>{texts.more}</Text>
          </div>

          {/* 今日训练计数 */}
          <div className={styles.todayCountContainer}>
            <Text className={styles.todayCountLabel}>{texts.todayTrainingCount}</Text>
            <Text 
              className={styles.todayCountValue}
              style={{ paddingLeft: language === "English" ? "5px" : "0px" }}
            >
              {todayCount}
            </Text>
          </div>
        </div>

        {/* Tooltip 内容 */}
        {hoveredDay && tooltipPosition && (
          <div
            ref={tooltipRef}
            className={styles.tooltip}
            style={{
              left: `${tooltipPosition.left}px`,
              top: `${tooltipPosition.top}px`,
            }}
          >
            <div className={styles.tooltipTitleRow}>
              <span
                className={styles.tooltipMarker}
                style={{ backgroundColor: getHeatmapColor(hoveredDay.value) }}
              />
              <div className={styles.tooltipTitle}>{hoveredDay.date}</div>
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>{texts.trainingCount}</span>
              <span 
                className={styles.tooltipValue}
                style={{ paddingLeft: language === "English" ? "5px" : "0px" }}
              >
                {hoveredDay.value}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CalendarHeatmap.displayName = "CalendarHeatmap";