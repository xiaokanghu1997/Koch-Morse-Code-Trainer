import { makeStyles, tokens } from "@fluentui/react-components";
import * as echarts from "echarts/core";
import { HeatmapChart } from "echarts/charts";
import { 
  TitleComponent, 
  TooltipComponent, 
  CalendarComponent,
  VisualMapComponent,  
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import React, { useEffect, useMemo, useRef } from "react";

// 注册 ECharts 模块
echarts.use([
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  CalendarComponent,
  VisualMapComponent,
  SVGRenderer
]);

// 定义接口
interface CalendarHeatmapProps {
  calendarData: Array<[string, number]>;
  selectedYear: string;
  theme?: string;
}

// 定义样式
const useStyles = makeStyles({
  chartContainer: {
    height: "145px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    margin: "0px",
    overflow: "hidden",
    "& *": {
      cursor: "default !important",
    },
  },
});

// Tooltip formatter 函数
const createCalendarTooltipFormatter = () => {
  return function (params: any) {
    const timestamp = params.data[0];
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split("T")[0];
    let result = "";
    result += "<div>" + params.marker + ' <span style="font-weight:600">' + dateStr + "</span></div>";
    result += '<div>Training Count: <span style="font-weight:600">' + params.data[1] + "</span></div>";
    return result;
  };
};

export const CalendarHeatmap = React.memo(({
  calendarData,
  selectedYear,
  theme = "light",
}: CalendarHeatmapProps) => {
  const styles = useStyles();

  // 引用图表容器 DOM 元素并存储 ECharts实例
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // 图表配置
  const chartOptions = useMemo(() => ({
    backgroundColor: "transparent",
    title: {
      show: false
    },
    tooltip: {
      trigger: "item",
      renderMode: "html",
      backgroundColor: tokens.colorNeutralForegroundInverted,
      borderColor: tokens.colorNeutralForegroundDisabled,
      borderWidth: 1,
      formatter: createCalendarTooltipFormatter(),
      padding: 6,
      textStyle: {
        color: tokens.colorNeutralForeground1,
        fontFamily: tokens.fontFamilyBase,
        fontWeight: tokens.fontWeightRegular,
        fontSize: 14,
        lineHeight: 18
      }
    },
    visualMap: {
      type: "piecewise",
      orient: "horizontal",
      left: "18px",
      bottom: "-8px",
      pieces: [
        {gt: 20, color: tokens.colorPaletteGreenBackground1},
        {gt: 10, lte: 20, color: tokens.colorPaletteGreenBackground2},
        {gt: 5, lte: 10, color: tokens.colorPaletteGreenBackground3},
        {gt: 2, lte: 5, color: tokens.colorPaletteGreenForeground1},
        {gt: 0, lte: 2, color: tokens.colorPaletteGreenForeground2},
        {value: 0, color: tokens.colorNeutralBackground2Selected}
      ],
      text: ["  High", "Less  "],
      showLabel: false,
      itemGap: 3,
      itemWidth: 11,
      itemHeight: 11,
      itemSymbol: "rect",
      textStyle: {
        color: tokens.colorNeutralForeground1,
        fontFamily: tokens.fontFamilyBase,
        fontSize: 14,
      }
    },
    calendar: {
      top: "22px",
      left: "32px",
      right: "2px",
      cellSize: 13.3,
      range: parseInt(selectedYear),
      splitLine: {
        show: true,
        lineStyle: {
          color: tokens.colorNeutralForeground1,
          width: 1
        }
      },
      itemStyle: {
        color: tokens.colorNeutralBackground2Selected,
        borderColor: tokens.colorNeutralForegroundInverted,
        borderWidth: 1,
      },
      dayLabel: {
        firstDay: 1,
        nameMap: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        color: tokens.colorNeutralForeground1,
        fontFamily: tokens.fontFamilyBase,
        fontSize: 14,
        margin: 5
      },
      monthLabel: {
        nameMap: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        color: tokens.colorNeutralForeground1,
        fontFamily: tokens.fontFamilyBase,
        fontSize: 14,
        margin: 7
      },
      yearLabel: {show: false}
    },
    series: {
      type: "heatmap",
      coordinateSystem: "calendar",
      data: calendarData,
      emphasis: {
        itemStyle: {
          color: "inherit",
          borderColor: tokens.colorNeutralForeground1,
          borderWidth: 1.5,
          shadowBlur: 1.5,
          shadowColor: tokens.colorNeutralForeground1,
        }
      }
    }
  }), [calendarData, selectedYear]);

  // 初始化和更新 ECharts 实例
  useEffect(() => {
    // 如果容器不存在，直接返回
    if (!chartRef.current) return;

    // 如果实例不存在，创建一个新的实例
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(
        chartRef.current, 
        theme.toLowerCase(),
        {
          renderer: "svg",
          useDirtyRect: false,
        }
      );
    }

    // 设置图表配置
    chartInstanceRef.current.setOption(chartOptions);

    // 在组件卸载时销毁 ECharts 实例
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [chartOptions, theme]);

  // 返回图表容器
  return (
    <div className={styles.chartContainer}>
      <div 
        ref={chartRef} 
        style={{ 
          width: "100%",
          height: "100%",
          margin: 0,
          padding: 0,
          cursor: "default",
        }}
      />
    </div>
  );
});

CalendarHeatmap.displayName = "CalendarHeatmap";