import { 
  Text,
  Checkbox,
  RadioGroup,
  Radio,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useState } from "react";
import type { CallsignTrainingConfig } from "../../lib/types";
import { GenericWelcome } from "../../components/GenericWelcome";

// 样式定义
const useStyles = makeStyles({
  filterContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: "6px",
  },
  filterLabel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    marginTop: "6px",
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
  radioGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    flexShrink: 0,
    gap: "5px",
  },
  radio: {
    height: "32px",
    color: tokens.colorNeutralForeground1,
    "& .fui-Radio__indicator": {
      marginTop: "9px",
    },
    "& .fui-Radio__label": {
      marginLeft: "-6px",
    },
    marginRight: "-8px",
  },
});

// Props 接口
interface CallsignWelcomeProps {
  onStart: (config: CallsignTrainingConfig) => void;
}

export const CallsignWelcome = ({ onStart }: CallsignWelcomeProps) => {
  // 使用样式
  const styles = useStyles();

  // 通用配置状态
  const [charSpeed, setCharSpeed] = useState(20);
  const [minCharSpeed, setMinCharSpeed] = useState(5);
  const [fixedCharSpeed, setFixedCharSpeed] = useState(false);
  const [tone, setTone] = useState(600);
  const [randomTone, setRandomTone] = useState(false);
  
  // Callsign 特有配置状态
  const [filter, setFilter] = useState("short");
  const [blindMode, setBlindMode] = useState(false);

  // Callsign 右侧面板
  const rightConfigPanel = (
    <>
      {/* 呼号过滤器 */}
      <div className={styles.filterContainer}>
        <div className={styles.filterLabel}>
          <Text>Callsign filter:</Text>
        </div>
        <RadioGroup
          className={styles.radioGroup}
          value={filter}
          onChange={(_, data) => setFilter(data.value)}
        >
          <Radio 
            className={styles.radio} 
            value="short" 
            label="Short callsigns only" 
          />
          <Radio 
            className={styles.radio} 
            value="no-slashed" 
            label="Filter slashed callsigns" 
          />
          <Radio 
            className={styles.radio} 
            value="all" 
            label="No filter" 
          />
        </RadioGroup>
      </div>

      {/* 盲测模式 */}
      <div className={styles.configItem}>
        <div className={styles.configLabel}>
          <Text>Blind mode:</Text>
        </div>
        <div className={styles.configControl}>
          <Checkbox
            id="callsign-blind-mode-checkbox"
            className={styles.checkbox}
            label={blindMode ? "On" : "Off"}
            checked={blindMode}
            onChange={(_, data) => 
              setBlindMode(data.checked === true)
            }
          />
        </div>
      </div>
    </>
  );  

  return (
    <GenericWelcome
      title="Callsign Training"
      subtitle="(For practicing callsign copying)"
      description="Each session includes 25 callsigns. You can set the initial character speed, which adjusts dynamically based on your performance: +1 WPM for each correct copy and -1 WPM for each mistake."
      idPrefix="callsign"
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
      rightColumnWidth={0.85}
      onStart={() => onStart({ 
        charSpeed, 
        minCharSpeed, 
        fixedCharSpeed, 
        tone, 
        randomTone, 
        filter, 
        blindMode 
      })}
    />    
  );
};