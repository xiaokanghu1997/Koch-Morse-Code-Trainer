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
import { useState, useMemo } from "react";
import {
  getAllYears,
  getYearOverviewStats,
  getDailyRecordCounts,
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
    backgroundColor: tokens.colorNeutralBackground4Hover,
    boxShadow: tokens.shadow2,
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
    gridTemplateColumns: "170px 1fr 1fr",
    gap: "2px",
    marginTop: "-2px",
    marginLeft: "32px",
    overflow: "hidden",
    width: "410px",
    alignContent: "space-between",
  },
  statsBasics: {
    display: "grid",
    gridTemplateColumns: "140px 1fr 1fr 1fr 1fr",
    gap: "2px",
    marginTop: "-2px",
    overflow: "hidden",
    width: "520px",
    alignContent: "space-between",
  },
  statsAdvanced: {
    display: "grid",
    gridTemplateColumns: "160px 1fr 1fr 1fr",
    gap: "2px",
    marginTop: "-2px",
    marginLeft: "32px",
    overflow: "hidden",
    width: "490px",
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

  // 获取主题设置
  const theme = useSettingsStore((state) => state.theme);

  // 当前数据显示状态
  const [activeView, setActiveView] = useState<"overview" | "basics" | "advanced">("overview");

  // 获取训练记录数据
  const basicsData = useBasicsStore((state) => state.datasets);
  const advancedWord = useAdvancedStore((state) => state.Word);
  const advancedCallsign = useAdvancedStore((state) => state.Callsign);
  const advnacedQTC = useAdvancedStore((state) => state.QTC);

  const allBasicsRecords = useMemo(() => {
    return Object.values(basicsData).flatMap(dataset =>
      Object.values(dataset).flatMap(lesson => lesson)
    );
  }, [basicsData]);
  const allAdvancedRecords = useMemo(() => {
    return [...advancedWord, ...advancedCallsign, ...advnacedQTC];
  }, [advancedWord, advancedCallsign, advnacedQTC]);

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

  // 顶部统计数据
  const yearStats = useMemo(() => {
    const records = 
      activeView === "overview" ? [...allBasicsRecords, ...allAdvancedRecords] :
      activeView === "basics" ? allBasicsRecords :
      allAdvancedRecords;
    const stats = getYearOverviewStats(records, parseInt(selectedYear));
    return {
      totalRecordCount: stats.totalRecordCount,
      totalDuration: formatDuration(stats.totalDuration),
    };
  }, [activeView, allBasicsRecords, allAdvancedRecords, selectedYear]);

  // 日历热力数据
  const calendarData = useMemo(() => {
    const records =
      activeView === "overview" ? [...allBasicsRecords, ...allAdvancedRecords] :
      activeView === "basics" ? allBasicsRecords :
      allAdvancedRecords;
    return getDailyRecordCounts(records, parseInt(selectedYear));
  }, [activeView, allBasicsRecords, allAdvancedRecords, selectedYear]);

  // 今日训练次数
  const todayCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayData = calendarData.find((date) => date[0] === today);
    return todayData ? todayData[1] : 0;
  }, [calendarData]);

  // 底部统计数据
  const overviewStats = useMemo(() => 
    getOverviewStats(
      basicsData,
      { Word: advancedWord, Callsign: advancedCallsign, QTC: advnacedQTC },
      parseInt(selectedYear)
    ),
    [basicsData, advancedWord, advancedCallsign, advnacedQTC, selectedYear]
  );
  const basicsStats = useMemo(() => 
    getBasicsStats(basicsData, parseInt(selectedYear)),
    [basicsData, selectedYear]
  );
  const advancedStats = useMemo(() => 
    getAdvancedStats(
      { Word: advancedWord, Callsign: advancedCallsign, QTC: advnacedQTC },
      parseInt(selectedYear)
    ),
    [advancedWord, advancedCallsign, advnacedQTC, selectedYear]
  );
  const activityStats = useMemo(() => {
    const records = 
      activeView === "overview" ? [...allBasicsRecords, ...allAdvancedRecords] :
      activeView === "basics" ? allBasicsRecords :
      allAdvancedRecords;
    return getActivityStats(records, parseInt(selectedYear));
    }, [activeView, allBasicsRecords, allAdvancedRecords, selectedYear]
  );

  // 渲染
  return (
    <div className={styles.container}>
      {/* 第一行：文本和下拉选择 */}
      <div className={styles.headerRow}>
        <div className={styles.infoContainer}>
          <Text className={styles.describeText}>In</Text>
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
            ,{" "}
            <span className={styles.infoText}>
              {yearStats.totalRecordCount}
            </span>{" "}training sessions were completed with a total duration of{" "}
            <span className={styles.infoText}>
              {yearStats.totalDuration}
            </span>
          </Text>
        </div>
        <div className={styles.buttonContainer}>
          <Tooltip
            content={{
              children: "Overview",
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
              children: "Basics",
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
              children: "Advanced",
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
      <CalendarHeatmap
        calendarData={calendarData}
        selectedYear={selectedYear}
        theme={theme}
        todayCount={todayCount}
      />
      {/* 第三行：底部文本 */}
      <div className={styles.statsContainer}>
        {/* 左侧表格信息 */}
        {activeView === "overview" && (
          <div className={styles.statsOverview}>
            <div className={styles.statsCell}><Text>Training type:</Text></div>
            <div className={styles.statsCell}><Text>Basics</Text></div>
            <div className={styles.statsCell}><Text>Advanced</Text></div>
            <div className={styles.statsCell}><Text>Total training count:</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.basics.totalRecordCount}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.advanced.totalRecordCount}</Text></div>
            <div className={styles.statsCell}><Text>Total training time:</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.basics.totalDuration}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.advanced.totalDuration}</Text></div>
            <div className={styles.statsCell}><Text>Average accuracy:</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.basics.averageAccuracy}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.advanced.averageAccuracy}</Text></div>
            <div className={styles.statsCell}><Text>Best training score:</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.basics.bestScore}</Text></div>
            <div className={styles.statsCell}><Text>{overviewStats.advanced.bestScore}</Text></div>
          </div>
        )}
        {activeView === "basics" && (
          <div className={styles.statsBasics}>
            <div className={styles.statsCell}><Text>Training dataset:</Text></div>
            {basicsStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.datasetName}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>Lesson progress:</Text></div>
            {basicsStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.lessonProgress}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>Total training count:</Text></div>
            {basicsStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.totalRecordCount}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>Total training time:</Text></div>
            {basicsStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.totalDuration}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>Average accuracy:</Text></div>
            {basicsStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.averageAccuracy}</Text></div>
            ))}
          </div>
        )}
        {activeView === "advanced" && (
          <div className={styles.statsAdvanced}>
            <div className={styles.statsCell}><Text>Training type:</Text></div>
            {advancedStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.trainingType}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>Total training count:</Text></div>
            {advancedStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.totalRecordCount}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>Total training time:</Text></div>
            {advancedStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.totalDuration}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>Best training score:</Text></div>
            {advancedStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.bestScore}</Text></div>
            ))}
            <div className={styles.statsCell}><Text>Max character speed:</Text></div>
            {advancedStats.map((d, i) => (
              <div key={i} className={styles.statsCell}><Text>{d.maxSpeed}</Text></div>
            ))}
          </div>
        )}

        {/* 中间分割线 */}
        <div 
          className={styles.verticalDivider}
          style={{ 
            marginLeft: 
              activeView === "overview" ? "-30px" : 
              activeView === "basics" ? "4px" : 
              "-20px"
          }}
        />

        {/* 右侧活动统计信息 */}
        <div 
          className={styles.statsActivity}
          style={{
            width:
              activeView === "overview" ? "250px" :
              activeView === "basics"   ? "190px" :
              "245px",
            gridTemplateColumns:
              activeView === "overview" ? "140px 1fr" :
              activeView === "basics"   ? "110px 1fr" :
              "120px 1fr",
          }}
        >
          <div className={styles.statsCell}><Text>Active days:</Text></div>
          <div className={styles.statsCell}><Text>{activityStats.activeDays}</Text></div>
          <div className={styles.statsCell}><Text>Best streak:</Text></div>
          <div className={styles.statsCell}><Text>{activityStats.bestStreak}</Text></div>
          <div className={styles.statsCell}><Text>Current streak:</Text></div>
          <div className={styles.statsCell}><Text>{activityStats.currentStreak}</Text></div>
          <div className={styles.statsCell}><Text>Last active day:</Text></div>
          <div className={styles.statsCell}><Text>{activityStats.lastSessionDate}</Text></div>
        </div>
      </div>
    </div>
  );
};