import { 
  Text,
  Input,
  Button,
  Slider,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { 
  Fire20Regular,
  CheckmarkCircle20Regular,
  ArrowRepeatAll20Regular,
  PlayCircle20Regular, 
  PauseCircle20Regular, 
  ArrowUndo16Regular,
  ArrowCounterclockwise20Regular,
  ArrowCircleLeft20Regular,
} from "@fluentui/react-icons";
import { 
  generateRandomTone, 
  calculateAccuracy, 
  calculateScore 
} from "../services/statisticalToolset";
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import type { AudioConfig, AccuracyResult, TrainingResult } from "../lib/types";
import { useTiming } from "../hooks/useTiming";
import { useTextGenerator } from "../hooks/useTextGenerator";
import { useMorsePlayer } from "../hooks/useMorsePlayer";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    padding: "12px 15px",
    gap: "5px",
  },
  // 信息展示
  inforSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "-5px",
  },
  speedSection: {
    display: "flex",
    alignItems: "center",
  },
  speedText: {
    width: "230px",
  },
  scoreText: {
    width: "150px",
    textAlign: "right",
  },
  valueText: {
    fontWeight: tokens.fontWeightSemibold,
  },
  // 文本输入与音频控制
  controlSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  audioSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  tooltip: {
    backgroundColor: tokens.colorNeutralBackground2Hover,
    boxShadow: tokens.shadow2,
    maxWidth: "280px",
    whiteSpace: "normal",
  },
  input: {
    height: "32px",
    border: "none",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground4,
    boxShadow: tokens.shadow2,
    transform: "translateY(1.2px)",
    "& input": {
      fontFamily: tokens.fontFamilyMonospace,
      fontSize: "14px",
    },
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground4Hover,
    },
    ":focus-within": {
      backgroundColor: tokens.colorNeutralBackground4Pressed,
    },
    ":focus-within:hover": {
      backgroundColor: tokens.colorNeutralBackground4Pressed,
    },
    "::selection": {
      backgroundColor: tokens.colorCompoundBrandBackground,
    },
  },
  slider: {
    width: "180px",
    transform: "translateY(1px)",
    marginRight: "-14px",
    "& .fui-Slider__thumb": {
      backgroundColor: tokens.colorNeutralBackground3Selected,
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
  audioTimeContainer: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  currentTimeText: {
    minWidth: "40px",
    textAlign: "right",
  },
  totalTimeText: {
    minWidth: "30px",
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
    "&:disabled": {
      cursor: "not-allowed",
      backgroundColor: tokens.colorNeutralBackground4,
      color: tokens.colorNeutralForegroundDisabled,
    },
  },
  buttonWidth: {
    width: "90px",
    minWidth: "90px",
  },
  buttonText: {
    paddingBottom: "1.4px",
  },
  // 结果展示
  resultSection: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "6px",
    gap: "2.5px",
    position: "relative"
  },
  tableContainer: {
    flex: 1,
    backgroundColor: tokens.colorNeutralBackground4Pressed,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    overflow: "hidden",
  },
  tableContHeight: {
    height: "173.5px",
  },
  tableContHeightShort: {
    height: "139px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
    display: "table",
    "& thead tr": {
      height: "17.25px",
      backgroundColor: tokens.colorNeutralBackground3Pressed,
    },
    "& thead th": {
      height: "17.25px",
      padding: "0px 0px",
      textAlign: "center",
      verticalAlign: "middle",
      borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
      borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
      ":last-child": {
        borderRight: "none",
      },
    },
    "& tbody tr": {
      height: "17.25px",
    },
    "& tbody td": {
      height: "17.25px",
      padding: "0px 0px",
      verticalAlign: "middle",
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
      borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
      ":last-child": {
        borderRight: "none",
      },
    },
    "& tbody tr:last-child td": {
      borderBottom: "none",
    },
  },
  tableHeight: {
    height: "172.5px",
  },
  tableHeightShort: {
    height: "138px",
  },
  tableHeader: {
    fontSize: "12.5px",
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyMonospace,
    lineHeight: "normal",
    padding: "0px",
    display: "block",
    textAlign: "center",
  },
  tableText: {
    fontSize: "12.5px",
    fontFamily: tokens.fontFamilyMonospace,
    lineHeight: "normal",
    padding: "0px",
    paddingLeft: "1.5px",
    display: "block",
  },
  // 结果对比文本
  correctChar: {
    color: "#69b330",
  },
  incorrectChar: {
    color: "#f94144",
    backgroundColor: "#fee4e5",
  },
  missingChar: {
    color: "#f8be37",
    backgroundColor: "#fef6e2",
  },
  extraChar: {
    color: "#277da1",
    backgroundColor: "#dbeef6",
  },
  // 返回
  returnSection: {
    position: "absolute",
    bottom: "0px",
    right: "0px",
  },
});

// 训练阶段类型
type TrainingPhase = "notStarted" | "training" | "completed";

// 训练组件通用配置和回调接口
interface GenericTrainingProps {
  config: {
    charSpeed: number;
    minCharSpeed: number;
    fixedCharSpeed: boolean;
    tone: number;
    randomTone: boolean;
    [key: string]: any;
  };
  dataLoader: (count: number, datasetOrFilter: any) => Promise<string[]>;
  inputPlaceholder: string;
  inputWidth: string;
  inputMaxLength: number;
  idPrefix: string;
  tooltips: {
    start: string;
    next: string;
    retry: string;
    repeat: string;
  };
  blindMode?: boolean;
  onBack: () => void;
}

export const GenericTraining = ({ 
  config,
  dataLoader,
  inputPlaceholder,
  inputWidth,
  inputMaxLength,
  idPrefix,
  tooltips,
  blindMode = false,
  onBack,
}: GenericTrainingProps) => {
  // 使用样式
  const styles = useStyles();

  // 训练数据及索引状态
  const [items, setItems] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 训练阶段状态
  const [trainingPhase, setTrainingPhase] = useState<TrainingPhase>("notStarted");

  // 训练结果状态
  const [results, setResults] = useState<TrainingResult[]>([]);

  // 当前重听次数
  const [currentReplayCount, setCurrentReplayCount] = useState(0);

  // 音频配置状态
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    charSpeed: config.charSpeed,
    effSpeed: 0,
    tone: config.tone,
  });

  // 播放器
  const textGen = useTextGenerator();
  const player = useMorsePlayer();
  const timing = useTiming();

  // 播放器拖动状态
  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [wasPlaying, setWasPlaying] = useState(false);

  // 数据输入与光标位置
  const [inputText, setInputText] = useState<string>("");
  const cursorPositionRef = useRef<{ start: number; end: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 文本生成与时长计算
  useEffect(() => {
    if (trainingPhase !== "notStarted" && items.length > 0 && currentIndex < items.length) {
      textGen.generateCustomText(items[currentIndex], audioConfig);
    }
  }, [items, currentIndex, audioConfig, trainingPhase]);

  // 文本生成后，预加载到播放器
  useEffect(() => {
    if (textGen.text && textGen.duration > 0) {
      // 预加载到播放器（不播放，只生成事件序列）
      player.preload(textGen.text, audioConfig);
    }
  }, [textGen.text, audioConfig]);

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

  // 音频播放状态同步
  useEffect(() => {
    timing.updateCurrentTime(player.playbackState.currentTime);
    // 播放结束时停止计时
    if (player.playbackState.status === "idle" && timing.phase === "playing") {
      timing.stop();
    }
  }, [player.playbackState]);

  // 音频播放控制
  const handlePlay = async () => {
    if (timing.phase === "delay") {
      timing.stop();
      return;
    }
    if (player.isPlaying) {
      player.pause();
      timing.pause();
    } else if (player.isPaused) {
      player.resume();
      timing.resume();
    } else {
      if (player.playbackState.currentTime === 0) {
        timing.startDelay(3, async () => {
          await player.play();
          timing.startPlaying(displayTotalDuration);
        });
      } else {
        await player.play();
        timing.startPlaying(displayTotalDuration);
      }
    }
  };

  const handleRestart = () => {
    // 增加重听次数
    setCurrentReplayCount(prev => prev + 1);
    // 重置进度为0，不播放
    if (player.isPlaying || player.isPaused) {
      player.stop();
    }
    timing.stop();
    timing.updateCurrentTime(0);
  };

  const handleReplay = () => {
    // 增加重听次数
    setCurrentReplayCount(prev => prev + 1);
    
    // 清理可能的拖动状态
    if (isDragging) {
      setIsDragging(false);
      setSliderValue(null);
      setWasPlaying(false);
    }
    
    // 完全停止播放器和计时器
    player.stop();
    timing.stop();
    
    // 强制重置到起始状态
    timing.updateCurrentTime(0);
    
    // 直接启动倒计时+播放流程
    timing.startDelay(3, async () => {
      await player.play();
      timing.startPlaying(displayTotalDuration);
    });
  };

  // Slider 拖动控制
  const handleSliderStart = () => {
    setIsDragging(true);
    setSliderValue(player.playbackState.currentTime);
    // 如果正在倒计时，停止倒计时
    if (timing.phase === "delay") {
      timing.stop();
    }
    // 记录播放状态并暂停
    if (player.isPlaying) {
      setWasPlaying(true);
      player.pause();
      timing.pause();
    } else {
      setWasPlaying(false);
    }
  };

  const handleSliderChange = (value: number) => {
    if (isDragging) {
      setSliderValue(value);
      player.seek(value);
      timing.updateCurrentTime(value);
    }
  };

  const handleSliderEnd = () => {
    setIsDragging(false);
    // 如果之前是播放状态，继续播放
    if (wasPlaying) {
      player.resume();
      timing.resume();
    }
    setSliderValue(null);
    setWasPlaying(false);
  };

  // 输入处理
  useLayoutEffect(() => {
    if (cursorPositionRef.current) {
      const inputarea = document.getElementById(`${idPrefix}-input`) as HTMLInputElement;
      if (inputarea) {
        inputarea.setSelectionRange(
          cursorPositionRef.current.start,
          cursorPositionRef.current.end
        );
        cursorPositionRef.current = null; // 重置
      }
    }
  }, [inputText, idPrefix]);

  // 输入框内容变化
  const handleInputChange = (ev: React.FormEvent<HTMLInputElement>, data: { value: string }) => {
    const inputarea = ev.target as HTMLInputElement;
    // 保存光标位置到 ref
    cursorPositionRef.current = {
      start: inputarea.selectionStart ?? 0,
      end: inputarea.selectionEnd ?? 0,
    };
    // 转换为大写
    setInputText(data.value.toUpperCase());
  };

  // 开始训练
  const handleStart = async () => {
    setTrainingPhase("training");
    // 初始化音频配置
    setAudioConfig({
      charSpeed: config.charSpeed,
      effSpeed: 0,
      tone: config.randomTone ? generateRandomTone() : config.tone,
    });
    setResults([]);
    setInputText("");
    setCurrentReplayCount(0);
    const datasetOrFilter = (config as any).dataset || (config as any).filter || [];
    const newItems = await dataLoader(25, datasetOrFilter);
    setItems(newItems);
    setCurrentIndex(0);
  };

  // 确认输入
  const handleConfirm = () => {
    // 清洗输入并计算结果
    const cleanedInput = inputText.replace(/\s+/g, '');
    const comparison = calculateAccuracy(cleanedInput, items[currentIndex]);
    const score = config.fixedCharSpeed
      ? 0
      : (comparison.accuracy === 100
          ? calculateScore(items[currentIndex].length, audioConfig.charSpeed, currentReplayCount)
          : 0);
    // 记录结果
    const newResult: TrainingResult = {
      sent: items[currentIndex],
      received: cleanedInput,
      wpm: audioConfig.charSpeed,
      comparison: comparison,
      score: score,
    };
    setResults(prev => [...prev, newResult]);
    // 清空输入
    setInputText("");
    // 重置重听次数
    setCurrentReplayCount(0);
    // 检查是否完成所有训练
    if (currentIndex >= items.length - 1) {
      setTrainingPhase("completed");
      if (player.isPlaying || player.isPaused) {
        player.stop();
      }
      timing.stop();
    } else {
      // 准备进入下一训练，调整音频配置
      setAudioConfig(prev => {
        let newSpeed = prev.charSpeed;
        let newTone = config.randomTone ? generateRandomTone() : config.tone;

        // 调整速度（仅在非固定速度且未达到最小速度时）
        if (!config.fixedCharSpeed && prev.charSpeed !== config.minCharSpeed) {
          const isCorrect = newResult.comparison.accuracy === 100;
          if (isCorrect) {
            newSpeed = prev.charSpeed + 1;
          } else {
            newSpeed = Math.max(prev.charSpeed - 1, config.minCharSpeed);
          }
        }
        return { ...prev, charSpeed: newSpeed, tone: newTone };
      });
      // 进入下一训练
      setCurrentIndex(prev => prev + 1);
    }
  };

  // 重新开始全部训练
  const handleRetry = () => {
    setTrainingPhase("notStarted");
    setItems([]);
    setCurrentIndex(0);
    setResults([]);
    setInputText("");
    setCurrentReplayCount(0);
    setAudioConfig({
      charSpeed: config.charSpeed,
      effSpeed: 0,
      tone: config.randomTone ? generateRandomTone() : config.tone,
    });
    if (player.isPlaying || player.isPaused) {
      player.stop();
    }
    timing.stop();
    handleStart();
  };

  // 按钮点击处理
  const handleButtonClick = () => {
    if (trainingPhase === "notStarted") {
      handleStart();
    } else if (trainingPhase === "training") {
      handleConfirm();
    } else if (trainingPhase === "completed") {
      handleRetry();
    }
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // 当索引变化时，自动播放新训练文本
  useEffect(() => {
    if (trainingPhase === "training" && player.playbackState.totalDuration > 0) {
      // 确保音频已加载，然后自动播放
      const playNew = async () => {
        timing.updateCurrentTime(0);
        timing.startDelay(3, async () => {
          await player.play();
          timing.startPlaying(displayTotalDuration);
        });
      };
      playNew();
    }
  }, [currentIndex, trainingPhase, player.playbackState.totalDuration]);

  // 键盘事件监听：Enter 键和 Period 键控制
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 处理 Enter 键
      if (event.key === "Enter") {
        // 阻止默认行为
        event.preventDefault();
        // 复用按钮点击逻辑
        handleButtonClick();
      }
      // 处理 Period 键（.）
      if (event.key === '.' && trainingPhase === 'training') {
        event.preventDefault();
        handleReplay();
      }
    };
    // 添加事件监听
    window.addEventListener("keydown", handleKeyDown);
    // 清理函数：组件卸载时移除监听
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    trainingPhase, 
    items, 
    currentIndex, 
    inputText, 
    audioConfig.charSpeed,
    isDragging,
    displayTotalDuration
  ]);

  // 自动跳转（仅在配置了 skip 时生效）
  useEffect(() => {
    // 判断是否需要启动自动跳转
    if (
      (config as any).skip &&
      trainingPhase === "training" &&
      displayTotalDuration > 0 &&
      player.playbackState.currentTime >= displayTotalDuration - 0.01
    ) {
      // 启动5秒定时器
      const timer = setTimeout(() => {
        handleConfirm();
      }, 5000);
      // React 自动清理：当任何依赖项变化时，清除定时器
      return () => clearTimeout(timer);
    }
  }, [
    (config as any).skip,
    trainingPhase,
    player.playbackState.currentTime,
    displayTotalDuration,
    currentIndex
  ]);

  // 计算累计总分
  const totalScore = useMemo(() => {
    return results.reduce((sum, result) => sum + result.score, 0);
  }, [results]);

  // 根据训练阶段获取对应的提示文本
  const getCurrentTip = () => {
    if (trainingPhase === "notStarted") {
      return tooltips.start;
    } else if (trainingPhase === "training") {
      return tooltips.next;
    } else {
      return tooltips.retry;
    }
  };

  // 是否显示结果
  const shouldShowResults = !blindMode || trainingPhase === "completed";

  // 渲染比对结果文本
  const renderComparisonText = (result: AccuracyResult) => {
    const segments: { 
      char: string; 
      type: "correct" | "incorrect" | "missing" | "extra" 
    }[] = [];
    for (let i = 0; i < result.comparisons.length; i++) {
      const comp = result.comparisons[i];
      if (comp.type === "correct") {
        segments.push({ char: comp.char, type: "correct" });
      } else if (comp.type === "incorrect") {
        segments.push({ char: comp.char, type: "incorrect" });
      } else if (comp.type === "missing") {
        segments.push({ char: comp.char, type: "missing" });
      } else if (comp.type === "extra") {
        segments.push({ char: comp.char, type: "extra" });
      }
    }
    return (
      <Text className={styles.tableText}>
        {segments.map((segment, index) => (
          <span
            key={index}
            className={
              segment.type === "correct" ? styles.correctChar :
              segment.type === "incorrect" ? styles.incorrectChar :
              segment.type === "missing" ? styles.missingChar :
              segment.type === "extra" ? styles.extraChar : ""
            }
          >
            {segment.char === " " ? "_" : segment.char}
          </span>
        ))}
      </Text>
    );
  };

  // 渲染表格
  const renderTable = (
    startIndex: number, 
    count: number, 
    isShort: boolean = false
  ) => {
    return (
      <div className={mergeClasses(
        styles.tableContainer, 
        isShort ? styles.tableContHeightShort : styles.tableContHeight
      )}>
        <table className={mergeClasses(
          styles.table,
          isShort ? styles.tableHeightShort : styles.tableHeight
        )}>
          <colgroup>
            <col style={{ width: "44.25%" }} />
            <col style={{ width: "44.25%" }} />
            <col style={{ width: "11.50%" }} /> 
          </colgroup>
          <thead>
            <tr>
              <th><Text className={styles.tableHeader}>Sent</Text></th>
              <th><Text className={styles.tableHeader}>Received</Text></th>
              <th><Text className={styles.tableHeader}>WPM</Text></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }, (_, i) => {
              const result = shouldShowResults ? results[startIndex + i] : null;
              return (
                <tr key={i}>
                  <td><Text className={styles.tableText}>{result?.sent || ""}</Text></td>
                  <td>
                    {result?.comparison ? (
                      renderComparisonText(result.comparison)
                    ) : (
                      <Text className={styles.tableText}></Text>
                    )}
                  </td>
                  <td><Text className={styles.tableText}>{result?.wpm || ""}</Text></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* 信息展示 */}
      <div className={styles.inforSection}>
        <div className={styles.speedSection}>
          <Text className={styles.speedText}>
            Current character speed:{" "}
            <span className={styles.valueText}>
              {shouldShowResults ? audioConfig.charSpeed : "--"}
            </span>
            {" "}WPM
          </Text>
          <Text className={styles.speedText}>
            Maximum character speed:{" "}
            <span className={styles.valueText}>
              {shouldShowResults ? Math.max(...results.map(r => r.wpm), audioConfig.charSpeed) : "--"}
            </span>
            {" "}WPM
          </Text>
        </div>
        <Text className={styles.scoreText}>
          Training score:{" "}
          <span className={styles.valueText}>
            {shouldShowResults 
              ? (config.fixedCharSpeed ? "--" : Math.round(totalScore))
              : "--"}
          </span>
        </Text>
      </div>

      {/* 文本输入与音频控制 */}
      <div className={styles.controlSection}>
        {/* 文本输入 */}
        <div className={styles.inputSection}>
          <Input
            id={`${idPrefix}-input`}
            ref={inputRef}
            className={styles.input}
            style={{ width: inputWidth }}
            appearance="filled-darker"
            placeholder={inputPlaceholder}
            value={inputText}
            onChange={handleInputChange}
            autoComplete="off"
            maxLength={inputMaxLength}
          />
          <Tooltip
            content={{
              children: getCurrentTip(),
              className: styles.tooltip,
            }}
            relationship="label"
            positioning="above-start"
          >
            <Button 
              className={mergeClasses(styles.button, styles.buttonWidth)}
              icon={
                trainingPhase === "notStarted" 
                  ? <Fire20Regular /> 
                  : trainingPhase === "training"
                  ? <CheckmarkCircle20Regular />
                  : <ArrowRepeatAll20Regular />
              }
              onClick={handleButtonClick}>
              <Text className={styles.buttonText}>
                {trainingPhase === "notStarted"
                  ? "Start"
                  : trainingPhase === "training"
                  ? "OK"
                  : "Retry"}
              </Text>
            </Button>
          </Tooltip>
        </div>
        {/* 音频控制 */}
        <div 
          className={styles.audioSection}
          style={{
            opacity: trainingPhase !== "training" ? 0.5 : 1,
            pointerEvents: trainingPhase !== "training" ? "none" : "auto"
          }}
        >
          <Slider
            id={`${idPrefix}-audio-slider`}
            className={styles.slider}
            min={0}
            max={(player.playbackState.totalDuration || 1) * 1000}
            value={
              isDragging && sliderValue !== null 
              ? sliderValue * 1000
              : player.playbackState.currentTime * 1000
            }
            onChange={(_, data) => handleSliderChange((data.value as number) / 1000)}
            onPointerDown={handleSliderStart}
            onPointerUp={handleSliderEnd}
          />
          <div className={styles.audioTimeContainer}>
            <Text className={styles.currentTimeText}>
              {timing.phase === "delay"
                ? "-" + timing.formattedDelayCountdown
                : timing.formattedCurrentTime}
            </Text>
            <Text>/</Text>
            <Text className={styles.totalTimeText}>
              {timing.formattedTotalDuration}
            </Text>
          </div>
          <Button
            className={styles.button}
            icon={
              timing.phase === "delay"
                ? <ArrowUndo16Regular />
                : player.isPlaying 
                  ? <PauseCircle20Regular /> 
                  : <PlayCircle20Regular />
            }
            onClick={handlePlay}
            disabled={
              player.playbackState.totalDuration > 0 &&
              player.playbackState.currentTime >= player.playbackState.totalDuration - 0.01 &&
              timing.phase !== "delay"
            }
          />
          <Tooltip
            content={{
              children: tooltips.repeat,
              className: styles.tooltip,
            }}
            relationship="label"
            positioning="above-end"
          >
            <Button
              className={styles.button}
              icon={<ArrowCounterclockwise20Regular />}
              onClick={handleRestart}
              disabled={
                player.playbackState.currentTime <= 0 ||
                player.playbackState.totalDuration === 0
              }
            />
          </Tooltip>
        </div>
      </div>

      {/* 结果展示与返回 */}
      <div className={styles.resultSection}>
        {renderTable(0, 9)}
        {renderTable(9, 9)}
        {renderTable(18, 7, true)}
         
        {/* 返回 */}
        <div className={styles.returnSection}>
          <Button
            className={mergeClasses(styles.button, styles.buttonWidth)}
            icon={<ArrowCircleLeft20Regular />} 
            onClick={onBack}
          >
            <Text className={styles.buttonText}>
              Back
            </Text>
          </Button>
        </div>
      </div>
    </div>
  );
};