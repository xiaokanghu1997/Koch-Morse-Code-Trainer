import { 
  Text, 
  Dropdown,
  Option,
  makeStyles,
  mergeClasses,
  tokens
} from "@fluentui/react-components";
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
import { useState, useEffect, useMemo, useRef } from "react";
import { useLessonManager } from "../hooks/useLessonManager";
import { useStatisticalToolset } from "../hooks/useStatisticalToolset";
import { useTrainingStore } from "../stores/trainingStore";
import { useSettingsStore } from "../stores/settingsStore";

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

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "5px 10px",
    gap: "10px",
  },
  // 第一行
  headerRow: {
    display: "flex",
    alignItems: "center",
    marginTop: "-5px",
    gap: "12px",
  },
  selectContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  describeText: {
    fontSize: tokens.fontSizeBase300,
  },
  dropdownBase: {
    height: "32px",
    paddingBottom: "1.5px",
    transform: "translateY(1.5px)",
    border: "none",
    boxShadow: tokens.shadow2,
    "::after": {
      display: "none",
    },
    backgroundColor: tokens.colorNeutralBackground3,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground3Pressed,
    },
  },
  dropdownDataset: {
    minWidth: "125px",
    maxWidth: "125px",
  },
  dropdownLesson: {
    minWidth: "105px",
    maxWidth: "105px",
  },
  dropdownStatType: {
    minWidth: "90px",
    maxWidth: "90px",
  },
  dropdownListboxBase: {
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground4,
  },
  dropdownListboxDataset: {
    minWidth: "125px",
    maxWidth: "125px",
  },
  dropdownListboxLesson: {
    minWidth: "110px",
    maxWidth: "110px",
    height: "166px",
  },
  dropdownListboxStatType: {
    minWidth: "90px",
    maxWidth: "90px",
  },
  dropdownOption: {
    height: "32px",
    position: "relative",
    paddingLeft: "12px",
    paddingTop: "4px",
    backgroundColor: tokens.colorNeutralBackground4,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground4Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground4Pressed,
    },
    "&[aria-selected='true']": {
      backgroundColor: tokens.colorNeutralBackground4Selected,
    },
    "&[aria-selected='true']:hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    "&[aria-selected='true']::before": {
      content: '""',
      position: "absolute",
      left: "4px",
      top: "8px",
      bottom: "8px",
      width: "3px",
      borderRadius: "2px",
      backgroundColor: tokens.colorBrandForeground1,
    },
  },
  // 第二行
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

const statTypeOptions = ["Default", "Hour", "Day", "Month", "Year"];

export const StatisticsPage = () => {
  // 使用样式
  const styles = useStyles();

  // 引用图表容器 DOM 元素并存储 ECharts实例
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // 获取统计工具集
  const statisticalToolset = useStatisticalToolset();

  // 获取主题设置
  const theme = useSettingsStore((state) => state.theme);

  // 获取全局训练记录
  const globalRecords = useTrainingStore((state) => state.globalRecords);

  // 获取有训练记录的数据集
  const availableDatasets = useMemo(() => {
    return Object.keys(globalRecords.datasets).filter(
      (datasetName) => globalRecords.datasets[datasetName].recordCount > 0
    );
  }, [globalRecords]);

  // 初始化 selectedDataset 时使用第一个有记录的数据集
  const [selectedDataset, setSelectedDataset] = useState<string>(
    availableDatasets.length > 0 ? availableDatasets[0] : "Koch-LCWO"
  );

  // 初始化 selectedLesson
  const [selectedLesson, setSelectedLesson] = useState<number>(0);

  // 获取课程列表
  const { lessons, totalLessonNumber } = useLessonManager(selectedDataset, selectedLesson);

  // 筛选出有记录的课程，并添加 All 选项
  const availableLessons = useMemo(() => {
    const dataset = globalRecords.datasets[selectedDataset];
    if (!dataset) {
      return [];
    }
    // 获取有记录的课程编号
    const lessonsWithRecords = lessons.filter(
      (lesson) => dataset.lessons[lesson.lessonNumber]?.recordCount > 0
    );
    // 添加 "All" 选项
    return [
      { lessonNumber: 0, characters: [], displayText: "All" },
      ...lessonsWithRecords,
    ];
  }, [globalRecords, selectedDataset, lessons]);

  // 获取当前选中课程的显示文本
  const selectedLessonDisplay = useMemo(() => {
    const lesson = availableLessons.find(l => l.lessonNumber === selectedLesson);
    return lesson?.displayText || "All";
  }, [availableLessons, selectedLesson]);

  // 定义统计类型选项
  const [selectedStatType, setSelectedStatType] = useState<string>("Default");

  // 课程切换时统计类型恢复为默认
  useEffect(() => {
    setSelectedStatType("Default");
  }, [selectedLesson]);

  // 根据选项准备图表数据
  const chartData = useMemo(() => {
    // 情况1：选择了所有课程
    if (selectedLesson === 0) {
      const result = statisticalToolset.getLessonStatsForDataset(selectedDataset);
      const allLessonNumbers = Array.from({ length: totalLessonNumber }, (_, i) => i + 1);
      let yrightmax = Math.max(...result.lessons.map(l => l.recordCount));
      if (yrightmax < 20) {
        yrightmax = 20;
      } else {
        yrightmax = 40;
      }
      let legendloc2 = "0px";
      let legendloc3 = "0px";
      let avgaccuracy = result.datasetAverageAccuracy;
      if (avgaccuracy === 100) {
        legendloc2 = "348px";
        legendloc3 = "512px";
      } else if (avgaccuracy >= 10 && avgaccuracy < 100) {
        legendloc2 = "340.5px";
        legendloc3 = "504.5px";
      } else {
        legendloc2 = "333px";
        legendloc3 = "497px";
      }
      return {
        xLabel: "Lesson ID",
        xTickValues: allLessonNumbers.map(n => n.toString().padStart(2, "0")),
        xValues: result.lessons.map(l => l.lessonNumber.toString()),
        yLeftValues: result.lessons.map(l => l.averageAccuracy.toFixed(2)),
        yRightLabel: "Training Count",
        yRightUnit: "",
        yRightMax: yrightmax,
        yRightValues: result.lessons.map(l => l.recordCount.toString()),
        averageAccuracy: avgaccuracy.toFixed(2),
        legendLoc2: legendloc2,
        legendLoc3: legendloc3,
      };
    }

    // 情况2：选择了具体课程
    const timeStatsResult = statisticalToolset.getTimeStats(selectedStatType.toLowerCase(), {
      datasetName: selectedDataset,
      lessonNumber: selectedLesson,
    });

    let yrightlabel = "";
    let yrightunit = "";
    let yrightmax = Math.max(...timeStatsResult.recordCounts);
    let yrightvalues = [];

    if (selectedStatType === "Default") {
      yrightlabel = "Training Duration";
      yrightunit = " (m)";
      yrightvalues = timeStatsResult.totalDurations.map(d => d.toFixed(2));
      yrightmax = 10;
    } else {
      yrightlabel = "Training Count";
      yrightvalues = timeStatsResult.recordCounts.map(c => c.toString());
      
      if (yrightmax < 20) {
        yrightmax = 20;
      } else {
        yrightmax = 40;
      }
    }

    let legendloc2 = "0px";
    let legendloc3 = "0px";
    let avgaccuracy = timeStatsResult.overallAverageAccuracy;
    if (avgaccuracy === 100) {
      legendloc2 = "348px";
      legendloc3 = "512px";
    } else if (avgaccuracy >= 10 && avgaccuracy < 100) {
      legendloc2 = "340.5px";
      legendloc3 = "504.5px";
    } else {
      legendloc2 = "333px";
      legendloc3 = "497px";
    }

    return {
      xLabel: "",
      xTickValues: timeStatsResult.timeLabels,
      xValues: timeStatsResult.timeTickLabels,
      yLeftValues: timeStatsResult.averageAccuracies.map(a => a.toFixed(2)),
      yRightLabel: yrightlabel,
      yRightUnit: yrightunit,
      yRightMax: yrightmax,
      yRightValues: yrightvalues,
      averageAccuracy: avgaccuracy.toFixed(2),
      legendLoc2: legendloc2,
      legendLoc3: legendloc3,
    };
  }, [
    statisticalToolset,
    selectedDataset,
    selectedLesson,
    selectedStatType
  ]);

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
      formatter: function (params: any) {
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
      }
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
        top: "-2px",
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
        top: "-4px",
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
        top: "-4px",
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
        top: "-4px",
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
      bottom: chartData.xLabel === "" ? "0px" : "16px",
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

  // 渲染
  return (
    <div className={styles.container}>
      {/* 第一行：文本和下拉选择 */}
      <div className={styles.headerRow}>
        <div className={styles.selectContainer}>
          <Text className={styles.describeText}>
            Select dataset:
          </Text>
          <Dropdown
            id="dataset-dropdown"
            className={mergeClasses(styles.dropdownBase, styles.dropdownDataset)}
            listbox={{ className: mergeClasses(styles.dropdownListboxBase, styles.dropdownListboxDataset) }}
            value={selectedDataset}
            selectedOptions={[selectedDataset]}
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                setSelectedDataset(data.optionValue);
                setSelectedLesson(0);
              }
            }}
          >
            {availableDatasets.map((dataset) => (
              <Option
                key={dataset}
                value={dataset}
                className={styles.dropdownOption}
                checkIcon={null}
              >
                {dataset}
              </Option>
            ))}
          </Dropdown>
        </div>
        <div className={styles.selectContainer}>
          <Text className={styles.describeText}>
            Select lesson:
          </Text>
          <Dropdown
            id="lesson-dropdown"
            className={mergeClasses(styles.dropdownBase, styles.dropdownLesson)}
            listbox={{ className: mergeClasses(styles.dropdownListboxBase, styles.dropdownListboxLesson) }}
            value={selectedLessonDisplay}
            selectedOptions={[selectedLesson.toString()]}
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                setSelectedLesson(Number(data.optionValue));
              }
            }}
          >
            {availableLessons.map((lesson) => (
              <Option
                key={lesson.lessonNumber}
                value={lesson.lessonNumber.toString()}
                className={styles.dropdownOption}
                checkIcon={null}
              >
                {lesson.displayText}
              </Option>
            ))}
          </Dropdown>
        </div>
        {selectedLesson !== 0 && (
          <div className={styles.selectContainer}>
            <Text className={styles.describeText}>
              Statistic by:
            </Text>
            <Dropdown
              id="stattype-dropdown"
              className={mergeClasses(styles.dropdownBase, styles.dropdownStatType)}
              listbox={{ className: mergeClasses(styles.dropdownListboxBase, styles.dropdownListboxStatType) }}
              value={selectedStatType}
              selectedOptions={[selectedStatType]}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  setSelectedStatType(data.optionValue);
                }
              }}
            >
              {statTypeOptions.map((statType) => (
                <Option
                  key={statType}
                  value={statType}
                  className={styles.dropdownOption}
                  checkIcon={null}
                >
                  {statType}
                </Option>
              ))}
            </Dropdown>
          </div>
        )}
      </div>

      {/* 第二行：图表区域 */}
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
    </div>
  );
};