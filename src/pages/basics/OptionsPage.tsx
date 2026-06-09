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
  mergeClasses,
  tokens
} from "@fluentui/react-components";
import { 
  ChevronDown16Regular,
  Timer20Regular,
  PlayCircle20Regular, 
  PauseCircle20Regular, 
  ArrowUndo16Regular,
  ArrowRepeatAll20Regular,
  CheckmarkCircle20Regular,
  CheckmarkCircle20Filled,
  DismissCircle16Filled,
  Dismiss20Regular,
} from "@fluentui/react-icons";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTiming } from "../../hooks/useTiming";
import { useTextGenerator } from "../../hooks/useTextGenerator";
import { useMorsePlayer } from "../../hooks/useMorsePlayer";
import { useOptionsStore } from "../../stores/optionsStore";
import { useSettingsStore } from "../../stores/settingsStore";
import type { OptionsConfig } from "../../lib/types";
import { clampNumber, roundToNearest } from "../../services/statisticalToolset";
import { log } from "../../utils/logger";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    padding: "12px 15px",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "0.95fr 1fr",
    gap: "45px",
    margin: "0",
    flex: 1,
    marginTop: "-7px",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  settingItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "6px",
  },
  textContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  dropdown: {
    minWidth: "120px",
    maxWidth: "120px",
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
    minWidth: "120px",
    maxWidth: "120px",
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground5,
  },
  dropdownListboxWithHeight: {
    height: "166px",
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
    "& button[disabled]": {
      pointerEvents: "none",
    },
    "& button[aria-disabled='true']": {
      pointerEvents: "none",
    },
  },
  checkbox: {
    height: "32px",
    "& .fui-Checkbox__indicator": {
      marginTop: "9px",
    },
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
    width: "160px",
    minWidth: "160px",
    maxWidth: "160px",
    transform: "translateY(1px)",
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
    flexGrow: 0,
  },
  sliderValueText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    width: "65px",
    minWidth: "65px",
    maxWidth: "65px",
    textAlign: "right",
    flexShrink: 0,
  },
  tooltip: {
    backgroundColor: tokens.colorNeutralBackground4Hover,
    boxShadow: tokens.shadow2,
    maxWidth: "360px",
    whiteSpace: "normal",
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "0px",
    height: "40px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  messageContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    marginBottom: "-6.5px",
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

// 下拉框选项
const datasetOptions = ["koch-lcwo", "letters", "numbers", "punctuation"] as const;
const practiceModeOptions = ["uniform", "newFocus", "gradual", "weighted"] as const;

// 生成器页面组件
export const OptionsPage = () => {
  // 使用样式
  const styles = useStyles();

  // 使用 i18n 获取翻译函数
  const { t } = useTranslation();
  // 获取当前语言设置
  const { language } = useSettingsStore();

  // 消息栏状态
  type MessageType = "success" | "error" | null;
  const [message, setMessage] = useState<{
    type: MessageType;
    title: string;
    content: string;
  } | null>(null);

  // 从 Store 中获取配置
  const { savedConfig, saveConfig } = useOptionsStore();

  // 本地配置状态
  const [currentConfig, setCurrentConfig] = useState<OptionsConfig>(savedConfig);

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

  // 文本变化时更新播放器和时长
  useEffect(() => {
    if (textGen.text && textGen.duration > 0) {
      // 文本生成后预加载到播放器
      player.preload(textGen.text, currentConfig);
    }
  }, [textGen.text]);

  // 音频总时长（优先级回退）
  const displayTotalDuration = useMemo(() => {
    // 优先使用播放器的总时长（更准确），其次使用生成器的时长
    if (player.playbackState.totalDuration > 0) {
      return player.playbackState.totalDuration;
    }
    return textGen.duration;
  }, [player.playbackState.totalDuration, textGen.duration]);

  // 音频时长同步
  useEffect(() => {
    timing.setTotalDuration(displayTotalDuration);
  }, [displayTotalDuration]);

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
  const updateConfig = (updates: Partial<OptionsConfig>) => {
    setCurrentConfig((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // 预览按钮点击
  const handlePreview = async () => {
    if (timing.phase === "delay") {
      // 如果在延迟阶段，取消倒计时
      timing.stop();
      return;
    }
    if (player.isPlaying) {
      // 如果正在播放，暂停播放
      player.pause();
      timing.pause();
      return;
    } 
    if (player.playbackState.totalDuration > 0 &&
        player.playbackState.currentTime >= displayTotalDuration - 0.01) {
      // 如果已播放完成，重新开始
      player.stop();
      timing.stop();
      timing.updateCurrentTime(0);
      textGen.generate(currentConfig);
      return;
    }
    if (player.isPaused) {
      // 如果已暂停，继续播放
      player.resume();
      timing.resume();
      return;
    }
    // 如果空闲，开始播放
    if (currentConfig.startDelay > 0) {
      // 有启动延迟，先等待
      timing.startDelay(currentConfig.startDelay, async () => {
        await player.play();
        timing.startPlaying(displayTotalDuration);
      });
    } else {
      // 无启动延迟，直接播放
      await player.play();
      timing.startPlaying(displayTotalDuration);
    }
  };

  // 确认按钮点击
  const handleConfirm = () => {
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
        charInfo = `${minChars}-${maxChars}`;
      } else {
        // 固定模式：显示精确数量
        const totalChars = currentConfig.groupCount * currentConfig.groupLength;
        charInfo = `${totalChars}`;
      }

      // 显示成功消息
      setMessage({
        type: "success",
        title: t("basics.options.messages.success.title"),
        content: t("basics.options.messages.success.content", {
          dataset: t(`basics.options.datasets.${currentConfig.datasetName}`),
          mode: t(`basics.options.modes.${currentConfig.practiceMode}`),
          groupCount: currentConfig.groupCount,
          charInfo: charInfo
        }),
      });
      log.info("Training material setup successfully", "OptionsPage", currentConfig);

      // 3秒后自动隐藏消息
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      // 显示错误消息
      setMessage({
        type: "error",
        title: t("basics.options.messages.error.title"),
        content: error instanceof Error ? error.message : t("basics.options.messages.error.unknown"),
      });
      log.error("Error setting up training material", "OptionsPage", error);
    }
  };

  // 处理 SpinButton 变化
  const handleSpin = (
    min: number, 
    max: number, 
    field: keyof OptionsConfig
  ) => (_: any, data: any) => {
    const rawText = String(data.value ?? data.displayValue ?? "");
    const cleaned = rawText.replace(/\D/g, "");
    if (cleaned === "") {
      updateConfig({ [field]: min });
      return;
    }
    const raw = Number(cleaned);
    const clamped = clampNumber(raw, min, max);
    if (currentConfig[field] !== clamped) {
      updateConfig({ [field]: clamped });
    }
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
      const finalValue = clampNumber(roundToNearest(tempToneValue, 5), 300, 1500);
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
      return { icon: <ArrowUndo16Regular />, text: t("basics.options.buttons.cancel") };
    }
    if (player.isPlaying) {
      return { icon: <PauseCircle20Regular />, text: t("basics.options.buttons.pause") };
    }
    if (player.playbackState.totalDuration > 0 &&
        player.playbackState.currentTime >= displayTotalDuration - 0.01) {
      return { icon: <ArrowRepeatAll20Regular />, text: t("basics.options.buttons.retry") };
    } 
    if (player.isPaused) {
      return { icon: <PlayCircle20Regular />, text: t("basics.options.buttons.resume") };
    }
    return { icon: <PlayCircle20Regular />, text: t("basics.options.buttons.preview") };
  }, [timing.phase, player.isPlaying, player.isPaused, player.playbackState]);

  // 其他
  const displayToneValue = useMemo(() => {
    return isDragging && tempToneValue !== null ? tempToneValue : currentConfig.tone;
  }, [isDragging, tempToneValue, currentConfig.tone]);

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
                  children: t("basics.options.tooltips.trainingDataset"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("basics.options.labels.trainingDataset")}</Text>
              </Tooltip>
            </div>
            <Dropdown 
              id="dataset-dropdown"
              className={styles.dropdown}
              expandIcon={<ChevronDown16Regular />}
              listbox={{ 
                className: mergeClasses(
                  styles.dropdownListbox,
                  datasetOptions.length >= 5 && styles.dropdownListboxWithHeight
                )
              }}
              value={t(`basics.options.datasets.${currentConfig.datasetName}`)}
              selectedOptions={[currentConfig.datasetName]}
              onOptionSelect={(_, data) => 
                updateConfig({ datasetName: data.optionValue as OptionsConfig["datasetName"] })
              }
            >
              {datasetOptions.map((dataset) => (
                <Option 
                  key={dataset}
                  value={dataset} 
                  className={styles.dropdownOption} 
                  checkIcon={null}
                >
                  {t(`basics.options.datasets.${dataset}`)}
                </Option>
              ))}
            </Dropdown>
          </div>

          {/* 训练模式 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: t("basics.options.tooltips.practiceMode"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("basics.options.labels.practiceMode")}</Text>
              </Tooltip>
            </div>
            <Dropdown 
              id="practice-mode-dropdown"
              className={styles.dropdown}
              expandIcon={<ChevronDown16Regular />}
              listbox={{ 
                className: mergeClasses(
                  styles.dropdownListbox,
                  practiceModeOptions.length >= 5 && styles.dropdownListboxWithHeight
                )
              }}
              value={t(`basics.options.modes.${currentConfig.practiceMode}`)}
              selectedOptions={[currentConfig.practiceMode]}
              onOptionSelect={(_, data) => 
                updateConfig({ practiceMode: data.optionValue as OptionsConfig["practiceMode"] })
              }
            >
              {practiceModeOptions.map((mode) => (
                <Option 
                  key={mode}
                  value={mode}
                  className={styles.dropdownOption} 
                  checkIcon={null}
                >
                  {t(`basics.options.modes.${mode}`)}
                </Option>
              ))}
            </Dropdown>
          </div>

          {/* 每组字符长度 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: t("basics.options.tooltips.groupLength"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("basics.options.labels.groupLength")}</Text>
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
                {...numericSpinProps}
              />
              <Text>{t("basics.options.labels.fixed")}</Text>
            </div>
            <Checkbox
              id="random-group-length-checkbox"
              className={styles.checkbox}
              label={t("basics.options.labels.random")}
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
                  children: t("basics.options.tooltips.groupSpace"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("basics.options.labels.groupSpace")}</Text>
              </Tooltip>
            </div>
            <SpinButton
              id="group-space-spin"
              className={styles.spinbutton}
              min={1}
              max={10}
              value={currentConfig.groupSpace}
              onChange={handleSpin(1, 10, "groupSpace")}
              {...numericSpinProps}
            />
            <Text>× 7 {t("basics.options.units.dits")}</Text>
          </div>

          {/* 组数 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: t("basics.options.tooltips.groupCount"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("basics.options.labels.groupCount")}</Text>
              </Tooltip>
            </div>
            <SpinButton
              id="group-count-spin"
              className={styles.spinbutton}
              min={1}
              max={30}
              value={currentConfig.groupCount}
              onChange={handleSpin(1, 30, "groupCount")}
              {...numericSpinProps}
            />
          </div>

          {/* 波形显示 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: t("basics.options.tooltips.waveform"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("basics.options.labels.waveform")}</Text>
              </Tooltip>
            </div>
            <Checkbox
              id="waveform-checkbox"
              className={styles.checkbox}
              label={currentConfig.showWaveform 
                      ? t("basics.options.status.on") 
                      : t("basics.options.status.off")}
              checked={currentConfig.showWaveform}
              onChange={(_, data) => 
                updateConfig({ showWaveform: data.checked === true })
              }
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
                  children: t("basics.options.tooltips.charSpeed"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("basics.options.labels.charSpeed")}</Text>
              </Tooltip>
            </div>
            <div className={styles.controlContainer}>
              <Slider
                id="char-speed-slider"
                className={styles.slider}
                style={{ marginRight: language === "English" ? "-10px" : "-6px" }}
                min={5}
                max={50}
                value={currentConfig.charSpeed}
                onChange={(_, data) => updateConfig({ charSpeed: data.value })}
              />
              <Text className={styles.sliderValueText}>
                {currentConfig.charSpeed} {t("basics.options.units.wpm")}
              </Text>
            </div>
          </div>

          {/* 有效速率 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: t("basics.options.tooltips.effSpeed"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("basics.options.labels.effSpeed")}</Text>
              </Tooltip>
            </div>
            <div className={styles.controlContainer}>
              <Slider
                id="eff-speed-slider"
                className={styles.slider}
                style={{ marginRight: language === "English" ? "-10px" : "-6px" }}
                min={0}
                max={50}
                value={currentConfig.effSpeed}
                onChange={(_, data) => updateConfig({ effSpeed: data.value })}
              />
              <Text className={styles.sliderValueText}>
                {currentConfig.effSpeed} {t("basics.options.units.wpm")}
              </Text>
            </div>
          </div>

          {/* 音调 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: t("basics.options.tooltips.tone"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("basics.options.labels.tone")}</Text>
              </Tooltip>
            </div>
            <div className={styles.controlContainer}>
              <Slider
                id="tone-slider"
                className={styles.slider}
                style={{ marginRight: language === "English" ? "-10px" : "-6px" }}
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
                {displayToneValue} {t("basics.options.units.hz")}
              </Text>
            </div>
          </div>

          {/* 启动延迟时间 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: t("basics.options.tooltips.startDelay"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("basics.options.labels.startDelay")}</Text>
              </Tooltip>
            </div>
            <SpinButton
              id="start-delay-spin"
              className={styles.spinbutton}
              min={0}
              max={30}
              value={currentConfig.startDelay}
              onChange={handleSpin(0, 30, "startDelay")}
              {...numericSpinProps}
            />
            <Text>{t("basics.options.units.seconds")}</Text>
          </div>

          {/* 前后缀提示 */}
          <div className={styles.settingItem}>
            <div className={styles.textContent}>
              <Tooltip
                content={{
                  children: t("basics.options.tooltips.prefixSuffix"),
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="below-start"
              >
                <Text>{t("basics.options.labels.prefixSuffix")}</Text>
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
          {/* 确认按钮 */}
          <Button
            className={styles.button}
            icon={<CheckmarkCircle20Regular />}
            onClick={handleConfirm}
          >
            <Text className={styles.buttonText}>
              {t("basics.options.buttons.confirm")}
            </Text>
          </Button>
        </div>
      </div>
    </div>
  );
};