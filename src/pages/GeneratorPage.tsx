import { 
  Text, 
  Dropdown,
  Option,
  Slider,
  Button,
  Checkbox,
  SpinButton,
  Tooltip,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarActions,
  makeStyles,
  tokens
} from "@fluentui/react-components";
import { 
  Timer20Regular,
  PlayCircle20Regular, 
  PauseCircle20Regular, 
  ArrowUndo16Regular,
  SoundWaveCircleSparkle20Regular,
  CheckmarkCircle20Filled,
  DismissCircle16Filled,
  Dismiss20Regular,
} from "@fluentui/react-icons";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTiming } from "../hooks/useTiming";
import { useTextGenerator } from "../hooks/useTextGenerator";
import { useMorsePlayer } from "../hooks/useMorsePlayer";
import { useGeneratorStore } from "../stores/generatorStore";
import type { GeneratorConfig } from "../lib/types";
import { log } from "../utils/logger";
// import { useTrainingStore } from "../stores/trainingStore";

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
    gridTemplateColumns: "0.85fr 1fr",
    gap: "35px",
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
  dropdown: {
    minWidth: "125px",
    maxWidth: "125px",
    height: "32px",
    paddingBottom: "1.5px",
    transform: "translateY(1.5px)",
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
    height: "32px",
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
    height: "32px",
    border: "none",
    paddingBottom: "1.5px",
    transform: "translateY(1.5px)",
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
  checkbox: {
    "& .fui-Checkbox__label": {
      marginLeft: "-6px",
    },
    marginRight: "-8px",
  },
  grouplengthContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  },
  controlContainer: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    flexShrink: 0,
  },
  slider: {
    width: "150px",
    transform: "translateY(1px)",
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
  tooltip: {
    backgroundColor: tokens.colorNeutralBackground1Hover,
    boxShadow: tokens.shadow2,
    maxWidth: "360px",
    whiteSpace: "normal",
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "0px",
    height: "44px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  messageContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    marginBottom: "-6px",
  },
  messageBar: {
    maxWidth: "450px",
    boxShadow: tokens.shadow2,
  },
  actionContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  countdownContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginRight: "6px",
  },
  countdownText: {
    width: "25px",
    textAlign: "right",
  },
  button: {
    width: "110px",
    height: "32px",
    border: "none",
    transform: "translateY(1.2px)",
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
  buttonText: {
    paddingBottom: "1.2px",
  },
});

// 工具函数
/** 限制数字在指定范围内 */
function clampNumber(value: number, min: number, max: number) {
  if (isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}
/** 四舍五入到最接近的步长 */
function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

// Tooltips 提示文本
const tips = {
  datasetName: "Select the character set used to generate practice material",
  practiceMode: "Choose how characters are distributed during training",
  groupLength: "Number of characters in each practice group",
  groupSpace: "Multiple of standard word space (7 dit) to separate groups",
  groupCount: "Number of character groups to generate",
  charSpeed: "Morse element speed in words per minute",
  effSpeed: "Overall transmission speed using Farnsworth timing",
  tone: "Audio tone frequency of the Morse signal",
  startDelay: "Waiting time before playback starts",
  prefixSuffix: "Add standard practice markers before and after each practice",
};

// 生成器页面组件
export const GeneratorPage = () => {
  // 使用样式
  const styles = useStyles();

  // 消息栏状态
  type MessageType = "success" | "error" | null;
  const [message, setMessage] = useState<{
    type: MessageType;
    title: string;
    content: string;
  } | null>(null);

  // 从 Store 中获取配置
  const { savedConfig, saveConfig } = useGeneratorStore();

  // 本地配置状态
  const [currentConfig, setCurrentConfig] = useState<GeneratorConfig>(savedConfig);

  // 使用生成器 Hook
  const textGen = useTextGenerator();
  const player = useMorsePlayer();
  const timing = useTiming();

  // 初始化加载配置
  useEffect(() => {
    setCurrentConfig(savedConfig);
  }, []);

  // 配置变化时自动生成文本
  useEffect(() => {
    // 如果正在播放或倒计时，先停止
    if (timing.phase !== "idle" || player.isPlaying) {
      player.stop();
      timing.stop();
    }
    textGen.generate(currentConfig);
  }, [currentConfig]);

  // 文本时长变化时更新总时长
  useEffect(() => {
    timing.setTotalDuration(textGen.duration);
  }, [textGen.duration]);

  // 监听播放状态
  useEffect(() => {
    // 同步当前时间
    timing.updateCurrentTime(player.playbackState.currentTime);
    // 播放完成时停止计时
    if (player.playbackState.status === "idle" && timing.phase === "playing") {
      timing.stop();
    }
  }, [player.playbackState]);

  // 配置更新
  const updateConfig = (updates: Partial<GeneratorConfig>) => {
    setCurrentConfig((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // 预览按钮点击
  const handlePreview = () => {
    if (timing.phase === "delay") {
      // 如果在延迟阶段，取消倒计时
      timing.stop();
      return;
    }
    
    if (player.isPlaying) {
      // 如果正在播放，暂停播放
      player.pause();
      timing.pause();
    } else if (player.isPaused) {
      // 如果已暂停，继续播放
      player.resume();
      timing.resume();
    } else {
      // 如果空闲，开始播放
      if (currentConfig.startDelay > 0) {
        // 有启动延迟，先等待
        timing.startDelay(currentConfig.startDelay, async () => {
          await player.play(textGen.text, currentConfig);
          timing.startPlaying(textGen.duration);
        });
      } else {
        // 无启动延迟，直接播放
        player.play(textGen.text, currentConfig);
        timing.startPlaying(textGen.duration);
      }
    }
  };

  // 生成按钮点击
  const handleGenerate = () => {
    try {
      // 清除之前的消息
      setMessage(null);

      // 保存配置到 store
      saveConfig(currentConfig);

      // 计算字符数提示
      let charInfo: string;
      if (currentConfig.randomGroupLength) {
        // 随机模式：显示范围
        const minChars = currentConfig.groupCount * 2;
        const maxChars = currentConfig.groupCount * 7;
        charInfo = `${minChars}-${maxChars} chars`;
      } else {
        // 固定模式：显示精确数量
        const totalChars = currentConfig.groupCount * currentConfig.groupLength;
        charInfo = `${totalChars} chars`;
      }

      // 显示成功消息
      setMessage({
        type: "success",
        title: "Training material generated successfully",
        content: `${currentConfig.datasetName} | ${currentConfig.practiceMode} | ${currentConfig.groupCount} groups | ${charInfo}`,
      });
      log.info("Training material generated", "GeneratorPage", currentConfig);

      // 3秒后自动隐藏消息
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      // 显示错误消息
      setMessage({
        type: "error",
        title: "Generation failed",
        content: error instanceof Error ? error.message : "Unknown error occurred",
      });
      log.error("Error generating text", "GeneratorPage", error);
    }
  };

  // 处理 SpinButton 变化
  const handleSpin = (
    min: number, 
    max: number, 
    field: keyof GeneratorConfig
  ) => (_: any, data: any) => {
    const raw = Number(data. value ??  data. displayValue);
    const clamped = clampNumber(raw, min, max);
    updateConfig({ [field]: clamped });
  };

  // 音调拖拽控制
  const toneRef = useRef<number>(currentConfig.tone);
  const [isDragging, setIsDragging] = useState(false);
  const [tempToneValue, setTempToneValue] = useState<number | null>(null);
  // 处理 tone 变化（带拖拽状态跟踪）
  const handleToneChangeStart = () => {
    setIsDragging(true);
    setTempToneValue(currentConfig.tone);
  };
  const handleToneChange = (value: number) => {
    // 更新临时值（用于显示当前拖拽位置）
    toneRef.current = value;
    // 如果正在拖拽，显示临时值
    if (isDragging) {
      const roundedValue = roundToNearest(value, 5);
      setTempToneValue(roundedValue);
    } else {
      // 如果不是拖拽，直接更新配置
      const roundedValue = roundToNearest(value, 5);
      updateConfig({ tone: roundedValue });
    }
  };
  const handleToneChangeEnd = () => {
    setIsDragging(false);
    // 拖拽结束时，应用最终值
    if (tempToneValue !== null) {
      const finalValue = clampNumber(
        roundToNearest(tempToneValue, 5),
        300,
        1500
      );
      updateConfig({ tone: finalValue });
    }
    setTempToneValue(null);
  };

  // 时间显示逻辑
  const displayTime = useMemo(() => {
    if (timing.phase === "idle") {
      return timing.formattedTotalDuration;
    } else if (timing.phase === "delay") {
      return timing.formattedDelayCountdown;
    } else {
      return timing.formattedCountdown;
    }
  }, [
    timing.phase, 
    timing.formattedTotalDuration, 
    timing.formattedDelayCountdown, 
    timing.formattedCountdown
  ]);

  // 预览按钮图标及文本
  const previewButtonConfig = useMemo(() => {
    if (timing.phase === "delay") {
      return { icon: <ArrowUndo16Regular />, text: "Cancel" };
    }
    if (player.isPlaying) {
      return { icon: <PauseCircle20Regular />, text: "Pause" };
    }
    return { icon: <PlayCircle20Regular />, text: "Preview" };
  }, [timing.phase, player.isPlaying]);

  // 其他
  const displayToneValue = useMemo(() => {
    return isDragging && tempToneValue !== null ? tempToneValue : currentConfig.tone;
  }, [isDragging, tempToneValue, currentConfig.tone]);

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
                  children: tips.datasetName,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Training dataset:</Text>
              </Tooltip>
            </div>
            <Dropdown 
              id="dataset-dropdown"
              className={styles.dropdown}
              listbox={{ className: styles.dropdownListbox }}
              value={currentConfig.datasetName}
              selectedOptions={[currentConfig.datasetName]}
              onOptionSelect={(_, data) => 
                updateConfig({ datasetName: data.optionValue as GeneratorConfig["datasetName"] })
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
              id="practice-mode-dropdown"
              className={styles.dropdown}
              listbox={{ className: styles.dropdownListbox }}
              value={currentConfig.practiceMode}
              selectedOptions={[currentConfig.practiceMode]}
              onOptionSelect={(_, data) => 
                updateConfig({ practiceMode: data.optionValue as GeneratorConfig["practiceMode"] })
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
                <Text>Group length:</Text>
              </Tooltip>
            </div>
            <div
              className={styles.grouplengthContainer}
              style={{
                opacity: currentConfig.randomGroupLength ? 0.5 : 1,
                pointerEvents: currentConfig.randomGroupLength ? "none" : "auto"
              }}
            >
              <SpinButton
                id="group-length-spin"
                className={styles.spinbutton}
                min={1}
                max={10}
                value={currentConfig.groupLength}
                onChange={handleSpin(1, 10, "groupLength")}
              />
              <Text>fixed</Text>
            </div>
            <Checkbox
              id="random-group-length-checkbox"
              className={styles.checkbox}
              label="2-7 random"
              checked={currentConfig.randomGroupLength}
              onChange={(_, data) => 
                updateConfig({ randomGroupLength: data.checked === true })
              }
            />
          </div>

          {/* 组间间隔 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.groupSpace,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Group space:</Text>
              </Tooltip>
            </div>
            <SpinButton
              id="group-space-spin"
              className={styles.spinbutton}
              min={1}
              max={10}
              value={currentConfig.groupSpace}
              onChange={handleSpin(1, 10, "groupSpace")}
            />
            <Text>× 7 dits</Text>
          </div>

          {/* 组数 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: tips.groupCount,
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>Group count:</Text>
              </Tooltip>
            </div>
            <SpinButton
              id="group-count-spin"
              className={styles.spinbutton}
              min={1}
              max={30}
              value={currentConfig.groupCount}
              onChange={handleSpin(1, 30, "groupCount")}
            />
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
                id="char-speed-slider"
                className={styles.slider}
                min={5}
                max={50}
                value={currentConfig.charSpeed}
                onChange={(_, data) => updateConfig({ charSpeed: data.value })}
              />
              <Text className={styles.sliderValueText}>{currentConfig.charSpeed} WPM</Text>
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
                id="eff-speed-slider"
                className={styles.slider}
                min={0}
                max={50}
                value={currentConfig.effSpeed}
                onChange={(_, data) => updateConfig({ effSpeed: data.value })}
              />
              <Text className={styles.sliderValueText}>{currentConfig.effSpeed} WPM</Text>
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
                id="tone-slider"
                className={styles.slider}
                min={300}
                max={1500}
                value={displayToneValue}
                onChange={(_, data) => handleToneChange(data.value)}
                onPointerDown={handleToneChangeStart}
                onPointerUp={handleToneChangeEnd}
                onKeyDown={handleToneChangeStart}
                onKeyUp={handleToneChangeEnd}
              />
              <Text className={styles.sliderValueText}>
                {displayToneValue} Hz
              </Text>
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
              id="start-delay-spin"
              className={styles.spinbutton}
              min={0}
              max={30}
              value={currentConfig.startDelay}
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
                id="prefix-suffix-checkbox"
                className={styles.checkbox}
                label="VVV = / AR"
                checked={currentConfig.usePrefixSuffix}
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
        <div className={styles.messageContainer}>
          {message && (
            <MessageBar
              className={styles.messageBar}
              intent={message.type === "success" ? "success" : "error"}
              icon={
                message.type === "success"
                  ? <CheckmarkCircle20Filled />
                  : <DismissCircle16Filled />
              }
            >
              <MessageBarBody>
                <MessageBarTitle>{message.title}</MessageBarTitle>
                <div>{message.content}</div>
              </MessageBarBody>
              <MessageBarActions
                containerAction={
                  <Button
                    appearance="transparent"
                    icon={<Dismiss20Regular />}
                    onClick={() => setMessage(null)}
                  />
                }
              />
            </MessageBar>
          )}
        </div>
        <div className={styles.actionContainer}>
          {/* 倒计时显示 */}
          <div className={styles.countdownContainer}>
            <Timer20Regular />
            <Text className={styles.countdownText}>
              {displayTime}
            </Text>
          </div>
          {/* 预览按钮 */}
          <Button
            className={styles.button}
            icon={previewButtonConfig.icon}
            onClick={handlePreview}
          >
            <Text className={styles.buttonText}>
              {previewButtonConfig.text}
            </Text>
          </Button>
          {/* 生成按钮 */}
          <Button
            className={styles.button}
            icon={<SoundWaveCircleSparkle20Regular />}
            onClick={handleGenerate}
          >
            <Text className={styles.buttonText}>
              Generate
            </Text>
          </Button>
        </div>
      </div>
    </div>
  );
};