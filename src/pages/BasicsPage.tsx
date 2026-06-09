import { 
  TabList,
  Tab,
  makeStyles,
  mergeClasses,
  tokens
} from "@fluentui/react-components";
import {
  Voicemail20Filled,
  Voicemail20Regular,
  DataHistogram20Filled,
  DataHistogram20Regular,
  ContentSettings20Filled,
  ContentSettings20Regular,
  bundleIcon,
} from "@fluentui/react-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TrainingPage } from "./basics/TrainingPage";
import { StatisticsPage } from "./basics/StatisticsPage";
import { OptionsPage } from "./basics/OptionsPage";
import { useSettingsStore } from "../stores/settingsStore";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "0px",
  },
  tabListContainer: {
    display: "flex",
    alignItems: "center",
    marginTop: "-2px",
  },
  tabList: {
    display: "flex",
    width: "100%",
    backgroundColor: "transparent",
  },
  tab: {
    height: "32px",
    padding: "0px",
    backgroundColor: "transparent",
    border: `1.5px solid transparent`,
    borderBottom: "none",
    borderTopLeftRadius: tokens.borderRadiusMedium,
    borderTopRightRadius: tokens.borderRadiusMedium,
    borderBottomLeftRadius: "0px",
    borderBottomRightRadius: "0px",
    gap: "4px",
    ":hover:not([aria-selected='true'])": {
      backgroundColor: "transparent",
      "& span": {
        color: `${tokens.colorNeutralForeground1} !important`,
        fontWeight: `${tokens.fontWeightRegular} !important`,
      },
    },
    ":active:not([aria-selected='true'])": {
      backgroundColor: "transparent",
      "& span": {
        color: `${tokens.colorNeutralForeground1} !important`,
        fontWeight: `${tokens.fontWeightRegular} !important`,
      },
    },
    "&[aria-selected='true']": {
      padding: "0px",
      backgroundColor: tokens.colorNeutralBackground3,
      border: `1.5px solid ${tokens.colorNeutralStrokeOnBrand}`,
      borderBottom: "none",
      ":hover": {
        backgroundColor: tokens.colorNeutralBackground3,
      },
      "& span": {
        color: `${tokens.colorNeutralForeground1} !important`,
        fontWeight: `${tokens.fontWeightRegular} !important`,
      },
      "& svg": {
        color: `${tokens.colorBrandForeground1} !important`,
      },
    },
    "& span": {
      color: `${tokens.colorNeutralForeground3} !important`,
      fontWeight: `${tokens.fontWeightRegular} !important`,
    },
    "::before": {
      display: "none",
    },
    "::after": {
      display: "none",
    },
  },
  tabContentOffsetEn: {
    "& .fui-Tab__content": {
      marginBottom: "2.5px",
    },
  },
  tabContentOffsetZh: {
    "& .fui-Tab__content": {
      marginBottom: "1.5px",
    },
  },
  tabContent: {
    flex: 1,
    display: "flex",
    marginTop: "-1.5px",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colorNeutralBackground3,
    borderTopRightRadius: tokens.borderRadiusMedium,
    borderBottomLeftRadius: tokens.borderRadiusMedium,
    borderBottomRightRadius: tokens.borderRadiusMedium,
    border: `1.5px solid ${tokens.colorNeutralStrokeOnBrand}`,
  },
  tabContentFirstTab: {
    borderTopLeftRadius: "0px",
  },
  tabContentOtherTabs: {
    borderTopLeftRadius: tokens.borderRadiusMedium,
  },
});

// 图标定义
const TrainingIcon = bundleIcon(Voicemail20Filled, Voicemail20Regular);
const StatisticsIcon = bundleIcon(DataHistogram20Filled, DataHistogram20Regular);
const OptionsIcon = bundleIcon(ContentSettings20Filled, ContentSettings20Regular);

// 类型定义
type TabValue = "training" | "statistics" | "options";

export const BasicsPage = () => {
  // 使用样式
  const styles = useStyles();
  // 使用 i18n 获取翻译函数
  const { t } = useTranslation();
  // 从设置存储中获取当前语言
  const { language } = useSettingsStore();
  // 状态定义
  const [selectedTab, setSelectedTab] = useState<TabValue>("training");

  return (
    <div className={styles.container}>
      {/* TabList */}
      <div className={styles.tabListContainer}>
        <TabList
          className={styles.tabList}
          selectedValue={selectedTab}
          onTabSelect={(_, data) => setSelectedTab(data.value as TabValue)}
        >
          <Tab
            className={mergeClasses(
              styles.tab,
              language === "English" ? styles.tabContentOffsetEn : styles.tabContentOffsetZh
            )}
            style={{ width: language === "English" ? "120px" : "100px" }}
            icon={<TrainingIcon />}
            value="training"
          >
            {t("basics.tabs.training")}
          </Tab>
          <Tab
            className={mergeClasses(
              styles.tab,
              language === "English" ? styles.tabContentOffsetEn : styles.tabContentOffsetZh
            )}
            style={{ width: language === "English" ? "120px" : "100px" }}
            icon={<StatisticsIcon />}
            value="statistics"
          >
            {t("basics.tabs.statistics")}
          </Tab>
          <Tab
            className={mergeClasses(
              styles.tab,
              language === "English" ? styles.tabContentOffsetEn : styles.tabContentOffsetZh
            )}
            style={{ width: language === "English" ? "120px" : "100px" }}
            icon={<OptionsIcon />}
            value="options"
          >
            {t("basics.tabs.options")}
          </Tab>
        </TabList>
      </div>

      {/* Tab Content 占位符 */}
      <div 
        className={mergeClasses(
          styles.tabContent,
          selectedTab === "training" 
            ? styles.tabContentFirstTab 
            : styles.tabContentOtherTabs
        )}
      >
        {selectedTab === "training" && <TrainingPage />}
        {selectedTab === "statistics" && <StatisticsPage />}
        {selectedTab === "options" && <OptionsPage />}
      </div>
    </div>
  );
};