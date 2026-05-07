import { 
  Text,
  Dropdown,
  Option,
  Checkbox,
  Button,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { 
  ChevronDown16Regular,
  Fire20Regular,
} from "@fluentui/react-icons";
import { ReactNode, useEffect, useMemo } from "react";
import { generateRange } from "../services/statisticalToolset";

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
  tooltip: {
    backgroundColor: tokens.colorNeutralBackground2Hover,
    boxShadow: tokens.shadow2,
    maxWidth: "280px",
    whiteSpace: "normal",
  },
});

interface GenericWelcomeProps {
  // 页面信息
  title: string;
  subtitle: string;
  description: string;
  idPrefix: string; // "word" 或 "callsign"
  
  // 速度配置
  charSpeed: number;
  minCharSpeed: number;
  fixedCharSpeed: boolean;
  onCharSpeedChange: (speed: number) => void;
  onMinCharSpeedChange: (speed: number) => void;
  onFixedCharSpeedChange: (fixed: boolean) => void;
  
  // 音调配置
  tone: number;
  randomTone: boolean;
  onToneChange: (tone: number) => void;
  onRandomToneChange: (random: boolean) => void;
  
  // 右侧自定义配置区域及宽度
  rightConfigPanel: ReactNode;
  rightColumnWidth?: number;
  
  // 开始按钮
  onStart: () => void;
}

export const GenericWelcome = ({
  title,
  subtitle,
  description,
  idPrefix,
  charSpeed,
  minCharSpeed,
  fixedCharSpeed,
  onCharSpeedChange,
  onMinCharSpeedChange,
  onFixedCharSpeedChange,
  tone,
  randomTone,
  onToneChange,
  onRandomToneChange,
  rightConfigPanel,
  rightColumnWidth = 0.9,
  onStart,
}: GenericWelcomeProps) => {
  // 使用样式
  const styles = useStyles();

  // 生成选项列表
  const charSpeedOptions = useMemo(() => generateRange(5, 100, 1), []);
  const toneOptions = useMemo(() => generateRange(400, 1000, 10), []);
  const minCharSpeedOptions = useMemo(() => generateRange(5, charSpeed, 1), [charSpeed]);

  // 自动勾选固定字符速率
  useEffect(() => {
    if (charSpeed === minCharSpeed && !fixedCharSpeed) {
      onFixedCharSpeedChange(true);
    }
  }, [charSpeed, minCharSpeed, fixedCharSpeed, onFixedCharSpeedChange]);

  // 取消勾选固定字符速率
  const handleFixedCharSpeedChange = (isChecked: boolean) => {
    if (!isChecked && charSpeed === minCharSpeed) {
      if (minCharSpeed > 5) {
        onMinCharSpeedChange(minCharSpeed - 1);
      } else {
        onCharSpeedChange(charSpeed + 1);
      }
    }
    onFixedCharSpeedChange(isChecked);
  };

  return (
    <div className={styles.container}>
      {/* 介绍区域 */}
      <div className={styles.introSection}>
        <div className={styles.titleRow}>
          <Text className={styles.title}>
            {title}
          </Text>
          <Text className={styles.description}>
            {subtitle}
          </Text>
        </div>
        <Text className={styles.description}>
          {description}
        </Text>
      </div>

      {/* 配置区域 */}
      <div 
        className={styles.configSection}
        style={{ gridTemplateColumns: `1fr ${rightColumnWidth}fr` }}
      >
        {/* 左侧配置列 - 速度和音调 */}
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
                id={`${idPrefix}-charspeed-dropdown`}
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
                  onCharSpeedChange(newSpeed);
                  if (minCharSpeed > newSpeed) {
                    onMinCharSpeedChange(newSpeed);
                  }
                }}
              >
                {charSpeedOptions.map((speed) => (
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
                id={`${idPrefix}-mincharspeed-dropdown`}
                className={styles.dropdown}
                positioning="below"
                expandIcon={<ChevronDown16Regular />}
                listbox={{ 
                  className: mergeClasses(
                    styles.dropdownListbox,
                    minCharSpeedOptions.length > 3 && styles.dropdownListboxWithHeight2
                  )
                }}
                value={minCharSpeed.toString()}
                selectedOptions={[minCharSpeed.toString()]}
                onOptionSelect={(_, data) => {
                  onMinCharSpeedChange(Number(data.optionValue));
                }}
              >
                {minCharSpeedOptions.map((speed) => (
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
              <Tooltip
                content={{
                  children: "If checked, the score will not be counted",
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Fixed character speed:</Text>
              </Tooltip>
            </div>
            <div className={styles.configControl}>
              <Checkbox 
                id={`${idPrefix}-fixed-speed-checkbox`}
                className={styles.checkbox}
                label={fixedCharSpeed ? "On" : "Off"}
                checked={fixedCharSpeed}
                onChange={(_, data) => handleFixedCharSpeedChange(data.checked === true)}
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
                id={`${idPrefix}-tone-dropdown`}
                className={styles.dropdown}
                positioning="above"
                expandIcon={<ChevronDown16Regular />}
                listbox={{ 
                  className: mergeClasses(styles.dropdownListbox, styles.dropdownListboxWithHeight1)
                }}
                value={tone.toString()}
                selectedOptions={[tone.toString()]}
                onOptionSelect={(_, data) => {
                  onToneChange(Number(data.optionValue));
                }}
              >
                {toneOptions.map((toneValue) => (
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
              id={`${idPrefix}-random-tone-checkbox`}
              className={styles.checkbox}
              label="500-900 Hz random"
              checked={randomTone}
              onChange={(_, data) => 
                onRandomToneChange(data.checked === true)
              }
            />
          </div>
        </div>

        {/* 右侧配置列（自定义） */}
        <div className={styles.configColumn}>
          {rightConfigPanel}
        </div>
      </div>

      {/* 按钮区域 */}
      <div className={styles.actionSection}>
        <Button 
          className={styles.button} 
          icon={<Fire20Regular />}
          onClick={onStart}
        >
          <Text className={styles.buttonText}>
            Start Training
          </Text>
        </Button>
      </div>
    </div>
  );
};