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
  PlayCircle20Regular, 
  PauseCircle20Regular, 
  ArrowUndo16Regular,
  ArrowClockwise20Regular,
  ChevronCircleLeft20Regular,
} from "@fluentui/react-icons";
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import type { AudioConfig, CallsignTrainingConfig, TrainingResult } from "../../lib/types";
import { getRandomCallsigns } from "../../services/dataLoader";
import { useTiming } from "../../hooks/useTiming";
import { useTextGenerator } from "../../hooks/useTextGenerator";
import { useMorsePlayer } from "../../hooks/useMorsePlayer";
import { ComparisonText } from "../../components/ComparisonText";
import { calculateAccuracy } from "../../services/statisticalToolset";

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
    gap: "8px",
  },
  speedText: {
    width: "225px",
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
    width: "220px",
    height: "32px",
    border: "none",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground4,
    boxShadow: tokens.shadow2,
    transform: "translateY(1.2px)",
    "& input": {
      fontFamily: tokens.fontFamilyMonospace,
      fontSize: "15px",
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
    paddingLeft: "5.5px",
    display: "block",
  },
  // 返回
  returnSection: {
    position: "absolute",
    bottom: "0px",
    right: "0px",
  },
});

// Props 接口
interface CallsignTrainingProps {
  config: CallsignTrainingConfig;
  onBack: () => void;
}

// 训练阶段类型
type TrainingPhase = "notStarted" | "training" | "completed";

// Tooltips 提示文本
const tips = {
  start: "Press enter to start",
  next: "Press enter to confirm and move to next callsign",
  retry: "Press enter to retry",
  repeat: "Press period (.) to repeat",
};

export const CallsignTraining = ({ config, onBack }: CallsignTrainingProps) => {
  // 使用样式
  const styles = useStyles();

  // 呼号与呼号索引状态
  const [callsigns, setCallsigns] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 训练阶段状态
  const [trainingPhase, setTrainingPhase] = useState<TrainingPhase>("notStarted");

  // 训练结果状态
  const [results, setResults] = useState<TrainingResult[]>([]);

  // 当前呼号重听次数
  const [currentReplayCount, setCurrentReplayCount] = useState(0);

  // 音频配置状态
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    charSpeed: config.charSpeed,
    effSpeed: 0,
    tone: config.tone,
  });

  // 呼号播放器
  const callsignTextGen = useTextGenerator();
  const callsignPlayer = useMorsePlayer();
  const callsignTiming = useTiming();

  // 呼号播放器拖动状态
  const [isCallsignSliderDragging, setIsCallsignSliderDragging] = useState(false);
  const [callsignSliderValue, setCallsignSliderValue] = useState<number | null>(null);
  const [callsignWasPlaying, setCallsignWasPlaying] = useState(false);

  // 呼号输入与光标位置
  const [inputCallsign, setInputCallsign] = useState<string>("");
  const cursorPositionRef = useRef<{ start: number; end: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 呼号生成与时长计算
  useEffect(() => {
    if (trainingPhase !== "notStarted" && callsigns.length > 0 && currentIndex < callsigns.length) {
      callsignTextGen.generateCustomText(callsigns[currentIndex], audioConfig);
    }
  }, [callsigns, currentIndex, audioConfig, trainingPhase]);

  // 呼号生成后，预加载到播放器
  useEffect(() => {
    if (callsignTextGen.text && callsignTextGen.duration > 0) {
      // 预加载到播放器（不播放，只生成事件序列）
      callsignPlayer.preload(callsignTextGen.text, audioConfig);
    }
  }, [callsignTextGen.text, audioConfig]);

  // 呼号音频总时长（优先级回退）
  const callsignDisplayTotalDuration = useMemo(() => {
    // 优先使用播放器的总时长（更准确），其次使用生成器的时长
    if (callsignPlayer.playbackState.totalDuration > 0) {
      return callsignPlayer.playbackState.totalDuration;
    }
    return callsignTextGen.duration;
  }, [callsignPlayer.playbackState.totalDuration, callsignTextGen.duration]);

  // 呼号音频时长同步
  useEffect(() => {
    callsignTiming.setTotalDuration(callsignDisplayTotalDuration);
  }, [callsignDisplayTotalDuration]);

  // 呼号音频播放状态同步
  useEffect(() => {
    callsignTiming.updateCurrentTime(callsignPlayer.playbackState.currentTime);
    // 播放结束时停止计时
    if (callsignPlayer.playbackState.status === "idle" && callsignTiming.phase === "playing") {
      callsignTiming.stop();
    }
  }, [callsignPlayer.playbackState]);

  // 呼号音频播放控制
  const handleCallsignPlay = async () => {
    if (callsignTiming.phase === "delay") {
      callsignTiming.stop();
      return;
    }
    if (callsignPlayer.isPlaying) {
      callsignPlayer.pause();
      callsignTiming.pause();
    } else if (callsignPlayer.isPaused) {
      callsignPlayer.resume();
      callsignTiming.resume();
    } else {
      if (callsignPlayer.playbackState.currentTime === 0) {
        callsignTiming.startDelay(3, async () => {
          await callsignPlayer.play();
          callsignTiming.startPlaying(callsignDisplayTotalDuration);
        });
      } else {
        await callsignPlayer.play();
        callsignTiming.startPlaying(callsignDisplayTotalDuration);
      }
    }
  };

  const handleCallsignRestart = () => {
    // 增加重听次数
    setCurrentReplayCount(prev => prev + 1);
    // 重置进度为0，不播放
    if (callsignPlayer.isPlaying || callsignPlayer.isPaused) {
      callsignPlayer.stop();
    }
    callsignTiming.stop();
    callsignTiming.updateCurrentTime(0);
  };

  const handleCallsignReplay = () => {
    // 增加重听次数
    setCurrentReplayCount(prev => prev + 1);
    
    // 清理可能的拖动状态
    if (isCallsignSliderDragging) {
      setIsCallsignSliderDragging(false);
      setCallsignSliderValue(null);
      setCallsignWasPlaying(false);
    }
    
    // 完全停止播放器和计时器
    callsignPlayer.stop();
    callsignTiming.stop();
    
    // 强制重置到起始状态
    callsignTiming.updateCurrentTime(0);
    
    // 直接启动倒计时+播放流程
    callsignTiming.startDelay(3, async () => {
      await callsignPlayer.play();
      callsignTiming.startPlaying(callsignDisplayTotalDuration);
    });
  };

  const handleCallsignSliderStart = () => {
    setIsCallsignSliderDragging(true);
    setCallsignSliderValue(callsignPlayer.playbackState.currentTime);
    // 如果正在倒计时，停止倒计时
    if (callsignTiming.phase === "delay") {
      callsignTiming.stop();
    }
    // 记录播放状态并暂停
    if (callsignPlayer.isPlaying) {
      setCallsignWasPlaying(true);
      callsignPlayer.pause();
      callsignTiming.pause();
    } else {
      setCallsignWasPlaying(false);
    }
  };

  const handleCallsignSliderChange = (value: number) => {
    if (isCallsignSliderDragging) {
      setCallsignSliderValue(value);
      callsignPlayer.seek(value);
      callsignTiming.updateCurrentTime(value);
    }
  };

  const handleCallsignSliderEnd = () => {
    setIsCallsignSliderDragging(false);
    // 如果之前是播放状态，继续播放
    if (callsignWasPlaying) {
      callsignPlayer.resume();
      callsignTiming.resume();
    }
    setCallsignSliderValue(null);
    setCallsignWasPlaying(false);
  };

  // 在 DOM 更新后恢复光标位置
  useLayoutEffect(() => {
    if (cursorPositionRef.current) {
      const inputarea = document.getElementById("callsign-input") as HTMLInputElement;
      if (inputarea) {
        inputarea.setSelectionRange(
          cursorPositionRef.current.start,
          cursorPositionRef.current.end
        );
        cursorPositionRef.current = null; // 重置
      }
    }
  }, [inputCallsign]);

  // 输入框内容变化
  const handleInputChange = (ev: React.FormEvent<HTMLInputElement>, data: { value: string }) => {
    const inputarea = ev.target as HTMLInputElement;
    
    // 保存光标位置到 ref
    cursorPositionRef.current = {
      start: inputarea.selectionStart ?? 0,
      end: inputarea.selectionEnd ?? 0,
    };
    
    // 转换为大写
    setInputCallsign(data.value.toUpperCase());
  };

  // 生成随机音调（500-900Hz，步长10）
  const generateRandomTone = (): number => {
    const min = 500;
    const max = 900;
    const step = 10;
    const range = (max - min) / step;  // 40 个可能的值
    const randomSteps = Math.floor(Math.random() * (range + 1));
    return min + randomSteps * step;
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

  // 开始训练
  const handleStart = async () => {
    const newCallsigns = await getRandomCallsigns(25, config.filter);
    setCallsigns(newCallsigns);
    setCurrentIndex(0);
    setResults([]);
    setInputCallsign("");
    setCurrentReplayCount(0);
    // 初始化音频配置
    setAudioConfig({
      charSpeed: config.charSpeed,
      effSpeed: 0,
      tone: config.randomTone ? generateRandomTone() : config.tone,
    });
    setTrainingPhase("training");
  };

  // 计算呼号得分
  const calculateCallsignScore = (
    callsignLength: number, 
    charSpeed: number, 
    replayCount: number
  ): number => {
    const l = Math.sqrt(callsignLength);
    const s = Math.pow(charSpeed / 20, 1.1);
    const r = Math.exp(-0.1 * replayCount);
    const score = Math.round(l * s * r * 10) / 10 * 100;
    return score;
  };

  // 计算呼号比对结果
  const calculateCallsignComparison = (
    userInput: string, 
    correctCallsign: string, 
    currentSpeed: number,
    replayCount: number
  ): TrainingResult => {
    const cleanedInput = userInput.replace(/\s+/g, '');
    const comparison = calculateAccuracy(cleanedInput, correctCallsign);
    const score = calculateCallsignScore(correctCallsign.length, currentSpeed, replayCount);
    
    return {
      sent: correctCallsign,
      received: cleanedInput,
      wpm: currentSpeed,
      comparison: comparison,
      score: comparison.accuracy === 100 ? score : 0,
    };
  };

  // 确认输入并进入下一呼号
  const handleConfirm = () => {
    // 记录结果
    const newResult = calculateCallsignComparison(
      inputCallsign, 
      callsigns[currentIndex], 
      audioConfig.charSpeed,
      currentReplayCount
    );
    setResults(prev => [...prev, newResult]);
    // 清空输入
    setInputCallsign("");
    // 重置重听次数
    setCurrentReplayCount(0);
    // 检查是否完成所有呼号
    if (currentIndex >= callsigns.length - 1) {
      setTrainingPhase("completed");
      if (callsignPlayer.isPlaying || callsignPlayer.isPaused) {
        callsignPlayer.stop();
      }
      callsignTiming.stop();
    } else {
      // 准备进入下一呼号，调整音频配置
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
      // 进入下一呼号
      setCurrentIndex(prev => prev + 1);
    }
  };

  // 重新开始训练
  const handleRetry = () => {
    setTrainingPhase("notStarted");
    setCallsigns([]);
    setCurrentIndex(0);
    setResults([]);
    setInputCallsign("");
    setCurrentReplayCount(0);
    setAudioConfig({
      charSpeed: config.charSpeed,
      effSpeed: 0,
      tone: config.randomTone ? generateRandomTone() : config.tone,
    });
    if (callsignPlayer.isPlaying || callsignPlayer.isPaused) {
      callsignPlayer.stop();
    }
    callsignTiming.stop();
    handleStart();
  };

  // 当呼号索引变化时，自动播放新呼号
  useEffect(() => {
    if (trainingPhase === "training" && callsignPlayer.playbackState.totalDuration > 0) {
      // 确保音频已加载，然后自动播放
      const playNewCallsign = async () => {
        callsignTiming.updateCurrentTime(0);
        callsignTiming.startDelay(3, async () => {
          await callsignPlayer.play();
          callsignTiming.startPlaying(callsignDisplayTotalDuration);
        });
      };
      playNewCallsign();
    }
  }, [currentIndex, trainingPhase, callsignPlayer.playbackState.totalDuration]);

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
        handleCallsignReplay();
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
    callsigns, 
    currentIndex, 
    inputCallsign, 
    audioConfig.charSpeed,
    isCallsignSliderDragging,
    callsignDisplayTotalDuration
  ]);

  // 计算累计总分
  const totalScore = useMemo(() => {
    return results.reduce((sum, result) => sum + result.score, 0);
  }, [results]);

  // 根据训练阶段获取对应的提示文本
  const getCurrentTip = () => {
    if (trainingPhase === "notStarted") {
      return tips.start;
    } else if (trainingPhase === "training") {
      return tips.next;
    } else {
      return tips.retry;
    }
  };  

  // 判断是否应该显示结果（盲测模式下只在完成时显示）
  const shouldShowResults = !config.blindMode || trainingPhase === "completed";

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
            {shouldShowResults ? Math.round(totalScore) : "--"}
          </span>
        </Text>
      </div>

      {/* 文本输入与音频控制 */}
      <div className={styles.controlSection}>
        {/* 文本输入 */}
        <div className={styles.inputSection}>
          <Input
            id="callsign-input"
            ref={inputRef}
            className={styles.input}
            appearance="filled-darker"
            placeholder="Input callsign here..."
            value={inputCallsign}
            onChange={handleInputChange}
            autoComplete="off"
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
                  : <ArrowClockwise20Regular />
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
            id="callsign-audio-slider"
            className={styles.slider}
            min={0}
            max={(callsignPlayer.playbackState.totalDuration || 1) * 1000}
            value={
              isCallsignSliderDragging && callsignSliderValue !== null 
              ? callsignSliderValue * 1000
              : callsignPlayer.playbackState.currentTime * 1000
            }
            onChange={(_, data) => handleCallsignSliderChange((data.value as number) / 1000)}
            onPointerDown={handleCallsignSliderStart}
            onPointerUp={handleCallsignSliderEnd}
          />
          <div className={styles.audioTimeContainer}>
            <Text className={styles.currentTimeText}>
              {callsignTiming.phase === "delay"
                ? "-" + callsignTiming.formattedDelayCountdown
                : callsignTiming.formattedCurrentTime}
            </Text>
            <Text>/</Text>
            <Text className={styles.totalTimeText}>
              {callsignTiming.formattedTotalDuration}
            </Text>
          </div>
          <Button
            className={styles.button}
            icon={
              callsignTiming.phase === "delay"
                ? <ArrowUndo16Regular />
                : callsignPlayer.isPlaying 
                  ? <PauseCircle20Regular /> 
                  : <PlayCircle20Regular />
            }
            onClick={handleCallsignPlay}
            disabled={
              callsignPlayer.playbackState.totalDuration > 0 &&
              callsignPlayer.playbackState.currentTime >= callsignPlayer.playbackState.totalDuration - 0.01 &&
              callsignTiming.phase !== "delay"
            }
          />
          <Tooltip
            content={{
              children: tips.repeat,
              className: styles.tooltip,
            }}
            relationship="label"
            positioning="above-end"
          >
            <Button
              className={styles.button}
              icon={<ArrowClockwise20Regular />}
              onClick={handleCallsignRestart}
              disabled={
                callsignPlayer.playbackState.currentTime <= 0 ||
                callsignPlayer.playbackState.totalDuration === 0
              }
            />
          </Tooltip>
        </div>
      </div>

      {/* 结果展示与返回 */}
      <div className={styles.resultSection}>
        {/* 数据 1-9 */}
        <div className={mergeClasses(styles.tableContainer, styles.tableContHeight)}>
          <table className={mergeClasses(styles.table, styles.tableHeight)}>
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
              {Array.from({ length: 9 }, (_, i) => {
                const result = shouldShowResults ? results[i] : undefined;
                return (
                  <tr key={i}>
                    <td><Text className={styles.tableText}>{result?.sent || ""}</Text></td>
                    <td>
                      {result?.comparison ? (
                        <ComparisonText result={result.comparison} />
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
        {/* 数据 10-18 */}
        <div className={mergeClasses(styles.tableContainer, styles.tableContHeight)}>
          <table className={mergeClasses(styles.table, styles.tableHeight)}>
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
              {Array.from({ length: 9 }, (_, i) => {
                const result = shouldShowResults ? results[i + 9] : undefined;
                return (
                  <tr key={i}>
                    <td><Text className={styles.tableText}>{result?.sent || ""}</Text></td>
                    <td>
                      {result?.comparison ? (
                        <ComparisonText result={result.comparison} />
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
        {/* 数据 19-25 */}
        <div className={mergeClasses(styles.tableContainer, styles.tableContHeightShort)}>
          <table className={mergeClasses(styles.table, styles.tableHeightShort)}>
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
              {Array.from({ length: 7 }, (_, i) => {
                const result = shouldShowResults ? results[i + 18] : undefined;
                return (
                  <tr key={i}>
                    <td><Text className={styles.tableText}>{result?.sent || ""}</Text></td>
                    <td>
                      {result?.comparison ? (
                        <ComparisonText result={result.comparison} />
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
        {/* 返回 */}
        <div className={styles.returnSection}>
          <Button
            className={mergeClasses(styles.button, styles.buttonWidth)}
            icon={<ChevronCircleLeft20Regular />} 
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