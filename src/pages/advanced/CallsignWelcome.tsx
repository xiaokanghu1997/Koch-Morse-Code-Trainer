import { 
  Text,
  Tooltip,
  Checkbox,
  RadioGroup,
  Radio,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CallsignTrainingConfig } from "../../lib/types";
import { GenericWelcome } from "../../components/GenericWelcome";
import { useSettingsStore } from "../../stores/settingsStore";

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
  tooltip: {
    backgroundColor: tokens.colorNeutralBackground4Hover,
    boxShadow: tokens.shadow2,
    maxWidth: "380px",
    whiteSpace: "normal",
  },
});

// Props 接口
interface CallsignWelcomeProps {
  onStart: (config: CallsignTrainingConfig) => void;
}

export const CallsignWelcome = ({ onStart }: CallsignWelcomeProps) => {
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
  
  // Callsign 特有配置状态
  const [filter, setFilter] = useState("short");
  const [blindMode, setBlindMode] = useState(false);

  // Callsign 右侧面板
  const rightConfigPanel = (
    <>
      {/* 呼号过滤器 */}
      <div className={styles.filterContainer}>
        <div className={styles.filterLabel}>
          <Text>{t("advanced.callsign.welcome.labels.filter")}</Text>
        </div>
        <RadioGroup
          className={styles.radioGroup}
          value={filter}
          onChange={(_, data) => setFilter(data.value)}
        >
          <Radio 
            className={styles.radio} 
            value="short" 
            label={t("advanced.callsign.welcome.filters.shortOnly")}
          />
          <Radio 
            className={styles.radio} 
            value="no-slashed" 
            label={t("advanced.callsign.welcome.filters.noSlashed")}
          />
          <Radio 
            className={styles.radio} 
            value="all" 
            label={t("advanced.callsign.welcome.filters.all")}
          />
        </RadioGroup>
      </div>

      {/* 盲测模式 */}
      <div className={styles.configItem}>
        <div className={styles.configLabel}>
          <Tooltip
            content={{
              children: t("advanced.callsign.welcome.tooltips.blindMode"),
              className: styles.tooltip,
            }}
            relationship="label"
            positioning={language === "English" ? "below-end" : "below-start"}
          >
            <Text>{t("advanced.callsign.welcome.labels.blindMode")}</Text>
          </Tooltip>
        </div>
        <div className={styles.configControl}>
          <Checkbox
            id="callsign-blind-mode-checkbox"
            className={styles.checkbox}
            label={blindMode 
                    ? t("advanced.callsign.welcome.status.on") 
                    : t("advanced.callsign.welcome.status.off")}
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
      title={t("advanced.callsign.welcome.title")}
      subtitle={t("advanced.callsign.welcome.subtitle")}
      description={t("advanced.callsign.welcome.description")}
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
      rightColumnWidth={language === "English" ? 0.85 : 0.8}
      configSectionGap={language === "English" ? 40 : 60}
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