import { 
  Text, 
  Dropdown,
  Option,
  makeStyles,
  mergeClasses,
  tokens
} from "@fluentui/react-components";
import { CalendarHeatmap } from "../components/CalendarHeatmap";
import { useState, useMemo } from "react";
import { useStatisticalToolset } from "../hooks/useStatisticalToolset";
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
      </div>

      {/* 第二行：图表区域 */}
      <CalendarHeatmap
        calendarData={calendarData}
        selectedYear={selectedYear}
        theme={theme}
      />
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