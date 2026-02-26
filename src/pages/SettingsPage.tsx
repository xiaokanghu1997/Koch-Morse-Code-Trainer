import { 
  Text, 
  Card,
  Dropdown,
  Option,
  Slider,
  Switch,
  makeStyles,
  tokens
} from "@fluentui/react-components";
import {
  ChevronDown16Regular,
  Color24Regular,
  TransparencySquare24Regular,
  Speaker224Regular,
  PulseSquare24Regular
} from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";
import { log } from "../utils/logger";
import { useSettingsStore } from "../stores/settingsStore";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  card: {
    padding: "14px 16px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "16px",
    backgroundColor: tokens.colorNeutralBackground3,
  },
  icon: {
    color: tokens.colorBrandForeground1,
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  header: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  description: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  control: {
    flexShrink: 0,
  },
  dropdown: {
    minWidth: "100px",
    maxWidth: "100px",
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
    minWidth: "100px",
    maxWidth: "100px",
    backgroundColor: tokens.colorNeutralBackground5,
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
  controlContainer: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    flexShrink: 0,
  },
  slider: {
    width: "150px",
    "& .fui-Slider__thumb": {
      backgroundColor: tokens.colorNeutralBackground4Selected,
      boxShadow: tokens.shadow2,
    },
    "& .fui-Slider__thumb::before": {
      inset: "4px", 
      borderRadius: "50%",
      backgroundColor: tokens.colorBrandForeground1,
      transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      transformOrigin: "center center",
    },
    "&:hover .fui-Slider__thumb::before": {
      transform: "scale(1.2)",
    },
    "&:active .fui-Slider__thumb::before": {
      transform: "scale(0.8)",
    },
    flexShrink: 0,
  },
  sliderValueText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    marginRight: "4px",
    minWidth: "35px",
    textAlign: "right",
    paddingBottom: "1.5px",
    flexShrink: 0,
  },
  switch: {
    flexShrink: 0,
    "& .fui-Switch__indicator svg path": {
      scale: "0.85",
      transformOrigin: "center center",
      transition: "scale 200ms ease, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      willChange: "transform, scale",
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
    },
    "&:hover .fui-Switch__indicator svg path": {
      scale: "1",
    },
    "& input:not(:checked):active ~ .fui-Switch__indicator svg path": {
      transform: "scaleX(1.1) scaleY(1)",
      transformOrigin: "left center",
    },
    "& input:checked:active ~ .fui-Switch__indicator svg path": {
      transform: "scaleX(1.1) scaleY(1)",
      transformOrigin: "right center",
    },
  },
  switchValueText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    marginRight: "4px",
    minWidth: "20px",
    textAlign: "right",
    paddingBottom: "1.5px",
    flexShrink: 0,
  },
});

export const SettingsPage = () => {
  // 使用样式
  const styles = useStyles();

  // 从 SettingsStore 获取设置状态和操作方法
  const {
    theme,
    setTheme,
    opacity,
    setOpacity,
    volume,
    setVolume,
    showWaveform,
    setShowWaveform,
  } = useSettingsStore();

  // 处理透明度变化
  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    invoke("set_window_opacity", {
      opacity: value / 100
    }).catch((error) => {
      log.error("Failed to set window opacity", "SettingsPage", error);
    });
  };

  return (
    <div className={styles.container}>
      {/* 主题设置 */}
      <Card className={styles.card}>
        <Color24Regular className={styles.icon} />
        <div className={styles.content}>
          <Text className={styles.header}>Application Theme</Text>
          <Text className={styles.description}>
            Select which application theme to display
          </Text>
        </div>
        <Dropdown 
          id="theme-dropdown"
          className={styles.dropdown}
          expandIcon={<ChevronDown16Regular />}
          listbox={{ className: styles.dropdownListbox }}
          positioning="below-start"
          value={theme}
          selectedOptions={[theme]}
          onOptionSelect={(_, data) => {
            setTheme(data.optionValue as "Light" | "Dark");
          }}
        >
          <Option 
            key="light" 
            value="Light"
            className={styles.dropdownOption}
            checkIcon={null}
          >
            Light
          </Option>
          <Option 
            key="dark" 
            value="Dark"
            className={styles.dropdownOption}
            checkIcon={null}
          >
            Dark
          </Option>
        </Dropdown>
      </Card>

      {/* 窗口透明度设置 */}
      <Card className={styles.card}>
        <TransparencySquare24Regular className={styles.icon} />
        <div className={styles.content}>
          <Text className={styles.header}>Window Opacity</Text>
          <Text className={styles.description}>
            Adjust the transparency of the application window
          </Text>
        </div>
        <div className={styles.controlContainer}>
          <Slider
            id="opacity-slider"
            className={styles.slider}
            min={10}
            max={100}
            value={opacity}
            onChange={(_, data) => handleOpacityChange(data.value)}
          />
          <Text className={styles.sliderValueText}>{Math.round(opacity)}%</Text>
        </div>
      </Card>

      {/* 音量设置 */}
      <Card className={styles.card}>
        <Speaker224Regular className={styles.icon} />
        <div className={styles.content}>
          <Text className={styles.header}>Audio Volume</Text>
          <Text className={styles.description}>
            Adjust the audio output volume
          </Text>
        </div>
        <div className={styles.controlContainer}>
          <Slider
            id="volume-slider"
            className={styles.slider}
            min={0}
            max={100}
            value={volume}
            onChange={(_, data) => setVolume(data.value)}
          />
          <Text className={styles.sliderValueText}>{Math.round(volume)}%</Text>
        </div>
      </Card>

      {/* 波形图显示开关 */}
      <Card className={styles.card}>
        <PulseSquare24Regular className={styles.icon} />
        <div className={styles.content}>
          <Text className={styles.header}>Waveform Display</Text>
          <Text className={styles.description}>
            Show the audio waveform during playback
          </Text>
        </div>
        <div className={styles.controlContainer}>
          <Switch 
            className={styles.switch}
            checked={showWaveform}
            onChange={(_, data) => setShowWaveform(data.checked)}
          />
          <Text className={styles.switchValueText}>
            {showWaveform ? "On" : "Off"}
          </Text>
        </div>
      </Card>
    </div>
  );
};