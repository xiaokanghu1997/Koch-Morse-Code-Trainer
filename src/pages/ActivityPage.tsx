import { 
  Text, 
  Dropdown,
  Option,
  ToggleButton,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens
} from "@fluentui/react-components";
import { 
  ChevronDown16Regular,
  ContentView20Filled,
  ContentView20Regular,
  Quiz20Filled,
  Quiz20Regular,
  Certificate20Filled,
  Certificate20Regular,
  bundleIcon,
} from "@fluentui/react-icons";
import { CalendarHeatmap } from "../components/CalendarHeatmap";
import type { CalendarHeatmapTexts } from "../lib/types";
import { useState, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import {
  getAllYears,
  getYearOverviewStats,
  getCalendarHeatmapData,
  getOverviewStats,
  getBasicsStats,
  getAdvancedStats,
  getActivityStats,
  formatDuration,
} from "../services/statisticalToolset";
import { useBasicsStore } from "../stores/basicsStore";
import { useAdvancedStore } from "../stores/advancedStore";
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
    justifyContent: "space-between",
    marginTop: "-5px",
  },
  infoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
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
    marginRight: "-2px",
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
  dropdownListbox: {
    minWidth: "80px",
    maxWidth: "80px",
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground4,
  },
  dropdownListboxWithHeight: {
    height: "166px",
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
  buttonContainer: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  toggleButton: {
    minWidth: "32px",
    height: "32px",
    border: "none",
    transform: "translateY(1.2px)",
    boxShadow: tokens.shadow2,
    fontWeight: tokens.fontWeightRegular,
    backgroundColor: tokens.colorNeutralBackground3,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground3Pressed,
    },
    "&:disabled": {
      cursor: "not-allowed",
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorNeutralForegroundDisabled,
    },
  },
  tooltip: {
    backgroundColor: tokens.colorNeutralBackground3Hover,
    boxShadow: tokens.shadow2,
  },
  // 第二行
  chartContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    height: "72px",
  },
  // 第三行
  statsContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    overflow: "hidden",
  },
  statsOverview: {
    display: "grid",
    gap: "2px",
    marginTop: "-2px",
    marginLeft: "32px",
    overflow: "hidden",
    alignContent: "space-between",
  },
  statsBasics: {
    display: "grid",
    gap: "2px",
    marginTop: "-2px",
    overflow: "hidden",
    alignContent: "space-between",
  },
  statsAdvanced: {
    display: "grid",
    gap: "2px",
    marginTop: "-2px",
    marginLeft: "32px",
    overflow: "hidden",
    alignContent: "space-between",
  },
  verticalDivider: {
    width: "2px",
    alignSelf: "stretch",
    backgroundColor: tokens.colorNeutralStroke2,
    flexShrink: 0,
    marginRight: "20px",
  },
  statsActivity: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "2px",
    marginTop: "-2px",
    overflow: "hidden",
    width: "255px",
    alignContent: "space-between",
  },
  statsCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    fontSize: tokens.fontSizeBase300,
  },
});

const Overview = bundleIcon(ContentView20Filled, ContentView20Regular);
const Basics = bundleIcon(Quiz20Filled, Quiz20Regular);
const Advanced = bundleIcon(Certificate20Filled, Certificate20Regular);

export const ActivityPage = () => {
  // 使用样式
  const styles = useStyles();

  // 使用 i18n 获取翻译函数
  const { t } = useTranslation();
  // 从设置存储中获取当前语言
  const { language } = useSettingsStore();

  // 当前数据显示状态
  const [activeView, setActiveView] = useState<"overview" | "basics" | "advanced">("overview");

  // 获取训练记录数据
  const basicsData = useBasicsStore((state) => state.datasets);
  const advancedWord = useAdvancedStore((state) => state.word);
  const advancedCallsign = useAdvancedStore((state) => state.callsign);
  const advancedQTC = useAdvancedStore((state) => state.qtc);

  const allBasicsRecords = useMemo(() => {
    return Object.values(basicsData).flatMap(dataset =>
      Object.values(dataset).flatMap(lesson => lesson)
    );
  }, [basicsData]);
  const allAdvancedRecords = useMemo(() => {
    return [...advancedWord, ...advancedCallsign, ...advancedQTC];
  }, [advancedWord, advancedCallsign, advancedQTC]);

  // 获取所有年份
  const allYears = useMemo(() => {
    const combined = [...allBasicsRecords, ...allAdvancedRecords];
    const years = getAllYears(combined);
    return years.length > 0 ? years : [new Date().getFullYear()];
  }, [allBasicsRecords, allAdvancedRecords]);

  // 选中的年份（默认当前年份）
  const [selectedYear, setSelectedYear] = useState<string>(
    allYears[allYears.length - 1]?.toString() || "2025"
  );

  // 根据当前视图筛选记录
  const currentViewRecords = useMemo(() => {
    return activeView === "overview"
      ? [...allBasicsRecords, ...allAdvancedRecords]
      : activeView === "basics"
      ? allBasicsRecords
      : allAdvancedRecords;
  }, [activeView, allBasicsRecords, allAdvancedRecords]);

  // 顶部统计信息
  const trainingType =
    activeView === "basics"
      ? t("activity.summary.types.basics")
      : activeView === "advanced"
      ? t("activity.summary.types.advanced")
      : "";

  const yearStats = useMemo(() => {
    const stats = getYearOverviewStats(currentViewRecords, parseInt(selectedYear));
    return {
      totalRecordCount: stats.totalRecordCount,
      totalDuration: formatDuration(stats.totalDuration),
    };
  }, [currentViewRecords, selectedYear]);

  // 日历热力数据
  const heapmapData = useMemo(() => {
    return getCalendarHeatmapData(currentViewRecords, parseInt(selectedYear));
  }, [currentViewRecords, selectedYear]);

  // 热力图文本
  const heatmapTexts = t("activity.heatmap", {
    returnObjects: true,
  }) as CalendarHeatmapTexts;

  // 底部统计数据
  const overviewStats = useMemo(() => 
    getOverviewStats(
      basicsData,
      { word: advancedWord, callsign: advancedCallsign, qtc: advancedQTC },
      parseInt(selectedYear)
    ),
    [basicsData, advancedWord, advancedCallsign, advancedQTC, selectedYear]
  );
  const basicsStats = useMemo(() => 
    getBasicsStats(basicsData, parseInt(selectedYear)),
    [basicsData, selectedYear]
  );
  const advancedStats = useMemo(() => 
    getAdvancedStats(
      { word: advancedWord, callsign: advancedCallsign, qtc: advancedQTC },
      parseInt(selectedYear)
    ),
    [advancedWord, advancedCallsign, advancedQTC, selectedYear]
  );
  const activityStats = useMemo(() => {
    return getActivityStats(currentViewRecords, parseInt(selectedYear));
    }, [currentViewRecords, selectedYear]
  );

  // 布局信息
  const dividerMarginLeft = useMemo(() => {
    if (language === "English") {
      if (activeView === "overview") return "-30px";
      if (activeView === "basics") return "5px";
      return "-25px";
    } else {
      if (activeView === "overview") return "-45px";
      if (activeView === "basics") return "-12px";
      return "-25px";      
    }
  }, [activeView]);

  const activityStatsWidth = useMemo(() => {
    if (language === "English") {
      if (activeView === "overview") return "240px";
      if (activeView === "basics") return "190px";
      return "245px";
    } else {
      if (activeView === "overview") return "245px";
      if (activeView === "basics") return "195px";
      return "230px";      
    }
  }, [activeView]);

  const activityStatsGridTemplate = useMemo(() => {
    if (language === "English") {
      if (activeView === "overview") return "140px 1fr";
      if (activeView === "basics") return "110px 1fr";
      return "120px 1fr";
    } else {
      if (activeView === "overview") return "140px 1fr";
      if (activeView === "basics") return "120px 1fr";
      return "125px 1fr";      
    }
  }, [activeView]);

  // 渲染
  return (
    <div className={styles.container}>
      {/* 第一行：文本和下拉选择 */}
      <div className={styles.headerRow}>
        <div className={styles.infoContainer}>
          <Text className={styles.describeText}>{t("activity.summary.info1")}</Text>
          <Dropdown
            id="year-dropdown"
            className={styles.dropdown}
            expandIcon={<ChevronDown16Regular />}
            listbox={{ 
              className: mergeClasses(
                styles.dropdownListbox,
                allYears.length >= 5 && styles.dropdownListboxWithHeight
              )
            }}
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
          <Text className={styles.describeText}>
            <Trans
              i18nKey="activity.summary.info2"
              values={{ count: yearStats.totalRecordCount, type: trainingType, duration: yearStats.totalDuration }}
              components={{ num: <span className={styles.infoText} /> }}
            />
          </Text>
        </div>
        <div className={styles.buttonContainer}>
          <Tooltip
            content={{
              children: t("activity.views.overview"),
              className: styles.tooltip,
            }}
            relationship="label"
            positioning="below-end"
          >
            <ToggleButton
              className={styles.toggleButton}
              appearance="transparent"
              icon={<Overview />}
              checked={activeView === "overview"}
              onClick={() => setActiveView("overview")}
            />
          </Tooltip>
          <Tooltip
            content={{
              children: t("activity.views.basics"),
              className: styles.tooltip,
            }}
            relationship="label"
            positioning="below-end"
          >
            <ToggleButton
              className={styles.toggleButton}
              appearance="transparent"
              icon={<Basics />}
              checked={activeView === "basics"}
              onClick={() => setActiveView("basics")}
            />
          </Tooltip>
          <Tooltip
            content={{
              children: t("activity.views.advanced"),
              className: styles.tooltip,
            }}
            relationship="label"
            positioning="below-end"
          >
            <ToggleButton
              className={styles.toggleButton}
              appearance="transparent"
              icon={<Advanced />}
              checked={activeView === "advanced"}
              onClick={() => setActiveView("advanced")}
            />
          </Tooltip>
        </div>
      </div>

      {/* 第二行：图表区域 */}
      <div className={styles.chartContainer}>
        <CalendarHeatmap
          days={heapmapData.days}
          todayCount={heapmapData.todayCount}
          texts={heatmapTexts}
        />
      </div>
      {/* 第三行：底部文本 */}
      <div className={styles.statsContainer}>
        {/* 左侧表格信息 */}
        {activeView === "overview" && (
          <div 
            className={styles.statsOverview}
            style={{ 
              width: language === "English" ? "410px" : "390px",
              gridTemplateColumns: language === "English" ? "170px 1fr 1fr" : "145px 1fr 1fr" 
            }}
          >
            <div className={styles.statsCell}><Text>{t("activity.stats.trainingType")}</Text></div>
            <div className={styles.statsCell}><Text>{t("activity.stats.basics")}</Text></div>
            <div className={styles.statsCell}><Text>{t("activity.stats.advanced")}</Text></div>
            <div className={styles.statsCell}><Text>{t("activity.stats.totalCount")}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.basics.totalRecordCount}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.advanced.totalRecordCount}</Text></div>
            <div className={styles.statsCell}><Text>{t("activity.stats.totalTime")}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.basics.totalDuration}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.advanced.totalDuration}</Text></div>
            <div className={styles.statsCell}><Text>{t("activity.stats.averageAccuracy")}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.basics.averageAccuracy}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.advanced.averageAccuracy}</Text></div>
            <div className={styles.statsCell}><Text>{t("activity.stats.bestScore")}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.basics.bestScore}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.advanced.bestScore}</Text></div>
          </div>
        )}
        {activeView === "basics" && (
          <div 
            className={styles.statsBasics}
            style={{ 
              width: language === "English" ? "520px" : "500px",
              gridTemplateColumns: language === "English" ? "140px 1fr 1fr 1fr 1fr" : "120px 1fr 1fr 1fr 1fr" 
            }}
          >
            <div className={styles.statsCell}><Text>{t("activity.stats.trainingDataset")}</Text></div>
            {basicsStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{t(`activity.basicsDatasets.${d.datasetName}`)}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>{t("activity.stats.lessonProgress")}</Text></div>
            {basicsStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.lessonProgress}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>{t("activity.stats.totalCount")}</Text></div>
            {basicsStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.totalRecordCount}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>{t("activity.stats.totalTime")}</Text></div>
            {basicsStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.totalDuration}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>{t("activity.stats.averageAccuracy")}</Text></div>
            {basicsStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.averageAccuracy}</Text></div>
            ))}
          </div>
        )}
        {activeView === "advanced" && (
          <div 
            className={styles.statsAdvanced}
            style={{ 
              width: language === "English" ? "490px" : "435px",
              gridTemplateColumns: language === "English" ? "160px 1fr 1fr 1fr" : "125px 1fr 1fr 1fr" 
            }}
          >
            <div className={styles.statsCell}><Text>{t("activity.stats.trainingType")}</Text></div>
            {advancedStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{t(`activity.advancedTypes.${d.trainingType}`)}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>{t("activity.stats.totalCount")}</Text></div>
            {advancedStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.totalRecordCount}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>{t("activity.stats.totalTime")}</Text></div>
            {advancedStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.totalDuration}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>{t("activity.stats.bestScore")}</Text></div>
            {advancedStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.bestScore}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>{t("activity.stats.maxSpeed")}</Text></div>
            {advancedStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.maxSpeed}</Text></div>
            ))}
          </div>
        )}

        {/* 中间分割线 */}
        <div 
          className={styles.verticalDivider}
          style={{ marginLeft: dividerMarginLeft }}
        />

        {/* 右侧活动统计信息 */}
        <div 
          className={styles.statsActivity}
          style={{ width: activityStatsWidth, gridTemplateColumns: activityStatsGridTemplate }}
        >
          <div className={styles.statsCell}><Text>{t("activity.stats.trainingDays")}</Text></div>
          <div className={styles.statsCell}><Text>{activityStats.activeDays}</Text></div>
          <div className={styles.statsCell}><Text>{t("activity.stats.bestStreak")}</Text></div>
          <div className={styles.statsCell}><Text>{activityStats.bestStreak}</Text></div>
          <div className={styles.statsCell}><Text>{t("activity.stats.currentStreak")}</Text></div>
          <div className={styles.statsCell}><Text>{activityStats.currentStreak}</Text></div>
          <div className={styles.statsCell}><Text>{t("activity.stats.lastSession")}</Text></div>
          <div className={styles.statsCell}><Text>{activityStats.lastSessionDate}</Text></div>
        </div>
      </div>
    </div>
  );
};