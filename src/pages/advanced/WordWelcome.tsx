import { 
  Text,
  Dropdown,
  Option,
  Checkbox,
  Button,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { 
  ChevronDown16Regular,
  Fire20Regular,
} from "@fluentui/react-icons";
import { useState } from "react";
import type { WordTrainingConfig } from "../../lib/types";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    padding: "12px 15px",
    gap: "6px",
  },
  // 介绍区域
  introSection: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    marginTop: "-5px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  description: {
    color: tokens.colorNeutralForeground4,
  },
  // 配置区域
  configSection: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 0.9fr",
    gap: "40px",
  },
  configColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
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
  // 控件样式
  dropdown: {
    minWidth: "75px",
    maxWidth: "75px",
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
  dropdownListbox: {
    minWidth: "75px",
    maxWidth: "75px",
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground5,
  },
  dropdownListboxWithHeight1: {
    height: "130px",
  },
  dropdownListboxWithHeight2: {
    height: "100px",
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
  // 按钮区域
  actionSection: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: "-6px",
  },
  button: {
    width: "140px",
    height: "32px",
    border: "none",
    transform: "translateY(1.2px)",
    boxShadow: tokens.shadow2,
    fontWeight: tokens.fontWeightRegular,
    backgroundColor: tokens.colorNeutralBackground4,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground4Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground4Pressed,
    },
  },
  buttonText: {
    paddingBottom: "1.4px",
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

// 辅助函数：生成数字范围
const generateRange = (start: number, end: number, step: number): number[] => {
  const result: number[] = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
}

export const WordWelcome = ({ onStart }: WordWelcomeProps) => {
  // 使用样式
  const styles = useStyles();
  // 本地状态（参数设置）
  const [charSpeed, setCharSpeed] = useState(20);
  const [minCharSpeed, setMinCharSpeed] = useState(5);
  const [fixedCharSpeed, setFixedCharSpeed] = useState(false);
  const [tone, setTone] = useState(600);
  const [randomTone, setRandomTone] = useState(false);
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

  // Start 按钮点击
  const handleStart = () => {
    onStart({ charSpeed, minCharSpeed, fixedCharSpeed, tone, randomTone, dataset, skip });
  };

  return (
    <div className={styles.container}>
      {/* 介绍区域 */}
      <div className={styles.introSection}>
        <div className={styles.titleRow}>
          <Text className={styles.title}>
            Word Training
          </Text>
          <Text className={styles.description}>
            (For practicing single-word copying)
          </Text>
        </div>
        <Text className={styles.description}>
          Each session consists of 25 words. You can set the initial character speed, which adjusts dynamically based on
          your performance: +1 WPM for each correct copy and -1 WPM for each mistake.
        </Text>
      </div>

      {/* 配置区域 */}
      <div className={styles.configSection}>
        {/* 左侧配置列 */}
        <div className={styles.configColumn}>
          {/* 字符速率 */}
          <div 
            className={styles.configItem}
            style={{
              opacity: fixedCharSpeed ? 0.5 : 1,
              pointerEvents: fixedCharSpeed ? "none" : "auto"
            }}
          >
            <div className={styles.configLabel}>
              <Text>Character speed:</Text>
            </div>
            <div className={styles.configControl}>
              <Dropdown
                id="word-charspeed-dropdown"
                className={styles.dropdown}
                positioning="below"
                expandIcon={<ChevronDown16Regular />}
                listbox={{ 
                  className: mergeClasses(styles.dropdownListbox, styles.dropdownListboxWithHeight1)
                }}
                value={charSpeed.toString()}
                selectedOptions={[charSpeed.toString()]}
                onOptionSelect={(_, data) => {
                  const newSpeed = Number(data.optionValue);
                  setCharSpeed(newSpeed);
                  if (minCharSpeed > newSpeed) {
                    setMinCharSpeed(newSpeed);
                  }
                }}
              >
                {generateRange(5, 100, 1).map((speed) => (
                  <Option
                    key={speed}
                    value={speed.toString()}
                    className={styles.dropdownOption}
                    checkIcon={null}
                  >
                    {speed.toString()}
                  </Option>
                ))}
              </Dropdown>
              <Text>WPM</Text>
            </div>
          </div>

          {/* 最小字符速率 */}
          <div 
            className={styles.configItem}
            style={{
              opacity: fixedCharSpeed ? 0.5 : 1,
              pointerEvents: fixedCharSpeed ? "none" : "auto"
            }}
          >
            <div className={styles.configLabel}>
              <Text>Minimum character speed:</Text>
            </div>
            <div className={styles.configControl}>
              <Dropdown
                id="word-mincharspeed-dropdown"
                className={styles.dropdown}
                positioning="below"
                expandIcon={<ChevronDown16Regular />}
                listbox={{ 
                  className: mergeClasses(
                    styles.dropdownListbox,
                    generateRange(5, charSpeed, 1).length > 3 && styles.dropdownListboxWithHeight2
                  )
                }}
                value={minCharSpeed.toString()}
                selectedOptions={[minCharSpeed.toString()]}
                onOptionSelect={(_, data) => {
                  setMinCharSpeed(Number(data.optionValue));
                }}
              >
                {generateRange(5, charSpeed, 1).map((speed) => (
                  <Option
                    key={speed}
                    value={speed.toString()}
                    className={styles.dropdownOption}
                    checkIcon={null}
                  >
                    {speed.toString()}
                  </Option>
                ))}
              </Dropdown>
              <Text>WPM</Text>
            </div>
          </div>

          {/* 固定字符速率 */}
          <div className={styles.configItem}>
            <div className={styles.configLabel}>
              <Text>Fixed character speed:</Text>
            </div>
            <div className={styles.configControl}>
              <Checkbox 
                id="word-fixed-speed-checkbox"
                className={styles.checkbox}
                label={fixedCharSpeed ? "On" : "Off"}
                checked={fixedCharSpeed}
                onChange={(_, data) => 
                  setFixedCharSpeed(data.checked === true)
                }
              />
            </div>
          </div>

          {/* 音调 */}
          <div className={styles.configItem}>
            <div className={styles.configLabel}>
              <Text>Tone:</Text>
            </div>
            <div 
              className={styles.configControl}
              style={{
                opacity: randomTone ? 0.5 : 1,
                pointerEvents: randomTone ? "none" : "auto"
              }}
            >
              <Dropdown
                id="word-tone-dropdown"
                className={styles.dropdown}
                positioning="above"
                expandIcon={<ChevronDown16Regular />}
                listbox={{ 
                  className: mergeClasses(styles.dropdownListbox, styles.dropdownListboxWithHeight1)
                }}
                value={tone.toString()}
                selectedOptions={[tone.toString()]}
                onOptionSelect={(_, data) => {
                  setTone(Number(data.optionValue));
                }}
              >
                {generateRange(400, 1000, 10).map((toneValue) => (
                  <Option
                    key={toneValue}
                    value={toneValue.toString()}
                    className={styles.dropdownOption}
                    checkIcon={null}
                  >
                    {toneValue.toString()}
                  </Option>
                ))}
              </Dropdown>
              <Text>Hz</Text>
            </div>
            <Checkbox
              id="word-random-tone-checkbox"
              className={styles.checkbox}
              label="500-900 Hz random"
              checked={randomTone}
              onChange={(_, data) => 
                setRandomTone(data.checked === true)
              }
            />
          </div>
        </div>

        {/* 右侧配置列 */}
        <div className={styles.configColumn}>
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

          {/* 是否跳过 */}
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
        </div>
      </div>

      {/* 按钮区域 */}
      <div className={styles.actionSection}>
        <Button 
          className={styles.button} 
          icon={<Fire20Regular />}
          onClick={handleStart}
        >
          <Text className={styles.buttonText}>
            Start Training
          </Text>
        </Button>
      </div>
    </div>
  );
};