import { 
  Text,
  Checkbox,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useState } from "react";
import type { WordTrainingConfig } from "../../lib/types";
import { GenericWelcome } from "../../components/GenericWelcome";

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
          <Text>Dataset:</Text>
        </div>
        <div className={styles.datasetControl}>
          <Checkbox
            id="word-dataset-abbre-checkbox"
            className={styles.checkbox}
            label="CW abbreviations"
            checked={dataset.includes(DATASETS.ABBRES)}
            onChange={(_, data) => handleDatasetChange(DATASETS.ABBRES, data.checked === true)}
          />
          <Checkbox
            id="word-dataset-qcode-checkbox"
            className={styles.checkbox}
            label="Q-codes"
            checked={dataset.includes(DATASETS.QCODES)}
            onChange={(_, data) => handleDatasetChange(DATASETS.QCODES, data.checked === true)}
          />
          <Checkbox
            id="word-dataset-word-checkbox"
            className={styles.checkbox}
            label="Common English words"
            checked={dataset.includes(DATASETS.WORDS)}
            onChange={(_, data) => handleDatasetChange(DATASETS.WORDS, data.checked === true)}
          />
        </div>
      </div>

      {/* 自动跳过 */}
      <div className={styles.configItem}>
        <div className={styles.configLabel}>
          <Text>Skip automatically after 5 seconds:</Text>
        </div>
        <div className={styles.configControl}>
          <Checkbox
            id="word-skip-checkbox"
            className={styles.checkbox}
            label={skip ? "On" : "Off"}
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
      title="Word Training"
      subtitle="(For practicing single word copying)"
      description="Each session consists of 25 words. You can set the initial character speed, which adjusts dynamically based on your performance: +1 WPM for each correct copy and -1 WPM for each mistake."
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
      rightColumnWidth={0.9}
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