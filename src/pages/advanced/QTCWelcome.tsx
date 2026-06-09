import { 
  Text,
  Tooltip,
  Dropdown,
  Option,
  SpinButton,
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
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { QTCTrainingConfig } from "../../lib/types";
import { clampNumber, generateRange } from "../../services/statisticalToolset";
import { useSettingsStore } from "../../stores/settingsStore";

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
    gridTemplateColumns: "1fr 1fr",
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
  spinbutton: {
    width: "60px",
    height: "32px",
    border: "none",
    paddingBottom: "1.5px",
    transform: "translateY(1.5px)",
    boxShadow: tokens.shadow2,
    backgroundColor: tokens.colorNeutralBackground4,
    "::before": {
      display: "none",
    },
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground4Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground4Pressed,
    },
    "& input::selection": {
      backgroundColor: tokens.colorCompoundBrandBackground,
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
    backgroundColor: tokens.colorNeutralBackground4Hover,
    boxShadow: tokens.shadow2,
    maxWidth: "380px",
    whiteSpace: "normal",
  },
});

// Props 接口
interface QTCWelcomeProps {
  onStart: (config: QTCTrainingConfig) => void;
}

// 缩写数字集常量定义
const ABBERVNUM = [
  { value: 0, label: "abbrevNumbers.none" },
  { value: 1, label: "abbrevNumbers.partial" },
  { value: 2, label: "abbrevNumbers.all" },
] as const;

export const QTCWelcome = ({ onStart }: QTCWelcomeProps) => {
  // 使用样式
  const styles = useStyles();

  // 使用 i18n 获取翻译函数
  const { t } = useTranslation();
  // 获取当前语言设置
  const { language } = useSettingsStore();

  // 本地状态（参数设置）
  const [charSpeed, setCharSpeed] = useState(20);
  const [tone, setTone] = useState(600);
  const [itemSpace, setItemSpace] = useState(1);
  const [abbrevNumbers, setAbbrevNumbers] = useState(0);
  const [chronological, setChronological] = useState(false);
  const [abbrevTimes, setAbbrevTimes] = useState(false);

  // 选项生成
  const charSpeedOptions = useMemo(() => generateRange(5, 100, 1), []);
  const toneOptions = useMemo(() => generateRange(400, 1000, 10), []);

  // 获取当前选中的显示文本
  const selectedAbbrevNumLabel = ABBERVNUM.find(
    option => option.value === abbrevNumbers
  )?.label ?? "abbrevNumbers.none";

  // Start 按钮点击
  const handleStart = () => {
    onStart({ charSpeed, tone, itemSpace, abbrevNumbers, chronological, abbrevTimes });
  };

  // 处理 SpinButton 输入的函数
  const handleSpin = (min: number, max: number) => (_: any, data: any) => {
    const rawText = String(data.value ?? data.displayValue ?? "");
    const cleaned = rawText.replace(/\D/g, "");
    if (cleaned === "") {
      setItemSpace(1);
      return;
    }
    const raw = Number(cleaned);
    const clamped = clampNumber(raw, min, max);
    setItemSpace(clamped);
  };

  // 数字输入限制（适用于 SpinButton）
  const numericSpinProps = {
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ];
      if (
        !/^\d$/.test(e.key) &&
        !allowedKeys.includes(e.key)
      ) {
        e.preventDefault();
      }
    },

    onBeforeInput: (e: React.FormEvent<HTMLInputElement>) => {
      const event = e.nativeEvent as InputEvent;
      if (
        event.data &&
        !/^\d+$/.test(event.data)
      ) {
        e.preventDefault();
      }
    },

    onInput: (e: React.FormEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      input.value = input.value.replace(/\D/g, "");
    },

    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text");
      if (!/^\d+$/.test(text)) {
        e.preventDefault();
      }
    },
  };

  return (
    <div className={styles.container}>
      {/* 介绍区域 */}
      <div className={styles.introSection}>
        <div className={styles.titleRow}>
          <Text className={styles.title}>
            {t("advanced.qtc.welcome.title")}
          </Text>
          <Text className={styles.description}>
            {t("advanced.qtc.welcome.subtitle")}
          </Text>
        </div>
        <Text 
          className={styles.description}
          style={{ marginRight: language === "English" ? "0px" : "-4px" }}
        >
          {t("advanced.qtc.welcome.description")}
        </Text>
      </div>

      {/* 配置区域 */}
      <div 
        className={styles.configSection}
        style={{
          gap: language === "English" ? "45px" : "60px",
        }}
      >
        {/* 左侧音频参数配置 */}
        <div className={styles.configColumn}>
          {/* 字符速率 */}
          <div className={styles.configItem}>
            <div className={styles.configLabel}>
              <Text>{t("advanced.qtc.welcome.labels.charSpeed")}</Text>
            </div>
            <div className={styles.configControl}>
              <Dropdown
                id={"qtc-charspeed-dropdown"}
                className={styles.dropdown}
                style={{ minWidth: "75px", maxWidth: "75px" }}
                positioning="below"
                expandIcon={<ChevronDown16Regular />}
                listbox={{ 
                  className: mergeClasses(styles.dropdownListbox, styles.dropdownListboxWithHeight1),
                  style: { minWidth: "75px", maxWidth: "75px" }
                }}
                value={charSpeed.toString()}
                selectedOptions={[charSpeed.toString()]}
                onOptionSelect={(_, data) => {
                  const newSpeed = Number(data.optionValue);
                  setCharSpeed(newSpeed);
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
              <Text>{t("advanced.qtc.welcome.units.wpm")}</Text>
            </div>
          </div>

          {/* 音调频率 */}
          <div className={styles.configItem}>
            <div className={styles.configLabel}>
              <Text>{t("advanced.qtc.welcome.labels.tone")}</Text>
            </div>
            <div className={styles.configControl}>
              <Dropdown
                id={"qtc-tone-dropdown"}
                className={styles.dropdown}
                style={{ minWidth: "92px", maxWidth: "92px" }}
                positioning="below"
                expandIcon={<ChevronDown16Regular />}
                listbox={{ 
                  className: mergeClasses(styles.dropdownListbox, styles.dropdownListboxWithHeight2),
                  style: { minWidth: "92px", maxWidth: "92px" }
                }}
                value={tone.toString()}
                selectedOptions={[tone.toString()]}
                onOptionSelect={(_, data) => {
                  const newTone = Number(data.optionValue);
                  setTone(newTone);
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
              <Text>{t("advanced.qtc.welcome.units.hz")}</Text>
            </div>
          </div>

          {/* 要素间隔 */}
          <div className={styles.configItem}>
            <div className={styles.configLabel}>
              <Tooltip
                content={{
                  children: t("advanced.qtc.welcome.tooltips.itemSpace"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("advanced.qtc.welcome.labels.itemSpace")}</Text>
              </Tooltip>
            </div>
            <div className={styles.configControl}>
              <SpinButton
                id="item-space-spin"
                className={styles.spinbutton}
                min={1}
                max={10}
                value={itemSpace}
                onChange={handleSpin(1, 10)}
                {...numericSpinProps}
              />
              <Text>× 7 {t("advanced.qtc.welcome.units.dits")}</Text>
            </div>
          </div>
        </div>

        {/* 右侧文本参数配置 */}
        <div className={styles.configColumn}>
          {/* 缩略数字 */}
          <div className={styles.configItem}>
            <div className={styles.configLabel}>
              <Tooltip
                content={{
                  children: t("advanced.qtc.welcome.tooltips.abbrevNumbers"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("advanced.qtc.welcome.labels.abbrevNumbers")}</Text>
              </Tooltip>
            </div>
            <div className={styles.configControl}>
              <Dropdown
                id={"abbrevnumbers-dropdown"}
                className={styles.dropdown}
                style={{ minWidth: "85px", maxWidth: "85px" }}
                positioning="below"
                expandIcon={<ChevronDown16Regular />}
                listbox={{ 
                  className: styles.dropdownListbox,
                  style: { minWidth: "85px", maxWidth: "85px" }
                }}
                value={t(`advanced.qtc.welcome.${selectedAbbrevNumLabel}`)}
                selectedOptions={[abbrevNumbers.toString()]}
                onOptionSelect={(_, data) => {
                  setAbbrevNumbers(Number(data.optionValue));
                }}
              >
                {ABBERVNUM.map((option) => (
                  <Option
                    key={option.value}
                    value={option.value.toString()}
                    className={styles.dropdownOption}
                    checkIcon={null}
                  >
                    {t(`advanced.qtc.welcome.${option.label}`)}
                  </Option>
                ))}
              </Dropdown>
            </div>
          </div>

          {/* 是否按时间排序 */}
          <div className={styles.configItem}>
            <div className={styles.configLabel}>
              <Tooltip
                content={{
                  children: t("advanced.qtc.welcome.tooltips.chronological"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("advanced.qtc.welcome.labels.chronological")}</Text>
              </Tooltip>
            </div>
            <div className={styles.configControl}>
              <Checkbox 
                id={"chronological-checkbox"}
                className={styles.checkbox}
                label={chronological 
                        ? t("advanced.qtc.welcome.status.on") 
                        : t("advanced.qtc.welcome.status.off")}
                checked={chronological}
                onChange={(_, data) => 
                  setChronological(data.checked === true)
                }
              />
            </div>
          </div>

          {/* 是否缩略时间 */}
          <div 
            className={styles.configItem}
            style={{
              opacity: chronological ? 1 : 0.5,
              pointerEvents: chronological ? "auto" : "none",
            }}
          >
            <div className={styles.configLabel}>
              <Tooltip
                content={{
                  children: t("advanced.qtc.welcome.tooltips.abbrevTimes"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("advanced.qtc.welcome.labels.abbrevTimes")}</Text>
              </Tooltip>
            </div>
            <div className={styles.configControl}>
              <Checkbox 
                id={"abbrevtimes-checkbox"}
                className={styles.checkbox}
                label={abbrevTimes 
                        ? t("advanced.qtc.welcome.status.on") 
                        : t("advanced.qtc.welcome.status.off")}
                checked={abbrevTimes}
                onChange={(_, data) => 
                  setAbbrevTimes(data.checked === true)
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
          style={{ width: language === "English" ? "140px" : "120px" }}
          icon={<Fire20Regular />}
          onClick={handleStart}
        >
          <Text className={styles.buttonText}>
            {t("advanced.qtc.welcome.buttons.start")}
          </Text>
        </Button>
      </div>
    </div>
  );
};