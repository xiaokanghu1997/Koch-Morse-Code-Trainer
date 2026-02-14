import { makeStyles, tokens } from "@fluentui/react-components";
import * as echarts from "echarts/core";
import { LineChart, BarChart } from "echarts/charts";
import { 
  TitleComponent, 
  TooltipComponent, 
  LegendComponent,
  GridComponent,
  MarkLineComponent, 
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import React, { useEffect, useMemo, useRef } from "react";

// 注册所需的 ECharts 组件
echarts.use([
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  SVGRenderer
]);

interface ChartData {
  xLabel: string;
  xTickValues: string[];
  xValues: string[];
  yLeftValues: string[];
  yRightLabel: string;
  yRightUnit: string;
  yRightMax: number;
  yRightValues: string[];
  averageAccuracy: string;
  legendLoc2: string;
  legendLoc3: string;
}

interface StatisticsChartProps {
  chartData: ChartData;
  theme?: string;
}

const useStyles = makeStyles({
  chartContainer: {
    flex: 1,
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
const createTooltipFormatter = (chartData: ChartData) => {
  return function (params: any) {
    const xIndex = params[0].dataIndex;
    let temp = "";
    
    if (chartData.xLabel === "Lesson ID") {
      temp = "Lesson " + chartData.xValues[xIndex].toString().padStart(2, "0");
    } else {
      temp = chartData.xValues[xIndex];
    }
    
    let result = '<div style="font-weight:600">' + temp + "</div>";

    params.forEach(function (item: any) {
      let unit = "";
      if (item.seriesName === "Accuracy") {
        unit = "%</span></div>";
      } else if (item.seriesName === "Training Count") {
        unit = "</span></div>";
      } else if (item.seriesName === "Training Duration") {
        unit = "m</span></div>";
      }
      result += "<div>" + item.marker + " " + item.seriesName + ': <span style="font-weight:600">' + item.value + unit;
    });
    
    return result;
  };
};

export const StatisticsChart = React.memo(({
  chartData,
  theme = "light",
}: StatisticsChartProps) => {
  const styles = useStyles();

  // 引用图表容器 DOM 元素并存储 ECharts实例
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // 图表配置
  const chartOptions = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: {
      renderMode: "html",
      trigger: "axis",
      axisPointer: {
        type: "shadow",
        axis: "x"
      },
      shadowStyle: {
        shadowColor: tokens.colorNeutralBackground2Selected,
        opacity: 0.2
      },
      backgroundColor: tokens.colorNeutralForegroundInverted,
      borderColor: tokens.colorNeutralForegroundDisabled,
      borderWidth: 1,
      textStyle: {
        color: tokens.colorNeutralForeground1,
        fontFamily: tokens.fontFamilyBase,
        fontWeight: tokens.fontWeightRegular,
        fontSize: 14,
        lineHeight: 18
      },
      padding: 6,
      formatter: createTooltipFormatter(chartData)
    },
    legend: [
      {
        inactiveColor: tokens.colorNeutralForegroundDisabled,
        inactiveBorderColor: tokens.colorNeutralForegroundDisabled,
        inactiveBorderWidth: 0,
        data: [
          {
            name: "Accuracy",
          },
        ],
        itemHeight: 7.5,
        itemStyle: {
          borderWidth: 1
        },
        lineStyle: {
          width: 1,
          inactiveColor: tokens.colorNeutralForegroundDisabled,
          inactiveWidth: 1
        },
        top: "0px",
        left: "35px",
        textStyle: {
          color: tokens.colorNeutralForeground1,
          fontFamily: tokens.fontFamilyBase,
          fontSize: 14,
        }
      },
      {
        inactiveColor: tokens.colorNeutralForegroundDisabled,
        inactiveBorderColor: tokens.colorNeutralForegroundDisabled,
        inactiveBorderWidth: 0,
        data: [
          {
            name: `Average Accuracy: ${chartData.averageAccuracy}%`,
            itemStyle: {
              opacity: 0
            },
            lineStyle: {
              color: tokens.colorPaletteBerryForeground2,
              type: "dashed",
              dashOffset: 5,
              width: 1
            },
          },
        ],
        lineStyle: {
          inactiveColor: tokens.colorNeutralForegroundDisabled,
          inactiveWidth: 1
        },
        top: "-1px",
        left: "135px",
        textStyle: {
          color: tokens.colorNeutralForeground1,
          fontFamily: tokens.fontFamilyBase,
          fontSize: 14,
        }
      },
      {
        inactiveColor: tokens.colorNeutralForegroundDisabled,
        inactiveBorderColor: tokens.colorNeutralForegroundDisabled,
        inactiveBorderWidth: 0,
        data: [
          {
            name: "Accuracy Threshold",
            itemStyle: {
              opacity: 0
            },
            lineStyle: {
              color: tokens.colorPaletteRedForegroundInverted,
              type: "dashed",
              dashOffset: 5,
              width: 1
            },
          },
        ],
        lineStyle: {
          inactiveColor: tokens.colorNeutralForegroundDisabled,
          inactiveWidth: 1
        },
        top: "-1px",
        left: chartData.legendLoc2,
        textStyle: {
          color: tokens.colorNeutralForeground1,
          fontFamily: tokens.fontFamilyBase,
          fontSize: 14,
        }
      },
      {
        inactiveColor: tokens.colorNeutralForegroundDisabled,
        inactiveBorderColor: tokens.colorNeutralForegroundDisabled,
        inactiveBorderWidth: 0,
        data: [
          {
            name: chartData.yRightLabel,
          }
        ],
        top: "-1px",
        left: chartData.legendLoc3,
        textStyle: {
          color: tokens.colorNeutralForeground1,
          fontFamily: tokens.fontFamilyBase,
          fontSize: 14,
        }
      },
    ],
    grid: {
      top: "30px",
      bottom: chartData.xLabel === "" ? "0px" : "18px",
      left: "18px",
      right: "22px",
      outerBoundsMode: "same",
      outerBoundsContain: "axisLabel",
      backgroundColor: tokens.colorNeutralForegroundInverted,
    },
    xAxis: [
      {
        z: 2,
        type: "category",
        name: chartData.xLabel,
        nameLocation: "center",
        nameGap: 20,
        nameTextStyle: {
          color: tokens.colorNeutralForeground1,
          fontFamily: tokens.fontFamilyBase,
          fontSize: 14,
        },
        data: chartData.xTickValues,
        axisLine: {
          show: true,
          lineStyle: {
            width: 1,
            color: tokens.colorNeutralForeground1,
            cap: "butt"
          }
        },
        axisLabel: {
          color: tokens.colorNeutralForeground1,
          fontFamily: tokens.fontFamilyBase,
          fontSize: 13.5,
          margin: 2,
          interval: 0,
          lineHeight: 14,
        },
      }
    ],
    yAxis: [
      {
        type: "value",
        name: "Training Accuracy (%)",
        nameLocation: "center",
        nameGap: 30,
        nameTextStyle: {
          color: tokens.colorNeutralForeground1,
          fontFamily: tokens.fontFamilyBase,
          fontSize: 14,
        },
        min: 0,
        max: 100,
        interval: 10,
        axisLabel: {
          color: tokens.colorNeutralForeground1,
          fontFamily: tokens.fontFamilyBase,
          fontSize: 13.5,
          margin: 5
        },
        axisLine: {
          show: true,
          lineStyle: {
              width: 1,
              color: tokens.colorNeutralForeground1,
              cap: "butt"
          }
        },
        axisTick: {
          show: true,
          inside: true,
          length: 4,
          lineStyle: {
              width: 1,
              color: tokens.colorNeutralForeground1,
              cap: "butt"
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
              color: tokens.colorNeutralForegroundDisabled,
              width: 1,
              type: "dashed",
              cap: "butt",
              opacity: 0.2
          }
        },
      },
      {
        type: "value",
        name: chartData.yRightUnit === "" ? chartData.yRightLabel : chartData.yRightLabel + chartData.yRightUnit,
        nameLocation: "center",
        nameGap: chartData.yRightLabel === "Training Count" ? 25 : 21,
        nameTextStyle: {
          color: tokens.colorNeutralForeground1,
          fontFamily: tokens.fontFamilyBase,
          fontSize: 14,
        },
        min: 0,
        max: chartData.yRightMax,
        interval: chartData.yRightMax / 10,
        axisLabel: {
          color: tokens.colorNeutralForeground1,
          fontFamily: tokens.fontFamilyBase,
          fontSize: 13.5,
          margin: 5
        },
        axisLine: {
          show: true,
          lineStyle: {
            width: 1,
            color: tokens.colorNeutralForeground1,
            cap: "butt"
          }
        },
        axisTick: {
          show: true,
          inside: true,
          length: 3,
          lineStyle: {
            width: 1,
            color: tokens.colorNeutralForeground1,
            cap: "square"
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: tokens.colorNeutralForegroundDisabled,
            width: 1,
            type: "dashed",
            opacity: 0.2
          }
        },
      }
    ],
    series: [
      {
        name: "Accuracy",
        type: "line",
        data: chartData.yLeftValues,
        symbol: "circle",
        symbolSize: 6,
        itemStyle: {
          color: tokens.colorPaletteBerryBackground2,
          borderColor: tokens.colorPaletteBerryForeground2,
          borderWidth: 1
        },
        lineStyle: {
          width: 1,
          color: tokens.colorPaletteBerryForeground2,
          cap: "butt"
        },
        emphasis: {
          focus: "none",
          scale: 1.5,
          lineStyle: {
            width: 1,
            color: tokens.colorPaletteBerryForeground2,
            cap: "butt"
          },
          itemStyle: {
            color: tokens.colorPaletteBerryBackground2,
            borderColor: tokens.colorPaletteBerryForeground2,
            borderWidth: 1
          }
        }
      },
      {
        name: `Average Accuracy: ${chartData.averageAccuracy}%`,
        type: "line",
        data: [],
        yAxisIndex: 0,
        lineStyle: {width: 0},
        markLine: {
          z: 0,
          symbol: "none",
          data: [{yAxis: chartData.averageAccuracy}],
          lineStyle: {
            color: tokens.colorPaletteBerryForeground2,
            type: "dashed",
            width: 1,
            cap: "butt"
          },
          label: {
            show: false
          },
          emphasis: {
            disabled: true
          }
        },
      },
      {
        name: "Accuracy Threshold",
        type: "line",
        data: [],
        yAxisIndex: 0,
        lineStyle: {width: 0},
        markLine: {
          z: 0,
          symbol: "none",
          data: [{yAxis: 90}],
          lineStyle: {
            color: tokens.colorPaletteRedForegroundInverted,
            type: "dashed",
            width: 1,
            cap: "butt"
          },
          label: {
            show: false
          },
          emphasis: {
            disabled: true
          }
        }
      },
      {
        name: chartData.yRightLabel,
        type: "bar",
        yAxisIndex: 1,
        z: 0,
        data: chartData.yRightValues,
        itemStyle: {
          color: tokens.colorPaletteGreenForeground2,
        },
        emphasis: {
          focus: "none",
          scale: 1,
          itemStyle: {
            color: tokens.colorPaletteGreenBackground2,
          }
        }
      }
    ]
  }), [chartData]);

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
          cursor: "default"
        }}
      />
    </div>
  );
});

StatisticsChart.displayName = "StatisticsChart";