import { 
  TabList,
  Tab,
  makeStyles,
  mergeClasses,
  tokens
} from "@fluentui/react-components";
import {
  BookLetter20Filled,
  BookLetter20Regular,
  ContactCard20Filled,
  ContactCard20Regular,
  SlideTextMultiple20Filled,
  SlideTextMultiple20Regular,
  Trophy20Filled,
  Trophy20Regular,
  bundleIcon,
} from "@fluentui/react-icons";
import { useState } from "react";
import { 
  WordTrainingConfig, 
  CallsignTrainingConfig, 
  QTCTrainingConfig 
} from "../lib/types";
import { WordWelcome } from "./advanced/WordWelcome";
import { WordTraining } from "./advanced/WordTraining";
import { CallsignWelcome } from "./advanced/CallsignWelcome";
import { CallsignTraining } from "./advanced/CallsignTraining";
import { QTCWelcome } from "./advanced/QTCWelcome";
import { QTCTraining } from "./advanced/QTCTraining";
import { ScorePage } from "./advanced/ScorePage";

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
    width: "110px",
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
    "& .fui-Tab__content": {
      marginBottom: "2.5px",
    },
    "::before": {
      display: "none",
    },
    "::after": {
      display: "none",
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
const WordIcon = bundleIcon(BookLetter20Filled, BookLetter20Regular);
const CallsignIcon = bundleIcon(ContactCard20Filled, ContactCard20Regular);
const QTCIcon = bundleIcon(SlideTextMultiple20Filled, SlideTextMultiple20Regular);
const ScoreIcon = bundleIcon(Trophy20Filled, Trophy20Regular);

// 类型定义
type TabValue = "word" | "callsign" | "qtc" | "score";
type PageState = "welcome" | "training";

export const AdvancedPage = () => {
  // 使用样式
  const styles = useStyles();

  // 状态定义
  const [selectedTab, setSelectedTab] = useState<TabValue>("word");
  const [tabPageState, setTabPageState] = useState<Record<TabValue, PageState>>({
    word: "welcome",
    callsign: "welcome",
    qtc: "welcome",
    score: "welcome",
  });
  const [wordConfig, setWordConfig] = useState<WordTrainingConfig | null>(null);
  const [callsignConfig, setCallsignConfig] = useState<CallsignTrainingConfig | null>(null);
  const [qtcConfig, setQTCConfig] = useState<QTCTrainingConfig | null>(null);

  // 回调函数定义
  const handleWordStart = (config: WordTrainingConfig) => {
    setWordConfig(config);
    setTabPageState(prev => ({ ...prev, word: "training" }));
  }
  const handleWordBack = () => {
    setTabPageState(prev => ({ ...prev, word: "welcome" }));
    setWordConfig(null);
  }

  const handleCallsignStart = (config: CallsignTrainingConfig) => {
    setCallsignConfig(config);
    setTabPageState(prev => ({ ...prev, callsign: "training" }));
  }
  const handleCallsignBack = () => {
    setTabPageState(prev => ({ ...prev, callsign: "welcome" }));
    setCallsignConfig(null);
  }

  const handleQTCStart = (config: QTCTrainingConfig) => {
    setQTCConfig(config);
    setTabPageState(prev => ({ ...prev, qtc: "training" }));
  }
  const handleQTCBack = () => {
    setTabPageState(prev => ({ ...prev, qtc: "welcome" }));
    setQTCConfig(null);
  }

  const handleTabChange = (newTab: TabValue) => {
    if (selectedTab !== newTab) {
      // 重置之前 tab 的状态
      setTabPageState(prev => ({
        ...prev,
        [selectedTab]: "welcome"
      }));
      
      // 清理之前 tab 的配置
      if (selectedTab === "word") setWordConfig(null);
      if (selectedTab === "callsign") setCallsignConfig(null);
      if (selectedTab === "qtc") setQTCConfig(null);
    }
    setSelectedTab(newTab);
  };

  return (
    <div className={styles.container}>
      {/* TabList */}
      <div className={styles.tabListContainer}>
        <TabList
          className={styles.tabList}
          selectedValue={selectedTab}
          onTabSelect={(_, data) => handleTabChange(data.value as TabValue)}
        >
          <Tab
            className={styles.tab}
            icon={<WordIcon />}
            value="word"
          >
            Word
          </Tab>
          <Tab
            className={styles.tab}
            icon={<CallsignIcon />}
            value="callsign"
          >
            Callsign
          </Tab>
          <Tab
            className={styles.tab}
            icon={<QTCIcon />}
            value="qtc"
          >
            QTC
          </Tab>
          <Tab
            className={styles.tab}
            icon={<ScoreIcon />}
            value="score"
          >
            Score
          </Tab>
        </TabList>
      </div>

      {/* Tab Content 占位符 */}
      <div 
        className={mergeClasses(
          styles.tabContent,
          selectedTab === "word" 
            ? styles.tabContentFirstTab 
            : styles.tabContentOtherTabs
        )}
      >
        {selectedTab === "word" && (
          tabPageState.word === "welcome" ? (
            <WordWelcome onStart={handleWordStart} />
          ) : (
            <WordTraining config={wordConfig!} onBack={handleWordBack} />
          )
        )}
        {selectedTab === "callsign" && (
          tabPageState.callsign === "welcome" ? (
            <CallsignWelcome onStart={handleCallsignStart} />
          ) : (
            <CallsignTraining config={callsignConfig!} onBack={handleCallsignBack} />
          )
        )}
        {selectedTab === "qtc" && (
          tabPageState.qtc === "welcome" ? (
            <QTCWelcome onStart={handleQTCStart} />
          ) : (
            <QTCTraining config={qtcConfig!} onBack={handleQTCBack} />
          )
        )}
        {selectedTab === "score" && <ScorePage />}
      </div>
    </div>
  );
};