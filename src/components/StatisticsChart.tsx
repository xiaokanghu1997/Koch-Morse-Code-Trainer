import { makeStyles, tokens } from "@fluentui/react-components";
import { scaleBand, scaleLinear } from "d3-scale";
import { line as d3Line } from "d3-shape";
import { animated, useSpring } from "@react-spring/web";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";

// 图表输入数据结构
interface ChartData {
  chartType: boolean;
  xLabel: string;
  xTickValues: string[];
  xValues: string[];
  yLeftLabel: string;
  yLeftValues: Array<number | null>;
  yRightLabel: string;
  yRightUnit: string;
  yRightValues: Array<number | null>;
  averageAccuracy: number;
  legendLabels: string[];
  lessonDisplayTitle?: string;
  lessonDisplayFlag?: string;
  lessonDisplayTexts?: string[];
}

// 组件 Props 类型定义
interface StatisticsChartProps {
  chartData: ChartData;
}

// 组件样式定义
const useStyles = makeStyles({
  root: {
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "transparent",
    margin: "0px",
    overflow: "hidden",
    minHeight: 0,
    minWidth: 0,
    "& *": {
      cursor: "default !important",
      boxSizing: "border-box",
    },
  },
  legend: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "18px",
    paddingLeft: "45px",
    paddingBottom: "2px",
    marginTop: "-1px",
    marginBottom: "-1px",
    flexWrap: "wrap",
    minHeight: "24px",
    flexShrink: 0,
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: "14px",
    lineHeight: "20px",
    whiteSpace: "nowrap",
    transition: "color 120ms ease-out",
  },
  legendIcon: {
    width: "24px",
    height: "12px",
    marginTop: "2px",
    marginRight: "6px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chartContainer: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: "100%",
    height: "100%",
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
  tooltip: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
    position: "absolute",
    pointerEvents: "none",
    zIndex: 1,
    padding: "5px 8px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground5,
    boxShadow: tokens.shadow2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    transition: "left 120ms ease-out, top 120ms ease-out, opacity 120ms ease-out",
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
  tooltipRowLeft: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  tooltipMarker: {
    width: "10px",
    height: "10px",
    flexShrink: 0,
    display: "block",
    marginTop: "2px",
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

/**
 * 根据数据量计算 X 轴标签显示间隔
 * @param flag 图表类型标志
 * @param dataLength X 轴数据长度
 * @returns 标签显示间隔，0 表示全部显示，"auto" 表示自动计算，正整数表示固定间隔显示
 */
const calculateLabelInterval = (
  flag: boolean,
  dataLength: number
): number | "auto" => {
  if (flag) {
    if (dataLength <= 30) {
      return 0;
    } else if (dataLength <= 60) {
      return 1;
    } else {
      return "auto";
    }
  } else {
    if (dataLength <= 10) {
      return 0;
    } else if (dataLength <= 20) {
      return 1;
    } else if (dataLength <= 30) {
      return 2;
    } else if (dataLength <= 40) {
      return 4;
    } else {
      return "auto";
    }
  }
};

/**
 * 计算右侧 Y 轴最大值
 * @param maxValue 右侧 Y 轴数据最大值
 * @returns 适合的右侧 Y 轴最大值
 */
const calculateYRightMax = (maxValue: number): number => {
  if (maxValue < 20) {
    return 20;
  } else if (maxValue >= 20 && maxValue < 40) {
    return 40;
  } else if (maxValue >= 40 && maxValue < 60) {
    return 60;
  } else {
    return 80;
  }
};

/**
 * 判断某个 X 轴标签是否应该渲染
 * @param index 标签索引
 * @param interval 标签显示间隔
 * @param total 标签总数
 * @returns 是否渲染该标签
 */
const shouldRenderXAxisLabel = (
  index: number,
  interval: number | "auto",
  total: number
) => {
  if (interval === "auto") {
    if (total <= 1) return true;
    const targetCount = total > 60 ? 10 : 8;
    const step = Math.max(1, Math.ceil(total / targetCount));
    return index % step === 0;
  }
  return index % (interval + 1) === 0;
};

// 统计图组件
export const StatisticsChart = React.memo(
  ({ chartData }: StatisticsChartProps) => {
    const styles = useStyles();

    // 图表容器 DOM，用于获取当前可用尺寸
    const containerRef = useRef<HTMLDivElement>(null);

    // tooltip DOM，用于获取尺寸和定位
    const tooltipRef = useRef<HTMLDivElement>(null);

    // 容器真实尺寸
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // 当前悬浮的点索引，用于显示 tooltip
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // 鼠标位置，用于 tooltip 定位
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

    // 图例可见性状态
    const [visibleSeries, setVisibleSeries] = useState({
      accuracy: true,
      average: true,
      threshold: true,
      bars: true,
    });

    // 当前悬浮的图例项，用于高亮显示对应的图表元素
    const [hoveredLegendKey, setHoveredLegendKey] = useState<"accuracy" | "average" | "threshold" | "bars" | null>(null);

    // 从设置中获取当前语言
    const { language } = useSettingsStore();

    // 监听容器尺寸变化
    useEffect(() => {
      const element = containerRef.current;
      if (!element) return;
      const updateSize = () => {
        const rect = element.getBoundingClientRect();
        setContainerSize({
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

    const {
      xTickValues,
      xValues,
      xLabel,
      yLeftValues,
      yRightValues,
      yLeftLabel,
      yRightLabel,
      yRightUnit,
      averageAccuracy,
      legendLabels,
      lessonDisplayTitle,
      lessonDisplayFlag,
      lessonDisplayTexts,
    } = chartData;

    // 计算右侧 Y 轴最大值
    const yRightMax = useMemo(() => {
      if (yRightUnit === "") {
        const validRightValues = yRightValues.filter((v): v is number => v !== null);
        const maxRightValue = validRightValues.length > 0 ? Math.max(...validRightValues) : 0;
        return calculateYRightMax(maxRightValue);
      } else {
        return 10;
      }
    }, [yRightValues, yRightUnit]);

    // 图表几何信息计算
    const chartGeometry = useMemo(() => {
      const width = containerSize.width;
      const height = containerSize.height;

      // 为坐标轴标题、刻度文字留出空间
      const margin = {
        top: 10,
        right: 40,
        bottom: xLabel === "" ? 14 : 34,
        left: 44,
      };

      const innerWidth = Math.max(0, width - margin.left - margin.right);
      const innerHeight = Math.max(0, height - margin.top - margin.bottom);

      // 右侧 Y 轴最大值兜底，避免 domain 为 [0, 0]
      const safeRightMax = yRightMax > 0 ? yRightMax : 1;

      // X 轴比例尺（band scale）
      const xScale = scaleBand<string>()
        .domain(xTickValues)
        .range([0, innerWidth])
        .paddingInner(0.35)
        .paddingOuter(0.2);
      
      // 计算每个刻度的宽度，供后续标签显示策略使用
      const tickSlotWidth = xTickValues.length > 0 ? innerWidth / xTickValues.length : 0;

      // 左 Y 轴固定为 0 ~ 100
      const yLeftScale = scaleLinear().domain([0, 100]).range([innerHeight, 0]);

      // 右 Y 轴使用传入的最大值
      const yRightScale = scaleLinear()
        .domain([0, safeRightMax])
        .range([innerHeight, 0]);

      // 左 Y 轴固定刻度：0 ~ 100，每 10 一档
      const leftTicks = Array.from({ length: 11 }, (_, i) => i * 10);

      // 右 Y 轴固定拆成 10 份
      const rightTicks = Array.from(
        { length: 11 },
        (_, i) => (safeRightMax / 10) * i
      );

      // 折线点位计算
      const linePoints = xTickValues.map((tick, index) => {
        const bandX = xScale(tick) ?? 0;
        const centerX = bandX + xScale.bandwidth() / 2;
        const value = yLeftValues[index];
        const hasValue = value !== null && value !== undefined;

        return {
          x: centerX,
          y: hasValue ? yLeftScale(value) : null,
          value,
          tick,
        };
      });

      // 使用 d3-shape 生成折线路径
      const lineGenerator = d3Line<{ x: number; y: number | null }>()
        .defined((d) => d.y !== null)
        .x((d) => d.x)
        .y((d) => d.y as number);

      const linePath = lineGenerator(linePoints) ?? "";

      // 柱子宽度
      const barWidth = xScale.bandwidth();

      // 柱状图矩形计算，柱子与折线点都对齐到同一个 band 的中心位置
      const bars = xTickValues.map((tick, index) => {
        const value = yRightValues[index];
        if (value === null || value === undefined) {
          return null;
        }
        const bandX = xScale(tick) ?? 0;
        const centerX = bandX + xScale.bandwidth() / 2;
        const y = yRightScale(value);
        const h = innerHeight - y;

        return {
          index,
          x: centerX - barWidth / 2,
          y,
          width: barWidth,
          height: Math.max(0, h),
          value,
          tick,
        };
      }).filter((bar): bar is NonNullable<typeof bar> => bar !== null);

      // X 轴标签显示策略
      const xAxisInterval = calculateLabelInterval(
        chartData.chartType,
        xTickValues.length
      );

      return {
        width,
        height,
        margin,
        innerWidth,
        innerHeight,
        xScale,
        yLeftScale,
        yRightScale,
        leftTicks,
        rightTicks,
        linePoints,
        linePath,
        bars,
        tickSlotWidth,
        xAxisInterval,
      };
    }, [
      chartData.chartType,
      containerSize,
      yLeftValues,
      yRightMax,
      xLabel,
      xTickValues,
    ]);

    const {
      width,
      height,
      margin,
      innerWidth,
      innerHeight,
      xScale,
      yLeftScale,
      yRightScale,
      leftTicks,
      rightTicks,
      linePoints,
      linePath,
      bars,
      tickSlotWidth,
      xAxisInterval,
    } = chartGeometry;

    // 两条参考线：平均正确率线、90 分阈值线
    const averageLineY = yLeftScale(averageAccuracy);
    const thresholdLineY = yLeftScale(90);

    // 动画时长设置，单位毫秒
    const animationDuration = 1000;
    const lastValidPoint = linePoints.filter(p => p.y !== null).pop();
    const lastPointX = lastValidPoint ? lastValidPoint.x : innerWidth;
    const barDuration = (lastPointX / innerWidth) * animationDuration;

    // 参考线动画控制，使用 react-spring 实现从左到右的 reveal 效果
    const [referenceSpring, referenceApi] = useSpring(() => ({
      revealWidth: 0,
      immediate: true,
    }));

    useEffect(() => {
      if (innerWidth <= 0) return;
      referenceApi.set({ revealWidth: 0 });
      referenceApi.start({
        revealWidth: innerWidth,
        immediate: false,
        config: {
          duration: animationDuration,
        },
      });
    }, [innerWidth, averageAccuracy, referenceApi]);
    
    // 柱状图动画控制，使用 react-spring 实现从底部向上生长的效果
    const [barSpring, barApi] = useSpring(() => ({
      progress: 0,
      immediate: true,
    }));

    useEffect(() => {
      if (bars.length === 0) return;

      if (!visibleSeries.bars) {
        barApi.start({
          progress: 0,
          immediate: true,
          config: { duration: 250 },
        });
        return;
      }
      barApi.set({ progress: 0 });
      barApi.start({
        progress: 1,
        immediate: false,
        config: { duration: barDuration },
      });
    }, [bars, visibleSeries.bars, barApi]);

    // 折线动画控制，使用 react-spring 实现路径逐渐绘制的效果
    const [lineSpring, lineApi] = useSpring(() => ({
      progress: 0,
      immediate: true,
    }));

    useEffect(() => {
      if (!visibleSeries.accuracy) {
        lineApi.start({
          progress: 0,
          immediate: true,
          config: { duration: 250 },
        });
        return;
      }
      lineApi.set({ progress: 0 });
      lineApi.start({
        progress: 1,
        immediate: false,
        config: { duration: animationDuration },
      });
    }, [visibleSeries.accuracy, xTickValues, yLeftValues, lineApi]);

    // 坐标轴标题位置
    const xAxisNameY = height - 2;
    const leftAxisNameX = 12;
    const rightAxisNameX = width - 2;
    const axisTitleY = margin.top + innerHeight / 2;

    // 右侧 Y 轴标题，如果有单位则拼到标题后面
    const rightAxisTitle =
      yRightUnit === "" ? yRightLabel : yRightLabel + yRightUnit;

    // 公共文本样式
    const axisTextStyle = {
      fill: tokens.colorNeutralForeground1,
      fontFamily: tokens.fontFamilyBase,
      fontSize: tokens.fontSizeBase300,
    };

    // 坐标轴主线：刻度线公共样式
    const axisLineStyle = {
      stroke: tokens.colorNeutralForeground1,
      strokeWidth: 1.5,
      strokeLinecap: "round" as const,
    };

    // 横向网格线公共样式
    const gridLineStyle = {
      stroke: tokens.colorNeutralForegroundDisabled,
      strokeWidth: 1.5,
      strokeDasharray: "4 2",
      opacity: 0.4,
    };

    // 参考虚线公共基础样式
    const referenceLineStyle = {
      strokeWidth: 1.5,
      strokeDasharray: "4 2",
    };

    const isAccuracyLegendHovered = hoveredLegendKey === "accuracy" && visibleSeries.accuracy;
    const isBarsLegendHovered = hoveredLegendKey === "bars" && visibleSeries.bars;

    // 悬浮 tooltip 数据计算
    const tooltipData = useMemo(() => {
      if (hoveredIndex === null || hoveredIndex < 0 || hoveredIndex >= xTickValues.length) {
        return null;
      }
      const leftValue = yLeftValues[hoveredIndex];
      const rightValue = yRightValues[hoveredIndex];
      const hasLeftValue = leftValue !== null && leftValue !== undefined;
      const hasRightValue = rightValue !== null && rightValue !== undefined;
      const title = xLabel === lessonDisplayFlag && lessonDisplayTexts?.[hoveredIndex]
                      ? `${lessonDisplayTitle ?? ""}${lessonDisplayTexts[hoveredIndex]}`
                      : (xValues[hoveredIndex] ?? xTickValues[hoveredIndex] ?? "");
      const normalizedYLeftLabel = language === "English" ? `${legendLabels[0]}:` : `${legendLabels[0]}：`;
      const normalizedYRightLabel = language === "English" ? `${yRightLabel}:` : `${yRightLabel}：`;
      const normalizedRightUnit = language === "English" ? "m" : "分钟";
      const rows: Array<{
        key: "accuracy" | "bars";
        label: string;
        value: string;
      }> = [];
      if (visibleSeries.accuracy && hasLeftValue) {
        rows.push({
          key: "accuracy",
          label: normalizedYLeftLabel,
          value: `${leftValue.toFixed(2)}%`,
        });
      }
      if (visibleSeries.bars && hasRightValue) {
        rows.push({
          key: "bars",
          label: normalizedYRightLabel,
          value: yRightUnit === ""
            ? `${rightValue}`
            : `${rightValue.toFixed(2)}${normalizedRightUnit}`,
        });
      }
      if (rows.length === 0) {
        return null;
      }
      return {
        title,
        rows,
      };
    }, [hoveredIndex, chartData, visibleSeries, language]);

    // 计算 tooltip 显示位置
    const tooltipPosition = useMemo(() => {
      if (!mousePosition) {
        return null;
      }
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      const tooltipWidth = tooltipRect?.width ?? 180;
      const tooltipHeight = tooltipRect?.height ?? 78;
      const offsetX = 16;
      const offsetY = 16;
      const plotLeft = margin.left;
      const plotTop = margin.top;
      const plotRight = margin.left + innerWidth;
      const plotBottom = margin.top + innerHeight;
      const preferRight = mousePosition.x < plotLeft + innerWidth / 2;
      const preferBottom = mousePosition.y < plotTop + innerHeight / 2;
      let left = preferRight
        ? mousePosition.x + offsetX
        : mousePosition.x - tooltipWidth - offsetX;
      let top = preferBottom
        ? mousePosition.y + offsetY
        : mousePosition.y - tooltipHeight - offsetY;
      if (left < plotLeft) {
        left = plotLeft;
      }
      if (left + tooltipWidth > plotRight) {
        left = plotRight - tooltipWidth;
      }
      if (top < plotTop) {
        top = plotTop;
      }
      if (top + tooltipHeight > plotBottom) {
        top = plotBottom - tooltipHeight;
      }
      return { left, top };
    }, [mousePosition, margin, innerWidth, innerHeight]);

    // 图例点击事件处理函数，切换对应数据系列的可见性，并触发动画
    const handleToggleBars = () => {
      if (visibleSeries.bars) {
        setVisibleSeries((prev) => ({ ...prev, bars: false }));
        return;
      }
      setVisibleSeries((prev) => ({ ...prev, bars: true }));
    };

    const handleToggleAccuracy = () => {
      if (visibleSeries.accuracy) {
        setVisibleSeries((prev) => ({ ...prev, accuracy: false }));
        return;
      }
      setVisibleSeries((prev) => ({ ...prev, accuracy: true }));
    };

    return (
      <div className={styles.root}>
        {/* 自定义图例 */}
        <div className={styles.legend}>
          <div 
            className={styles.legendItem}
            onClick={handleToggleAccuracy}
            style={{
              color: visibleSeries.accuracy
                ? tokens.colorNeutralForeground1
                : tokens.colorNeutralForegroundDisabled,
            }}
            onMouseEnter={() => setHoveredLegendKey("accuracy")}
            onMouseLeave={() => setHoveredLegendKey(null)}
          >
            <span className={styles.legendIcon}>
              <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true">
                <line
                  x1="0"
                  y1="6"
                  x2="24"
                  y2="6"
                  stroke={
                    visibleSeries.accuracy
                      ? tokens.colorPaletteBerryForeground2
                      : tokens.colorNeutralForegroundDisabled
                  }
                  strokeWidth="1.5"
                />
                <circle
                  cx="12"
                  cy="6"
                  r="3"
                  fill={
                    visibleSeries.accuracy
                      ? tokens.colorPaletteBerryBackground2
                      : tokens.colorNeutralForegroundDisabled
                  }
                  stroke={
                    visibleSeries.accuracy
                      ? tokens.colorPaletteBerryForeground2
                      : tokens.colorNeutralForegroundDisabled
                  }
                  strokeWidth="1.5"
                />
              </svg>
            </span>
            <span>{legendLabels[0]}</span>
          </div>

          <div 
            className={styles.legendItem}
            onClick={() => setVisibleSeries((prev) => ({ ...prev, average: !prev.average }))}
            style={{
              color: visibleSeries.average
                ? tokens.colorNeutralForeground1
                : tokens.colorNeutralForegroundDisabled,
            }}
            onMouseEnter={() => setHoveredLegendKey("average")}
            onMouseLeave={() => setHoveredLegendKey(null)}
          >
            <span className={styles.legendIcon}>
              <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true">
                <line
                  x1="0"
                  y1="6"
                  x2="24"
                  y2="6"
                  stroke={
                    visibleSeries.average
                      ? tokens.colorPaletteBerryForeground2
                      : tokens.colorNeutralForegroundDisabled
                  }
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              </svg>
            </span>
            <span>{`${legendLabels[1]}${averageAccuracy.toFixed(2)}%`}</span>
          </div>

          <div 
            className={styles.legendItem}
            onClick={() => setVisibleSeries((prev) => ({ ...prev, threshold: !prev.threshold }))}
            style={{
              color: visibleSeries.threshold
                ? tokens.colorNeutralForeground1
                : tokens.colorNeutralForegroundDisabled,
            }}
            onMouseEnter={() => setHoveredLegendKey("threshold")}
            onMouseLeave={() => setHoveredLegendKey(null)}
          >
            <span className={styles.legendIcon}>
              <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true">
                <line
                  x1="0"
                  y1="6"
                  x2="24"
                  y2="6"
                  stroke={
                    visibleSeries.threshold
                      ? tokens.colorPaletteRedForegroundInverted
                      : tokens.colorNeutralForegroundDisabled
                  }
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              </svg>
            </span>
            <span>{legendLabels[2]}</span>
          </div>

          <div 
            className={styles.legendItem}
            onClick={handleToggleBars}
            style={{
              color: visibleSeries.bars
                ? tokens.colorNeutralForeground1
                : tokens.colorNeutralForegroundDisabled,
            }}
            onMouseEnter={() => setHoveredLegendKey("bars")}
            onMouseLeave={() => setHoveredLegendKey(null)}
          >
            <span className={styles.legendIcon}>
              <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true">
                <rect
                  x="0"
                  y="0"
                  width="24"
                  height="12"
                  fill={
                    visibleSeries.bars
                      ? tokens.colorPaletteGreenForeground2
                      : tokens.colorNeutralForegroundDisabled
                  }
                  rx="4"
                />
              </svg>
            </span>
            <span>{yRightLabel}</span>
          </div>
        </div>

        {/* 图表容器：提供真实可用尺寸 */}
        <div ref={containerRef} className={styles.chartContainer}>
          {/* 拿到有效尺寸后再渲染，避免初始 0 宽高时出现无效绘制 */}
          {containerSize.width > 0 && containerSize.height > 0 && (
            <svg
              className={styles.svg}
              width={width}
              height={height}
              role="img"
              aria-label="Statistics chart"
            >
              <defs>
                <clipPath id="reference-reveal-clip">
                  <animated.rect
                    x={0}
                    y={-3}
                    width={referenceSpring.revealWidth}
                    height={innerHeight}
                  />
                </clipPath>
                <clipPath id="line-reveal-clip">
                  <animated.rect
                    x={0}
                    y={-3}
                    width={lineSpring.progress.to((p) => innerWidth * p)}
                    height={innerHeight + 6}
                  />
                </clipPath>
              </defs>
              <g transform={`translate(${margin.left}, ${margin.top})`}>
                {/* 悬浮高亮背景 */}
                {hoveredIndex !== null && (
                  <rect
                    x={0}
                    y={0}
                    width={tickSlotWidth}
                    height={innerHeight}
                    fill={tokens.colorNeutralBackground4}
                    transform={`translate(${tickSlotWidth * hoveredIndex}, 0)`}
                    style={{ transition: "transform 120ms ease-out" }}
                  />
                )}

                {/* 横向网格线 */}
                {leftTicks.map((tick) => {
                  const y = yLeftScale(tick);
                  return (
                    <line
                      key={`grid-${tick}`}
                      x1={0}
                      y1={y}
                      x2={innerWidth}
                      y2={y}
                      {...gridLineStyle}
                    />
                  );
                })}

                {/* 柱状图 */}
                {bars.map((bar, index) => (
                  <animated.rect
                    key={`bar-main-${bar.tick}-${index}`}
                    x={bar.x}
                    y={barSpring.progress.to((progress) => innerHeight - bar.height * progress)}
                    width={bar.width}
                    height={barSpring.progress.to((progress) => bar.height * progress)}
                    fill={
                      bar.index === hoveredIndex || isBarsLegendHovered
                        ? tokens.colorPaletteGreenBackground2
                        : tokens.colorPaletteGreenForeground2
                    }
                    style={{
                      transition: "fill 120ms ease-out, opacity 120ms ease-out",
                    }}
                  />
                ))}

                <g clipPath="url(#reference-reveal-clip)">
                  {/* 平均正确率参考虚线 */}
                  {visibleSeries.average && (
                    <line
                      x1={0}
                      y1={averageLineY}
                      x2={innerWidth}
                      y2={averageLineY}
                      {...referenceLineStyle}
                      stroke={tokens.colorPaletteBerryForeground2}
                      strokeLinecap="butt"
                    />
                  )}

                  {/* 90 分参考虚线 */}
                  {visibleSeries.threshold && (
                    <line
                      x1={0}
                      y1={thresholdLineY}
                      x2={innerWidth}
                      y2={thresholdLineY}
                      {...referenceLineStyle}
                      stroke={tokens.colorPaletteRedForegroundInverted}
                      strokeLinecap="butt"
                    />
                  )}
                </g>

                {/* 折线 */}
                {visibleSeries.accuracy && linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={tokens.colorPaletteBerryForeground2}
                    strokeWidth="1.5"
                    strokeLinecap="butt"
                    strokeLinejoin="miter"
                    clipPath="url(#line-reveal-clip)"
                  />
                )}

                {/* 折线圆点 */}
                {visibleSeries.accuracy &&
                  linePoints.map((point, index) => {
                    if (point.y === null) {
                      return null;
                    }
                    const targetRadius =
                      hoveredIndex === index ? 4.5 : isAccuracyLegendHovered ? 4.5 : 3;
                    return (
                      <animated.circle
                        key={`point-main-${point.tick}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={lineSpring.progress.to((progress) => {
                          const revealedX = innerWidth * progress;
                          const pointX = point.x;
                          const appearWindow = innerWidth * 0.05;
                          const startX = pointX - appearWindow;
                          const localProgress = Math.max(
                            0,
                            Math.min(1, (revealedX - startX) / appearWindow)
                          );
                          return targetRadius * localProgress;
                        })}
                        fill={tokens.colorPaletteBerryBackground2}
                        stroke={tokens.colorPaletteBerryForeground2}
                        strokeWidth="1.5"
                        style={{
                          transition: "r 120ms ease-out",
                        }}
                      />
                    );
                  })}

                {/* X 轴底线 */}
                <line
                  x1={0}
                  y1={innerHeight}
                  x2={innerWidth}
                  y2={innerHeight}
                  {...axisLineStyle}
                />

                {/* 左 Y 轴 */}
                <line x1={0} y1={0} x2={0} y2={innerHeight} {...axisLineStyle} />

                {/* 右 Y 轴 */}
                <line
                  x1={innerWidth}
                  y1={0}
                  x2={innerWidth}
                  y2={innerHeight}
                  {...axisLineStyle}
                />

                {/* 左 Y 轴刻度与文字 */}
                {leftTicks.map((tick) => {
                  const y = yLeftScale(tick);
                  return (
                    <g key={`left-tick-${tick}`}>
                      <line
                        x1={0}
                        y1={y}
                        x2={4}
                        y2={y}
                        {...axisLineStyle}
                      />
                      <text
                        x={-6}
                        y={y}
                        textAnchor="end"
                        dominantBaseline="middle"
                        {...axisTextStyle}
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {/* 右 Y 轴刻度与文字 */}
                {rightTicks.map((tick, index) => {
                  const y = yRightScale(tick);
                  const display = Number.isInteger(tick)
                    ? String(tick)
                    : tick.toFixed(1);

                  return (
                    <g key={`right-tick-${index}`}>
                      <line
                        x1={innerWidth}
                        y1={y}
                        x2={innerWidth - 4}
                        y2={y}
                        {...axisLineStyle}
                      />
                      <text
                        x={innerWidth + 6}
                        y={y}
                        textAnchor="start"
                        dominantBaseline="middle"
                        {...axisTextStyle}
                      >
                        {display}
                      </text>
                    </g>
                  );
                })}

                {/* X 轴标签 */}
                {xTickValues.map((tick, index) => {
                  if (
                    !shouldRenderXAxisLabel(
                      index,
                      xAxisInterval,
                      xTickValues.length
                    )
                  ) {
                    return null;
                  }
                  const x = (xScale(tick) ?? 0) + xScale.bandwidth() / 2;
                  return (
                    <text
                      key={`x-tick-${tick}-${index}`}
                      x={x}
                      y={innerHeight + 2}
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      {...axisTextStyle}
                    >
                      {tick}
                    </text>
                  );
                })}

                {/* 悬浮区域 */}
                <rect
                  x={0}
                  y={0}
                  width={innerWidth}
                  height={innerHeight}
                  fill="transparent"
                  onMouseMove={(event) => {
                    if (tickSlotWidth <= 0 || xTickValues.length === 0) {
                      setHoveredIndex(null);
                      return;
                    }
                    const svgRect = event.currentTarget.getBoundingClientRect();
                    const relativeX = event.clientX - svgRect.left;
                    const nextIndex = Math.floor(relativeX / tickSlotWidth);
                    const clampedIndex = Math.max(0, Math.min(xTickValues.length - 1, nextIndex));
                    setHoveredIndex((prev) => (prev === clampedIndex ? prev : clampedIndex));
                    const containerRect = containerRef.current?.getBoundingClientRect();
                    if (containerRect) {
                      setMousePosition({
                        x: event.clientX - containerRect.left,
                        y: event.clientY - containerRect.top,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    setMousePosition(null);
                  }}
                />
              </g>

              {/* X 轴标题 */}
              {xLabel !== "" && (
                <text
                  x={width / 2}
                  y={xAxisNameY}
                  textAnchor="middle"
                  {...axisTextStyle}
                >
                  {xLabel}
                </text>
              )}

              {/* 左 Y 轴标题 */}
              <text
                x={leftAxisNameX}
                y={axisTitleY}
                textAnchor="middle"
                transform={`rotate(-90 ${leftAxisNameX} ${axisTitleY})`}
                {...axisTextStyle}
              >
                {yLeftLabel}
              </text>

              {/* 右 Y 轴标题 */}
              <text
                x={rightAxisNameX}
                y={axisTitleY}
                textAnchor="middle"
                transform={`rotate(-90 ${rightAxisNameX} ${axisTitleY})`}
                {...axisTextStyle}
              >
                {rightAxisTitle}
              </text>
            </svg>
          )}

          {/* 悬浮 tooltip */}
          {tooltipData && tooltipPosition && (
            <div
              ref={tooltipRef}
              className={styles.tooltip}
              style={{
                left: `${tooltipPosition.left}px`,
                top: `${tooltipPosition.top}px`,
              }}
            >
              <div className={styles.tooltipTitle}>{tooltipData.title}</div>
              {tooltipData.rows.map((row) => (
                <div key={row.key} className={styles.tooltipRow}>
                  <div className={styles.tooltipRowLeft}>
                    {row.key === "accuracy" ? (
                      <svg className={styles.tooltipMarker} viewBox="0 0 10 10" aria-hidden="true">
                        <circle
                          cx="5"
                          cy="5"
                          r="4.5"
                          fill={tokens.colorPaletteBerryBackground2}
                          stroke={tokens.colorPaletteBerryForeground2}
                          strokeWidth="1.5"
                        />
                      </svg>
                    ) : (
                      <svg className={styles.tooltipMarker} viewBox="0 0 10 10" aria-hidden="true">
                        <rect
                          x="0"
                          y="0"
                          width="10"
                          height="10"
                          rx="2"
                          fill={tokens.colorPaletteGreenForeground2}
                        />
                      </svg>
                    )}
                    <span className={styles.tooltipLabel}>{row.label}</span>
                  </div>
                  <span 
                    className={styles.tooltipValue}
                    style={{ paddingLeft: language === "English" ? "5px" : "0px" }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

StatisticsChart.displayName = "StatisticsChart";