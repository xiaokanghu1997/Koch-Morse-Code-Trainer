import { 
  Text,
  Tooltip,
  Checkbox,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { WordTrainingConfig } from "../../lib/types";
import { GenericWelcome } from "../../components/GenericWelcome";
import { useSettingsStore } from "../../stores/settingsStore";

// 样式定义
const useStyles = makeStyles({
  datasetContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: "6px",
  },
  datasetLabel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    marginTop: "6px",
  },
  datasetControl: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    flexShrink: 0,
    gap: "5px",
  },
  configItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "6px",
  },
  configLabel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  configControl: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  },
  checkbox: {
    height: "32px",
    color: tokens.colorNeutralForeground1,
    "& .fui-Checkbox__indicator": {
      marginTop: "9px",
    },
    "& .fui-Checkbox__label": {
      marginLeft: "-6px",
    },
    marginRight: "-8px",
  },
  tooltip: {
    backgroundColor: tokens.colorNeutralBackground4Hover,
    boxShadow: tokens.shadow2,
    maxWidth: "380px",
    whiteSpace: "normal",
  },
});

// Props 接口
interface WordWelcomeProps {
  onStart: (config: WordTrainingConfig) => void;
}

// 数据集常量定义
const DATASETS = {
  ABBRES: "abbres",
  QCODES: "qcodes",
  WORDS: "words",
} as const;

export const WordWelcome = ({ onStart }: WordWelcomeProps) => {
  // 使用样式
  const styles = useStyles();

  // 使用 i18n 获取翻译函数
  const { t } = useTranslation();
  // 获取当前语言设置
  const { language } = useSettingsStore();

  // 通用配置状态
  const [charSpeed, setCharSpeed] = useState(20);
  const [minCharSpeed, setMinCharSpeed] = useState(5);
  const [fixedCharSpeed, setFixedCharSpeed] = useState(false);
  const [tone, setTone] = useState(600);
  const [randomTone, setRandomTone] = useState(false);
  
  // Word 特有配置状态
  const [dataset, setDataset] = useState<string[]>([DATASETS.ABBRES]);
  const [skip, setSkip] = useState(false);

  // 处理数据集点击
  const handleDatasetChange = (datasetName: string, checked: boolean) => {
    if (checked) {
      setDataset((prev) => [...prev, datasetName]);
    } else {
      setDataset((prev) => prev.filter((d) => d !== datasetName));
    }
  };

  // Word 右侧面板
  const rightConfigPanel = (
    <>
      {/* 单词数据集 */}
      <div className={styles.datasetContainer}>
        <div className={styles.datasetLabel}>
          <Text>{t("advanced.word.welcome.labels.dataset")}</Text>
        </div>
        <div className={styles.datasetControl}>
          <Checkbox
            id="word-dataset-abbre-checkbox"
            className={styles.checkbox}
            label={t("advanced.word.welcome.datasets.abbreviations")}
            checked={dataset.includes(DATASETS.ABBRES)}
            onChange={(_, data) => handleDatasetChange(DATASETS.ABBRES, data.checked === true)}
          />
          <Checkbox
            id="word-dataset-qcode-checkbox"
            className={styles.checkbox}
            label={t("advanced.word.welcome.datasets.qcodes")}
            checked={dataset.includes(DATASETS.QCODES)}
            onChange={(_, data) => handleDatasetChange(DATASETS.QCODES, data.checked === true)}
          />
          <Checkbox
            id="word-dataset-word-checkbox"
            className={styles.checkbox}
            label={t("advanced.word.welcome.datasets.commonWords")}
            checked={dataset.includes(DATASETS.WORDS)}
            onChange={(_, data) => handleDatasetChange(DATASETS.WORDS, data.checked === true)}
          />
        </div>
      </div>

      {/* 自动跳过 */}
      <div className={styles.configItem}>
        <div className={styles.configLabel}>
          <Tooltip
            content={{
              children: t("advanced.word.welcome.tooltips.skipAfter5s"),
              className: styles.tooltip,
            }}
            relationship="label"
            positioning={language === "English" ? "below-end" : "below-start"}
          >
            <Text>{t("advanced.word.welcome.labels.skipAfter5s")}</Text>
          </Tooltip>
        </div>
        <div className={styles.configControl}>
          <Checkbox
            id="word-skip-checkbox"
            className={styles.checkbox}
            label={skip 
                    ? t("advanced.word.welcome.status.on") 
                    : t("advanced.word.welcome.status.off")}
            checked={skip}
            onChange={(_, data) => 
              setSkip(data.checked === true)
            }
          />
        </div>
      </div>
    </>
  );

  return (
    <GenericWelcome
      title={t("advanced.word.welcome.title")}
      subtitle={t("advanced.word.welcome.subtitle")}
      description={t("advanced.word.welcome.description")}
      idPrefix="word"
      charSpeed={charSpeed}
      minCharSpeed={minCharSpeed}
      fixedCharSpeed={fixedCharSpeed}
      onCharSpeedChange={setCharSpeed}
      onMinCharSpeedChange={setMinCharSpeed}
      onFixedCharSpeedChange={setFixedCharSpeed}
      tone={tone}
      randomTone={randomTone}
      onToneChange={setTone}
      onRandomToneChange={setRandomTone}
      rightConfigPanel={rightConfigPanel}
      rightColumnWidth={language === "English" ? 0.9 : 0.75}
      configSectionGap={language === "English" ? 40 : 60}
      onStart={() => onStart({ 
        charSpeed, 
        minCharSpeed, 
        fixedCharSpeed, 
        tone, 
        randomTone, 
        dataset, 
        skip 
      })}
    />
  );
};