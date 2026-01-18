import { 
  Text, 
  Dropdown,
  Option,
  Slider,
  Button,
  Checkbox,
  SpinButton,
  Tooltip,
  makeStyles,
  tokens
} from "@fluentui/react-components";
import { 
  Timer20Regular,
  PlayCircle20Regular, 
  PauseCircle20Regular, 
  SoundWaveCircleSparkle20Regular
} from "@fluentui/react-icons";
import { useEffect } from "react";
import { useMorseGenerator } from "../hooks/useMorseGenerator";
import { useGeneratorStore } from "../stores/generatorStore";
import { useTrainingStore } from "../stores/trainingStore";
import { CourseManager } from "../services/courseManager";
import { TextGenerator } from "../services/textGenerator";
import type { TrainingSet, PracticeMode } from "../lib/types";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "5px 10px",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "0.8fr 1fr",
    gap: "45px",
    margin: "0",
    flex: 1,
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
    marginTop: "-6px",
  },
  settingItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "6px",
    padding: "5px 0px",
  },
  textContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  control: {
    flexShrink: 0,
  },
  dropdown: {
    minWidth: "125px",
    maxWidth: "125px",
    paddingBottom: "1.5px",
    border: "none",
    boxShadow: tokens.shadow2,
    "::after": {
      display: "none",
    },
    backgroundColor: tokens.colorNeutralBackground3,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground3Pressed,
    },
  },
  dropdownListbox: {
    minWidth: "125px",
    maxWidth: "125px",
    backgroundColor: tokens.colorNeutralBackground4,
  },
  dropdownOption: {
    position: "relative",
    paddingLeft: "12px",
    paddingTop: "4px",
    backgroundColor: tokens.colorNeutralBackground4,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground4Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground4Pressed,
    },
    "&[aria-selected='true']": {
      backgroundColor: tokens.colorNeutralBackground4Selected,
    },
    "&[aria-selected='true']:hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
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
    border: "none",
    boxShadow: tokens.shadow2,
    backgroundColor: tokens.colorNeutralBackground3,
    "::before": {
      display: "none",
    },
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground3Pressed,
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
      border: `4px solid ${tokens.colorNeutralBackground3Selected}`,
      boxShadow: tokens.shadow2,
    },
    flexShrink: 0,
  },
  sliderValueText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    minWidth: "50px",
    textAlign: "right",
    flexShrink: 0,
  },
  actionBar: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    paddingTop: "12px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tooltip: {
    backgroundColor: tokens.colorNeutralBackground1Hover,
    boxShadow: tokens.shadow2,
    maxWidth: "360px",
    whiteSpace: "normal",
  },
  countdownContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: tokens.colorNeutralForeground2,
  },
  countdownText: {
    width: "25px",
    textAlign: "right",
  },
  button: {
    width: "110px",
    height: "32px",
    border: "none",
    boxShadow: tokens.shadow2,
    fontWeight: tokens.fontWeightRegular,
    backgroundColor: tokens.colorNeutralBackground3,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground3Pressed,
    },
  },
});

// 工具函数
function clampNumber(value: number, min: number, max: number) {
  if (isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

// 生成器页面组件
export const GeneratorPage = () => {
  const styles = useStyles();

  // Tooltips 提示文本
  const tips = {
    trainingSet: "Select the character set used to generate practice material",
    practiceMode: "Choose how characters are distributed during training",
    groupLength: "Number of characters in each practice group",
    groupSpacing: "Silent spacing between groups in dits",
    duration: "Total length of generated training audio",
    charSpeed: "Morse element speed in words per minute",
    effSpeed: "Overall transmission speed using Farnsworth timing",
    tone: "Audio tone frequency of the Morse signal",
    startDelay: "Waiting time before playback starts",
    prefixSuffix: "Add standard practice markers before and after each practice",
  };

  // 从 Store 中获取配置和操作函数
  const { config, updateConfig, setGeneratedText } = useGeneratorStore();

  // 使用生成器 Hook
  const {
    playPreview,
    stopPreview,
    isPreviewPlaying,
    previewCountdown,
    saveConfig,
    loadConfig,
  } = useMorseGenerator();

  // 初始化加载配置
  useEffect(() => {
    const savedConfig = loadConfig();
    if (savedConfig) {
      updateConfig(savedConfig);
      console.log("Loaded saved config");
    }
  }, [loadConfig, updateConfig]);

  // 配置自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      saveConfig(config);
    }, 500);
    return () => clearTimeout(timer);
  }, [config, saveConfig]);

  // 处理预览按钮点击
  const handlePreview = () => { 
    if (isPreviewPlaying) {
      stopPreview();
    } else {
      playPreview(config);
    }
  };

  // 处理生成按钮点击
  const { currentLesson } = useTrainingStore();
  const handleGenerate = () => {
    try {
      const courseManager = new CourseManager(config.trainingSet);
      const lesson = courseManager.getLesson(currentLesson);
      const textGen = new TextGenerator();
      const text = textGen.generate({
        charSet: lesson.chars,
        mode: config.practiceMode,
        groupLength: config. groupLength,
        groupSpacing: config.groupSpacing,
        targetDuration: config.duration * 60,
        audioConfig: {
          charSpeed: config.charSpeed,
          effSpeed: config.effSpeed,
          tone: config.tone,
          volume: 0.8,
        },
        usePrefixSuffix: config.usePrefixSuffix,
      })
      setGeneratedText(text);
      console.log("Generated text:", text);
    } catch (error) {
      console.error("Error generating text:", error);
    }
  };

  // 处理 SpinButton 变化
  const handleSpin = (
    min: number, 
    max: number, 
    field: keyof typeof config
  ) => (_: any, data: any) => {
    const raw = Number(data. value ??  data. displayValue);
    const clamped = clampNumber(raw, min, max);
    updateConfig({ [field]: clamped });
  };

  // 渲染
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 左侧栏 */}
        <div className={styles.column}>
          {/* 训练集 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.trainingSet,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Training dataset:</Text>
              </Tooltip>
            </div>
            <Dropdown 
              className={styles.dropdown}
              listbox={{ className: styles.dropdownListbox }}
              value={config.trainingSet}
              selectedOptions={[config.trainingSet]}
              onOptionSelect={(_, data) => 
                updateConfig({ trainingSet: data.optionValue as TrainingSet })
              }
            >
              <Option value="Koch-LCWO" className={styles.dropdownOption} checkIcon={null}>
                Koch-LCWO
              </Option>
              <Option value="Letters" className={styles.dropdownOption} checkIcon={null}>
                Letters
              </Option>
              <Option value="Numbers" className={styles.dropdownOption} checkIcon={null}>
                Numbers
              </Option>
              <Option value="Punctuation" className={styles.dropdownOption} checkIcon={null}>
                Punctuation
              </Option>
            </Dropdown>
          </div>

          {/* 训练模式 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.practiceMode,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Practice mode:</Text>
              </Tooltip>
            </div>
            <Dropdown 
              className={styles.dropdown}
              listbox={{ className: styles.dropdownListbox }}
              value={config.practiceMode}
              selectedOptions={[config.practiceMode]}
              onOptionSelect={(_, data) => 
                updateConfig({ practiceMode: data.optionValue as PracticeMode })
              }
            >
              <Option value="Uniform" className={styles.dropdownOption} checkIcon={null}>
                Uniform
              </Option>
              <Option value="New focus" className={styles.dropdownOption} checkIcon={null}>
                New focus
              </Option>
              <Option value="Gradual" className={styles.dropdownOption} checkIcon={null}>
                Gradual
              </Option>
              <Option value="Weighted" className={styles.dropdownOption} checkIcon={null}>
                Weighted
              </Option>
            </Dropdown>
          </div>

          {/* 每组字符长度 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.groupLength,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Group length (characters):</Text>
              </Tooltip>
            </div>
            <SpinButton
              className={styles.spinbutton}
              min={1}
              max={10}
              value={config.groupLength}
              onChange={handleSpin(1, 10, "groupLength")}
            />
            <Text>chars</Text>
          </div>

          {/* 组间间隔 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.groupSpacing,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Group spacing (dits):</Text>
              </Tooltip>
            </div>
            <SpinButton
              className={styles.spinbutton}
              min={1}
              max={10}
              value={config.groupSpacing}
              onChange={handleSpin(1, 10, "groupSpacing")}
            />
            <Text>dits</Text>
          </div>

          {/* 音频总时长 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.duration,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Duration (minutes):</Text>
              </Tooltip>
            </div>
            <SpinButton
              className={styles.spinbutton}
              min={1}
              max={10}
              value={config.duration}
              onChange={handleSpin(1, 10, "duration")}
            />
            <Text>min</Text>
          </div>
        </div>

        {/* 右侧栏 */}
        <div className={styles.column}>
          {/* 字符速率 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.charSpeed,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Character speed (WPM):</Text>
              </Tooltip>
            </div>
            <div className={styles.controlContainer}>
              <Slider
                className={styles.slider}
                min={5}
                max={50}
                value={config.charSpeed}
                onChange={(_, data) => updateConfig({ charSpeed: data.value })}
              />
              <Text className={styles.sliderValueText}>{config.charSpeed} WPM</Text>
            </div>
          </div>

          {/* 有效速率 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.effSpeed,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Effective speed (WPM):</Text>
              </Tooltip>
            </div>
            <div className={styles.controlContainer}>
              <Slider
                className={styles.slider}
                min={0}
                max={50}
                value={config.effSpeed}
                onChange={(_, data) => updateConfig({ effSpeed: data.value })}
              />
              <Text className={styles.sliderValueText}>{config.effSpeed} WPM</Text>
            </div>
          </div>

          {/* 音调 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.tone,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Tone (Hz):</Text>
              </Tooltip>
            </div>
            <div className={styles.controlContainer}>
              <Slider
                className={styles.slider}
                min={300}
                max={1500}
                value={config.tone}
                onChange={(_, data) => updateConfig({ tone: data.value })}
              />
              <Text className={styles.sliderValueText}>{config.tone} Hz</Text>
            </div>
          </div>

          {/* 启动延迟时间 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.startDelay,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Start delay (seconds):</Text>
              </Tooltip>
            </div>
            <SpinButton
              className={styles.spinbutton}
              min={1}
              max={30}
              value={config.startDelay}
              onChange={handleSpin(1, 30, "startDelay")}
            />
            <Text>s</Text>
          </div>

          {/* 前后缀提示 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.prefixSuffix,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Prefix / Suffix:</Text>
              </Tooltip>
            </div>
            <div className={styles.controlContainer}>
              <Checkbox 
                label="VVV = / AR"
                checked={config.usePrefixSuffix}
                onChange={(_, data) => 
                  updateConfig({ usePrefixSuffix: data.checked === true })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className={styles.actionBar}>
        <div className={styles.countdownContainer}>
          <Timer20Regular />
          <Text className={styles.countdownText}>
            {isPreviewPlaying ? `${previewCountdown} s` : '20 s'}
          </Text>
        </div>
        {/* 预览按钮 */}
        <Button
          className={styles.button}
          icon={isPreviewPlaying ? <PauseCircle20Regular /> : <PlayCircle20Regular />}
          onClick={handlePreview}
        >
          {isPreviewPlaying ? "Pause" : "Preview"}
        </Button>
        {/* 生成按钮 */}
        <Button
          className={styles.button}
          icon={<SoundWaveCircleSparkle20Regular />}
          onClick={handleGenerate}
        >
          Generate
        </Button>
      </div>
    </div>
  );
};