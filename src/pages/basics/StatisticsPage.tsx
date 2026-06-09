import { 
  Text, 
  Dropdown,
  Option,
  makeStyles,
  mergeClasses,
  tokens
} from "@fluentui/react-components";
import { ChevronDown16Regular } from "@fluentui/react-icons";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TimeStatType } from "../../lib/types";
import { StatisticsChart } from "../../components/StatisticsChart";
import { useLessonManager } from "../../hooks/useLessonManager";
import { useOptionsStore } from "../../stores/optionsStore";
import { useBasicsStore } from "../../stores/basicsStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { getTimeStats, getLessonStatsForDataset } from "../../services/statisticalToolset";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    padding: "12px 15px",
    boxSizing: "border-box",
    overflow: "hidden",
    gap: "6px",
  },
  // 第一行
  headerRow: {
    display: "flex",
    alignItems: "center",
    marginTop: "-7px",
    gap: "16px",
  },
  selectContainer: {
    display: "flex",
    alignItems: "center",
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
    backgroundColor: tokens.colorNeutralBackground4,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground4Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground4Pressed,
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
    backgroundColor: tokens.colorNeutralBackground5,
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
    backgroundColor: tokens.colorNeutralBackground5,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground5Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground5Pressed,
    },
    "&[aria-selected='true']": {
      backgroundColor: tokens.colorNeutralBackground5Selected,
    },
    "&[aria-selected='true']:hover": {
      backgroundColor: tokens.colorNeutralBackground4Hover,
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
  chartRow: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    display: "flex",
  },
});

const statTypeOptions = ["Default", "Hour", "Day", "Month", "Year"];

export const StatisticsPage = () => {
  // 使用样式
  const styles = useStyles();

  // 使用 i18n 获取翻译函数
  const { t } = useTranslation();

  // 获取设置内容
  const { language } = useSettingsStore();

  // 获取当前数据集
  const currentDatasetName = useOptionsStore((state) => state.savedConfig.datasetName);

  // 获取基础训练记录数据
  const datasets = useBasicsStore((state) => state.datasets);

  // 获取有训练记录的数据集
  const availableDatasets = useMemo(() => {
    return Object.keys(datasets).filter((datasetName) => {
      const dataset = datasets[datasetName];
      return Object.values(dataset).some(
        (lesson) => lesson.length > 0
      );
    });
  }, [datasets]);

  // 初始化 selectedDataset 时使用第一个有记录的数据集
  const [selectedDataset, setSelectedDataset] = useState<string>(() => {
    if (availableDatasets.includes(currentDatasetName)) {
      return currentDatasetName;
    } 
    return availableDatasets[0] || currentDatasetName;
  });

  // 初始化 selectedLesson
  const [selectedLesson, setSelectedLesson] = useState<number>(0);
  
  // 定义统计类型选项
  const [selectedStatType, setSelectedStatType] = useState<string>("Default");

  // 获取课程列表
  const { lessons, totalLessonNumber } = useLessonManager(selectedDataset, selectedLesson);

  // 获取数据集显示名称
  const getDatasetLabel = (name: string) => {
    const key = `basics.statistics.datasetName.${name.toLowerCase()}`;
    return t(key, { defaultValue: name }); // 找不到翻译时回退到原名
  };

  // 筛选出有记录的课程，并添加 All 选项
  const availableLessons = useMemo(() => {
    const dataset = datasets[selectedDataset];
    if (!dataset) {
      return [];
    }
    // 获取有记录的课程编号
    const lessonsWithRecords = lessons.filter((lesson) => {
      const lessonData = dataset[lesson.lessonNumber];
      return lessonData && lessonData.length > 0;
    });
    // 添加 "All" 选项
    return [
      { lessonNumber: 0, characters: [], displayText: t("basics.statistics.allLessons") },
      ...lessonsWithRecords,
    ];
  }, [datasets, selectedDataset, lessons]);

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
    // 图例内容
    const legendLabels = [
      t("basics.statistics.chart.accuracy"),
      t("basics.statistics.chart.averageAccuracy"),
      t("basics.statistics.chart.accuracyThreshold")
    ];

    // 情况1：选择了所有课程
    if (selectedLesson === 0) {
      const result = getLessonStatsForDataset(datasets, selectedDataset);
      const maxLessonNumber = result.lessons.length > 0 ? Math.max(...result.lessons.map(l => l.lessonNumber)) : 1;

      const maxLessonNumbers = Array.from({ length: maxLessonNumber }, (_, i) => i + 1);
      const allLessonNumbers = Array.from({ length: totalLessonNumber }, (_, i) => i + 1);

      const lessonDataMap = new Map(result.lessons.map(l => [l.lessonNumber, l]));
      const xValues = maxLessonNumbers.map(n => n.toString());
      const yLeftValues = maxLessonNumbers.map(n => {
        const lessonData = lessonDataMap.get(n);
        return lessonData ? lessonData.averageAccuracy : null;
      });
      const yRightValues = maxLessonNumbers.map(n => {
        const lessonData = lessonDataMap.get(n);
        return lessonData ? lessonData.recordCount : null;
      });

      const lessonDisplayTexts = allLessonNumbers.map(lessonNumber => {
        const lesson = lessons.find(l => l.lessonNumber === lessonNumber);
        return lesson?.displayText || lessonNumber.toString().padStart(2, "0");
      });

      return {
        chartType: true,
        xLabel: t("basics.statistics.chart.lessonId"),
        xTickValues: allLessonNumbers.map(n => n.toString().padStart(2, "0")),
        xValues: xValues,
        yLeftLabel: t("basics.statistics.chart.trainingAccuracy"),
        yLeftValues: yLeftValues,
        yRightLabel: t("basics.statistics.chart.trainingCount"),
        yRightUnit: "",
        yRightValues: yRightValues,
        averageAccuracy: result.datasetAverageAccuracy,
        legendLabels: legendLabels,
        lessonDisplayFlag: t("basics.statistics.chart.lessonId"),
        lessonDisplayTitle: t("basics.statistics.chart.lessonPrefix"),
        lessonDisplayTexts: lessonDisplayTexts,
      };
    } else {
      // 情况2：选择了具体课程
      const dataset = datasets[selectedDataset];
      const lessonRecords = dataset?.[selectedLesson] || [];
      const timeStatsResult = getTimeStats(
        lessonRecords,
        selectedStatType.toLowerCase() as TimeStatType
      );

      let yRightLabel = "";
      let yRightUnit = "";
      let yRightValues = [];

      if (selectedStatType === "Default") {
        yRightLabel = t("basics.statistics.chart.trainingDuration");
        yRightUnit = t("basics.statistics.chart.durationUnit");
        yRightValues = timeStatsResult.totalDurations;
      } else {
        yRightLabel = t("basics.statistics.chart.trainingCount");
        yRightUnit = "";
        yRightValues = timeStatsResult.recordCounts;
      }

      return {
        chartType: false,
        xLabel: "",
        xTickValues: timeStatsResult.timeLabels,
        xValues: timeStatsResult.timeTickLabels,
        yLeftLabel: t("basics.statistics.chart.trainingAccuracy"),
        yLeftValues: timeStatsResult.averageAccuracies,
        yRightLabel: yRightLabel,
        yRightUnit: yRightUnit,
        yRightValues: yRightValues,
        averageAccuracy: timeStatsResult.overallAverageAccuracy,
        legendLabels: legendLabels,
      };
    }
  }, [
    datasets,
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
        <div 
          className={styles.selectContainer}
          style={{ gap: language === "English" ? "8px" : "0px" }}
        >
          <Text className={styles.describeText}>{t("basics.statistics.selectDataset")}</Text>
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
            value={getDatasetLabel(selectedDataset)}
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
                {getDatasetLabel(dataset)}
              </Option>
            ))}
          </Dropdown>
        </div>
        <div 
          className={styles.selectContainer}
          style={{ gap: language === "English" ? "8px" : "0px" }}
        >
          <Text className={styles.describeText}>{t("basics.statistics.selectLesson")}</Text>
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
          <div 
            className={styles.selectContainer}
            style={{ gap: language === "English" ? "8px" : "0px" }}
          >
            <Text className={styles.describeText}>{t("basics.statistics.statisticBy")}</Text>
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
              value={t(`basics.statistics.statTypes.${selectedStatType.toLowerCase()}`)}
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
                  {t(`basics.statistics.statTypes.${statType.toLowerCase()}`)}
                </Option>
              ))}
            </Dropdown>
          </div>
        )}
      </div>

      {/* 第二行：图表区域 */}
      <div className={styles.chartRow}>
        <StatisticsChart chartData={chartData} />
      </div>
    </div>
  );
};