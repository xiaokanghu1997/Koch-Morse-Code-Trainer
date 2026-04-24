import { 
  Text, 
  Dropdown,
  Option,
  makeStyles,
  mergeClasses,
  tokens
} from "@fluentui/react-components";
import { ChevronDown16Regular } from "@fluentui/react-icons";
import { StatisticsChart } from "../components/StatisticsChart";
import { useState, useEffect, useMemo } from "react";
import { useLessonManager } from "../hooks/useLessonManager";
import { useStatisticalToolset } from "../hooks/useStatisticalToolset";
import { useGeneratorStore } from "../stores/generatorStore";
import { useTrainingStore } from "../stores/trainingStore";
import { useSettingsStore } from "../stores/settingsStore";

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
    "& .fui-Dropdown__expandIcon": {
      transition: "transform 200ms ease",
      transformOrigin: "center",
    },
    "& .fui-Dropdown__button[aria-expanded='true'] .fui-Dropdown__expandIcon": {
      transform: "perspective(1px) scaleY(-1)",
    },
  },
  dropdownDataset: {
    minWidth: "120px",
    maxWidth: "120px",
  },
  dropdownLesson: {
    minWidth: "100px",
    maxWidth: "100px",
  },
  dropdownStatType: {
    minWidth: "90px",
    maxWidth: "90px",
  },
  dropdownListboxBase: {
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground4,
  },
  dropdownListboxWithHeight: {
    height: "166px",
  },
  dropdownListboxDataset: {
    minWidth: "120px",
    maxWidth: "120px",
  },
  dropdownListboxLesson: {
    minWidth: "100px",
    maxWidth: "100px",
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
});

const statTypeOptions = ["Default", "Hour", "Day", "Month", "Year"];

// 工具函数：计算图例位置
const calculateLegendPosition = (avgAccuracy: number) => {
  if (avgAccuracy === 100) {
    return { legendLoc2: "348px", legendLoc3: "512px" };
  } else if (avgAccuracy >= 10 && avgAccuracy < 100) {
    return { legendLoc2: "340.5px", legendLoc3: "504.5px" };
  } else {
    return { legendLoc2: "333px", legendLoc3: "497px" };
  }
};

// 工具函数：计算右侧Y轴最大值
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

export const StatisticsPage = () => {
  // 使用样式
  const styles = useStyles();

  // 获取统计工具集
  const statisticalToolset = useStatisticalToolset();

  // 获取主题设置
  const theme = useSettingsStore((state) => state.theme);

  // 获取当前数据集
  const currentDatasetName = useGeneratorStore((state) => state.savedConfig.datasetName);

  // 获取全局训练记录
  const globalRecords = useTrainingStore((state) => state.globalRecords);

  // 获取有训练记录的数据集
  const availableDatasets = useMemo(() => {
    return Object.keys(globalRecords.datasets).filter(
      (datasetName) => globalRecords.datasets[datasetName].recordCount > 0
    );
  }, [globalRecords]);

  // 初始化 selectedDataset 时使用第一个有记录的数据集
  const [selectedDataset, setSelectedDataset] = useState<string>(currentDatasetName);

  // 初始化 selectedLesson
  const [selectedLesson, setSelectedLesson] = useState<number>(0);
  
  // 定义统计类型选项
  const [selectedStatType, setSelectedStatType] = useState<string>("Default");

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

      const lessonDisplayTexts = allLessonNumbers.map(lessonNumber => {
        const lesson = lessons.find(l => l.lessonNumber === lessonNumber);
        return lesson?.displayText || lessonNumber.toString().padStart(2, "0");
      });

      const maxRecordCount = Math.max(...result.lessons.map(l => l.recordCount));
      const yRightMax = calculateYRightMax(maxRecordCount);
      const { legendLoc2, legendLoc3 } = calculateLegendPosition(result.datasetAverageAccuracy);

      return {
        chartType: true,
        xLabel: "Lesson ID",
        xTickValues: allLessonNumbers.map(n => n.toString().padStart(2, "0")),
        xValues: result.lessons.map(l => l.lessonNumber.toString()),
        yLeftValues: result.lessons.map(l => l.averageAccuracy.toFixed(2)),
        yRightLabel: "Training Count",
        yRightUnit: "",
        yRightMax: yRightMax,
        yRightValues: result.lessons.map(l => l.recordCount.toString()),
        averageAccuracy: result.datasetAverageAccuracy.toFixed(2),
        legendLoc2: legendLoc2,
        legendLoc3: legendLoc3,
        lessonDisplayTexts: lessonDisplayTexts,
      };
    }

    // 情况2：选择了具体课程
    const timeStatsResult = statisticalToolset.getTimeStats(selectedStatType.toLowerCase(), {
      datasetName: selectedDataset,
      lessonNumber: selectedLesson,
    });

    let yRightLabel = "";
    let yRightUnit = "";
    let yRightMax = 10;
    let yRightValues = [];

    if (selectedStatType === "Default") {
      yRightLabel = "Training Duration";
      yRightUnit = " (m)";
      yRightValues = timeStatsResult.totalDurations.map(d => d.toFixed(2));
      yRightMax = 10;
    } else {
      yRightLabel = "Training Count";
      yRightUnit = "";
      yRightValues = timeStatsResult.recordCounts.map(c => c.toString());
      const maxRecordCount = Math.max(...timeStatsResult.recordCounts);
      yRightMax = calculateYRightMax(maxRecordCount);
    }

    const { legendLoc2, legendLoc3 } = calculateLegendPosition(timeStatsResult.overallAverageAccuracy);

    return {
      chartType: false,
      xLabel: "",
      xTickValues: timeStatsResult.timeLabels,
      xValues: timeStatsResult.timeTickLabels,
      yLeftValues: timeStatsResult.averageAccuracies.map(a => a.toFixed(2)),
      yRightLabel: yRightLabel,
      yRightUnit: yRightUnit,
      yRightMax: yRightMax,
      yRightValues: yRightValues,
      averageAccuracy: timeStatsResult.overallAverageAccuracy.toFixed(2),
      legendLoc2: legendLoc2,
      legendLoc3: legendLoc3,
    };
  }, [
    statisticalToolset,
    selectedDataset,
    selectedLesson,
    selectedStatType,
    totalLessonNumber
  ]);

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
            expandIcon={<ChevronDown16Regular />}
            listbox={{ 
              className: mergeClasses(
                styles.dropdownListboxBase, 
                styles.dropdownListboxDataset,
                availableDatasets.length >= 5 && styles.dropdownListboxWithHeight
              ) 
            }}
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
            expandIcon={<ChevronDown16Regular />}
            listbox={{ 
              className: mergeClasses(
                styles.dropdownListboxBase, 
                styles.dropdownListboxLesson,
                availableLessons.length >= 5 && styles.dropdownListboxWithHeight
              ) 
            }}
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
              expandIcon={<ChevronDown16Regular />}
              listbox={{ 
                className: mergeClasses(
                  styles.dropdownListboxBase, 
                  styles.dropdownListboxStatType,
                  statTypeOptions.length >= 5 && styles.dropdownListboxWithHeight
                ) 
              }}
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
      <StatisticsChart
        chartData={chartData}
        theme={theme}
      />
    </div>
  );
};