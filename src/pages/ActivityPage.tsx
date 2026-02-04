import { 
  Text, 
  Dropdown,
  Option,
  makeStyles,
  tokens
} from "@fluentui/react-components";
import * as echarts from "echarts/core";
import { HeatmapChart } from "echarts/charts";
import { 
  TitleComponent, 
  TooltipComponent, 
  CalendarComponent,
  VisualMapComponent,  
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import { useState, useEffect, useMemo, useRef } from "react";
import { useStatisticalToolset } from "../hooks/useStatisticalToolset";
import { useSettingsStore } from "../stores/settingsStore";

// 注册 ECharts 模块
echarts.use([
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  CalendarComponent,
  VisualMapComponent,
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
    gap: "8px",
  },
  describeText: {
    fontSize: tokens.fontSizeBase300,
  },
  infoText: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  dropdown: {
    minWidth: "80px",
    maxWidth: "80px",
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
  dropdownListbox: {
    minWidth: "80px",
    maxWidth: "80px",
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground4,
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
  // 第三行
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "220px repeat(4, 1fr)",
    gap: "2px",
    overflow: "hidden",
  },
  statsHeaderCell: {
    justifyContent: "flex-start",
    paddingLeft: "32px",
  },
  statsCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    fontSize: tokens.fontSizeBase300,
  },
});

export const ActivityPage = () => {
  // 使用样式
  const styles = useStyles();

  // 引用图表容器 DOM 元素并存储 ECharts实例
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // 获取统计工具集
  const statisticalToolset = useStatisticalToolset();

  // 获取主题设置
  const theme = useSettingsStore((state) => state.theme);

  // 获取所有年份
  const allYears = useMemo(() => {
    const years = statisticalToolset.getAllYears();
    return years.length > 0 ? years : [new Date().getFullYear()];
  }, [statisticalToolset]);

  // 选中的年份（默认当前年份）
  const [selectedYear, setSelectedYear] = useState<string>(
    allYears[allYears.length - 1]?.toString() || "2025"
  );

  // 顶部统计数据
  const yearStats = useMemo(() => {
    const overview = statisticalToolset.getYearOverviewStats(parseInt(selectedYear));
    return {
      totalRecordCount: overview.totalRecordCount,
      totalDuration: statisticalToolset.formatDuration(overview.totalDuration),
      averageAccuracy: statisticalToolset.formatAccuracy(overview.averageAccuracy),
    };
  }, [statisticalToolset, selectedYear]);

  // 日历热力数据
  const calendarData = useMemo(() => {
    const data = statisticalToolset.getDailyRecordCounts(parseInt(selectedYear));
    return data as Array<[string, number]>;
  }, [statisticalToolset, selectedYear]);

  // 底部统计数据
  const statsData = useMemo(() => {
    return statisticalToolset.getAllDatasetStats();
  }, [statisticalToolset, selectedYear]);

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
      formatter: function (params: any) {
        const timestamp = params.data[0];
        const date = new Date(timestamp);
        const dateStr = date.toISOString().split("T")[0];
        let result = "";
        result += "<div>" + params.marker + ' <span style="font-weight:600">' + dateStr + "</span></div>";
        result += '<div>Training Count: <span style="font-weight:600">' + params.data[1] + "</span></div>";
        return result;
      },
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
      left: "20px",
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
        borderWidth: 1
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

  // 渲染
  return (
    <div className={styles.container}>
      {/* 第一行：文本和下拉选择 */}
      <div className={styles.headerRow}>
        <Text className={styles.describeText}>
          A total of{" "}
          <span className={styles.infoText}>
            {yearStats.totalRecordCount}
          </span>{" "}trainings were completed, lasting{" "}
          <span className={styles.infoText}>
            {yearStats.totalDuration}
          </span>{" "}in total, with an average accuracy of{" "}
          <span className={styles.infoText}>
            {yearStats.averageAccuracy}
          </span>, in
        </Text>
        <Dropdown
          id="year-dropdown"
          className={styles.dropdown}
          listbox={{ className: styles.dropdownListbox }}
          value={selectedYear}
          selectedOptions={[selectedYear]}
          onOptionSelect={(_, data) => {
            if (data.optionValue) {
              setSelectedYear(data.optionValue);
            }
          }}
        >
          {allYears.map((year) => (
            <Option
              key={year}
              value={year.toString()}
              className={styles.dropdownOption}
              checkIcon={null}
            >
              {year.toString()}
            </Option>
          ))}
        </Dropdown>
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
            cursor: "default",
          }}
        />
      </div>
      {/* 第三行：底部文本 */}
      <div className={styles.statsContainer}>
        {/* 第一行 */}
        <div className={styles.statsHeaderCell}>
          <Text>Training dataset:</Text>
        </div>
        {statsData.map((dataset, index) => (
          <div key={`name-${index}`} className={styles.statsCell}>
            <Text>{dataset.datasetName}</Text>
          </div>
        ))}

        {/* 第二行 */}
        <div className={styles.statsHeaderCell}>
          <Text>Lesson progress:</Text>
        </div>
        {statsData.map((dataset, index) => (
          <div key={`progress-${index}`} className={styles.statsCell}>
            <Text>{dataset.lessonProgress}</Text>
          </div>
        ))}

        {/* 第三行 */}
        <div className={styles.statsHeaderCell}>
          <Text>Total training count:</Text>
        </div>
        {statsData.map((dataset, index) => (
          <div key={`count-${index}`} className={styles.statsCell}>
            <Text>{dataset.totalRecordCount}</Text>
          </div>
        ))}

        {/* 第四行 */}
        <div className={styles.statsHeaderCell}>
          <Text>Total training time:</Text>
        </div>
        {statsData.map((dataset, index) => (
          <div key={`duration-${index}`} className={styles.statsCell}>
            <Text>{dataset.totalDuration}</Text>
          </div>
        ))}

        {/* 第五行 */}
        <div className={styles.statsHeaderCell}>
          <Text>Average accuracy:</Text>
        </div>
        {statsData.map((dataset, index) => (
          <div key={`accuracy-${index}`} className={styles.statsCell}>
            <Text>{dataset.averageAccuracy}</Text>
          </div>
        ))}
      </div>
    </div>
  );
};