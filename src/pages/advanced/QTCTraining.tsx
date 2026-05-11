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
  ChevronCircleRight20Regular,
  CheckmarkCircle20Regular,
  ArrowRepeatAll20Regular,
  PlayCircle20Regular, 
  PauseCircle20Regular,
  ArrowCounterclockwise20Regular,
  ArrowCircleLeft20Regular,
} from "@fluentui/react-icons";
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import type { AudioConfig, AccuracyResult, QTCTrainingConfig } from "../../lib/types";
import { getRandomQTC } from "../../services/dataLoader";
import { useTiming } from "../../hooks/useTiming";
import { useTextGenerator } from "../../hooks/useTextGenerator";
import { useMorsePlayer } from "../../hooks/useMorsePlayer";
import { calculateAccuracy, calculateScore } from "../../services/statisticalToolset";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    padding: "12px 15px",
  },
  contentSection: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: "10px",
  },
  trainingColumn: {
    height: "247px",
    width: "494px",
    display: "flex",
    flexDirection: "column",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    boxSizing: "border-box",
    boxShadow: tokens.shadow2,
    padding: "2px 2px",
    gap: "2px",
    marginTop: "-3px",
    marginBottom: "-3px",
    marginLeft: "-2px",
  },
  headerRow: {
    display: "flex",
    gap: "2px",
  },
  headerCell: {
    backgroundColor: tokens.colorNeutralBackground3Pressed,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    fontFamily: tokens.fontFamilyMonospace,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: "14px",
    textAlign: "center",
  },
  contentRow: {
    flex: 1,
    display: "flex",
    gap: "2px",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",  // 控制行间距
  },
  columnGrNum: {
    width: "112px",
  },
  columnTime: {
    width: "82px",
  },
  columnCallsign: {
    width: "220px",
  },
  columnSerial: {
    width: "68px",
  },
  input: {
    height: "20px",
    minHeight: "20px",
    boxSizing: "border-box",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground4,
    pointerEvents: "none",
    "& input": {
      fontFamily: tokens.fontFamilyMonospace,
      fontSize: "14px",
      padding: "0px 0px 0px 2px",
      lineHeight: "18px",
      pointerEvents: "auto",
    },
    ":hover": {
      border: `1px solid ${tokens.colorNeutralStroke2}`,
      backgroundColor: tokens.colorNeutralBackground4Hover,
    },
    ":focus-within": {
      border: `1px solid ${tokens.colorNeutralStroke2} !important`,
      backgroundColor: tokens.colorNeutralBackground4Pressed,
    },
    ":focus-within:hover": {
      border: `1px solid ${tokens.colorNeutralStroke2}`,
      backgroundColor: tokens.colorNeutralBackground4Pressed,
    },
    "::selection": {
      backgroundColor: tokens.colorCompoundBrandBackground,
    },
    "&::after": {
      display: "none",
    },
  },
  inputValid: {
    outline: `1.5px solid ${tokens.colorPaletteGreenBorderActive} !important`,
    outlineOffset: "-1.5px",
  },
  inputInvalid: {
    outline: `1.5px solid ${tokens.colorPaletteRedBorderActive} !important`,
    outlineOffset: "-1.5px",
  },
  resultDisplay: {
    height: "20px",
    minHeight: "20px",
    boxSizing: "border-box",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground4,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: "14px",
    padding: "0px 0px 0px 2px",
    lineHeight: "18px",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  controlColumn: {
    width: "186px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "6px",
  },
  topSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  middleSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  audioRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "-10px", 
    marginBottom: "-6px",
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
  audioButtonRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "6px",
  },
  bottomSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  slider: {
    width: "110px",
    minWidth: "110px",
    transform: "translateY(1px)",
    marginLeft: "-8px",
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

// 训练阶段类型
type TrainingPhase = "notStarted" | "training" | "checking" | "completed";

// Props 接口
interface QTCTrainingProps {
  config: QTCTrainingConfig;
  onBack: () => void;
}

export const QTCTraining = ({ config, onBack }: QTCTrainingProps) => {
  // 使用样式
  const styles = useStyles();

  // 训练数据及索引状态
  const [qtcs, setQtcs] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [grNumText, setGrNumText] = useState("");
  const [timeTexts, setTimeTexts] = useState<string[]>(Array(10).fill(""));
  const [callsignTexts, setCallsignTexts] = useState<string[]>(Array(10).fill(""));
  const [serialTexts, setSerialTexts] = useState<string[]>(Array(10).fill(""));

  // 训练阶段状态
  const [trainingPhase, setTrainingPhase] = useState<TrainingPhase>("notStarted");

  // 重听次数状态
  const [replayCounts, setReplayCounts] = useState<number[]>(Array(11).fill(0));

  // 播放器
  const textGen = useTextGenerator();
  const player = useMorsePlayer();
  const timing = useTiming();

  // 音频参数
  const audioConfig: AudioConfig = {
    charSpeed: config.charSpeed,
    effSpeed: 0,
    tone: config.tone,
  };

  // 播放器拖动状态
  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [wasPlaying, setWasPlaying] = useState(false);

  // 结果比对状态
  const [grNumComparison, setGrNumComparison] = useState<AccuracyResult | null>(null);
  const [timeComparisons, setTimeComparisons] = useState<(AccuracyResult | null)[]>(Array(10).fill(null));
  const [callsignComparisons, setCallsignComparisons] = useState<(AccuracyResult | null)[]>(Array(10).fill(null));
  const [serialComparisons, setSerialComparisons] = useState<(AccuracyResult | null)[]>(Array(10).fill(null));

  // 分数状态
  const [qtcScores, setQtcScores] = useState<number[]>(Array(11).fill(0));
  const [correctQtcCount, setCorrectQtcCount] = useState(0);

  // 数据输入与光标状态
  const [grNumInputText, setGrNumInputText] = useState("");
  const [timeInputTexts, setTimeInputTexts] = useState<string[]>(Array(10).fill(""));
  const [callsignInputTexts, setCallsignInputTexts] = useState<string[]>(Array(10).fill(""));
  const [serialInputTexts, setSerialInputTexts] = useState<string[]>(Array(10).fill(""));
  const cursorPositionRef = useRef<{ id: string; start: number; end: number } | null>(null);

  // 验证状态
  const [grNumValid, setGrNumValid] = useState<boolean | null>(null);
  const [timeValid, setTimeValid] = useState<(boolean | null)[]>(Array(10).fill(null));
  const [callsignValid, setCallsignValid] = useState<(boolean | null)[]>(Array(10).fill(null));
  const [serialValid, setSerialValid] = useState<(boolean | null)[]>(Array(10).fill(null));

  // 文本生成与时长计算
  useEffect(() => {
    if (trainingPhase !== "notStarted" && qtcs.length > 0 && currentIndex < qtcs.length) {
      let textToGenerate = qtcs[currentIndex];
      // QTC 内容（带前缀）
      if (currentIndex >= 1 && currentIndex <= 10) {
        const isFirstPlay = replayCounts[currentIndex] === 0;
        const prefix = isFirstPlay ? "R" : "AGN";
        textToGenerate = `${prefix} ${qtcs[currentIndex]}`;
      }
      textGen.generateCustomText(textToGenerate, audioConfig);
    }
  }, [qtcs, currentIndex, trainingPhase, replayCounts]);

  // 文本生成后，预加载到播放器
  useEffect(() => {
    if (textGen.text && textGen.duration > 0) {
      let toneMap: Map<number, number> | undefined = undefined;
      let customAudioConfig = { ...audioConfig };
      if (currentIndex === 0) {
        // 首句使用标准音调
        customAudioConfig.tone = config.tone;
      } else if (currentIndex >= 1 && currentIndex <= 10) {
        // 后续 QTC，前缀用500Hz，主体用配置的音调
        const isFirstPlay = replayCounts[currentIndex] === 0;
        const prefix = isFirstPlay ? "R" : "AGN";
        toneMap = new Map<number, number>();
        for (let i = 0; i < prefix.length; i++) {
          toneMap.set(i, 500);
        }
        for (let i = prefix.length; i < textGen.text.length; i++) {
          toneMap.set(i, config.tone);
        }
        customAudioConfig.tone = config.tone;
      } else if (currentIndex === 11) {
        // 结尾使用500Hz
        customAudioConfig.tone = 500;
      }
      player.preload(textGen.text, customAudioConfig, toneMap);
    }
  }, [textGen.text, currentIndex, replayCounts]);

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

  // 当索引变化时，自动播放新音频
  useEffect(() => {
    if (
      (trainingPhase === "training" || trainingPhase === "checking") && 
      player.playbackState.totalDuration > 0
    ) {
      const playNew = async () => {
        timing.updateCurrentTime(0);
        await player.play();
        timing.startPlaying(displayTotalDuration);
      };
      playNew();
    }
    if (trainingPhase === "completed") {
      if (player.isPlaying || player.isPaused) {
        player.stop();
      }
      timing.stop();
      timing.updateCurrentTime(0);
    }
  }, [currentIndex, trainingPhase, displayTotalDuration]);

  // 音频播放控制
  const handlePlay = async () => {
    if (player.isPlaying) {
      player.pause();
      timing.pause();
    } else if (player.isPaused) {
      player.resume();
      timing.resume();
    } else {
      await player.play();
      timing.startPlaying(displayTotalDuration);
    }
  };

  const handleRestart = () => {
    // 增加重听次数
    setReplayCounts(prev => {
      const newCounts = [...prev];
      newCounts[currentIndex] += 1;
      return newCounts;
    });
    // 重置进度为0，不播放
    if (player.isPlaying || player.isPaused) {
      player.stop();
    }
    timing.stop();
    timing.updateCurrentTime(0);
  };

  const handleReplay = async () => {
    // 增加重听次数
    setReplayCounts(prev => {
      const newCounts = [...prev];
      newCounts[currentIndex] += 1;
      return newCounts;
    });
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
    // 直接播放
    await player.play();
    timing.startPlaying(displayTotalDuration);
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

  // 开始训练
  const handleStart = async () => {
    // 设置状态
    setTrainingPhase("training");
    setReplayCounts(Array(11).fill(0));
    setGrNumInputText("");
    setTimeInputTexts(Array(10).fill(""));
    setCallsignInputTexts(Array(10).fill(""));
    setSerialInputTexts(Array(10).fill(""));
    setGrNumValid(null);
    setTimeValid(Array(10).fill(null));
    setCallsignValid(Array(10).fill(null));
    setSerialValid(Array(10).fill(null));
    focusInput(0);
    // 加载数据
    const qtcData = await getRandomQTC(
      config.abbrevNumbers,
      config.chronological,
      config.abbrevTimes
    );
    const formattedQtcs: string[] = [];
    const times: string[] = [];
    const callsigns: string[] = [];
    const serials: string[] = [];
    formattedQtcs.push(`QTC ${qtcData.grnum} = QRV?`);
    qtcData.qtcs.forEach((qtc: any) => {
      formattedQtcs.push(`${qtc.time} ${qtc.callsign} ${qtc.serial}`);
      times.push(qtc.time);
      callsigns.push(qtc.callsign);
      serials.push(qtc.serial);
    });
    formattedQtcs.push(`R QSL QTC ${qtcData.grnum}`);
    setQtcs(formattedQtcs);
    setCurrentIndex(0);
    setGrNumText(qtcData.grnum);
    setTimeTexts(times);
    setCallsignTexts(callsigns);
    setSerialTexts(serials);
  };

  // 下一条 QTC
  const handleNext = () => {
    if (currentIndex < 10) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      focusInput(nextIndex);
    } else if (currentIndex === 10) {
      // 最后一条 QTC 已完成，进入检查阶段
      setTrainingPhase("checking");
      setCurrentIndex(11);
      focusInput(11);
    }
  };

  // 校对结果
  const handleCheck = () => {
    if (trainingPhase === "checking") {
      if (player.isPlaying || player.isPaused) {
        player.stop();
      }
      timing.stop();
      setTrainingPhase("completed");
      // 校对 Gr/Num
      const grNumResult = calculateAccuracy(grNumInputText.trim(), grNumText);
      setGrNumComparison(grNumResult);
      // 校对 Time、Callsign、Serial
      const timeResults = timeInputTexts.map((input, index) => 
        calculateAccuracy(input.trim(), timeTexts[index]));
      setTimeComparisons(timeResults);
      const callsignResults = callsignInputTexts.map((input, index) =>
        calculateAccuracy(input.trim(), callsignTexts[index]));
      setCallsignComparisons(callsignResults);
      const serialResults = serialInputTexts.map((input, index) =>
        calculateAccuracy(input.trim(), serialTexts[index]));
      setSerialComparisons(serialResults);
      // 计算分数
      let grNumScore = 0;
      if (grNumResult.accuracy === 100) {
        grNumScore = calculateScore(grNumText.length, config.charSpeed, replayCounts[0]);
      }
      const scores: number[] = [];
      let correctCount = 0;
      for (let i = 0; i < 10; i++) {
        // 检查三个字段是否全部正确
        const isTimeCorrect = timeResults[i]?.accuracy === 100;
        const isCallsignCorrect = callsignResults[i]?.accuracy === 100;
        const isSerialCorrect = serialResults[i]?.accuracy === 100;
        if (isTimeCorrect && isCallsignCorrect && isSerialCorrect) {
          correctCount += 1;
          const qtcLength = timeTexts[i].length + callsignTexts[i].length + serialTexts[i].length;
          const score = calculateScore(qtcLength, config.charSpeed, replayCounts[i + 1]);
          scores.push(score);
        } else {
          scores.push(0);
        }
      }
      setQtcScores([grNumScore, ...scores]);
      setCorrectQtcCount(correctCount);
    }
  };

  // 重新开始训练
  const handleRetry = () => {
    if (player.isPlaying || player.isPaused) {
      player.stop();
    }
    timing.stop();
    timing.updateCurrentTime(0);
    timing.setTotalDuration(0);
    setTrainingPhase("notStarted");
    setQtcs([]);
    setCurrentIndex(0);
    setReplayCounts(Array(11).fill(0));
    setGrNumInputText("");
    setTimeInputTexts(Array(10).fill(""));
    setCallsignInputTexts(Array(10).fill(""));
    setSerialInputTexts(Array(10).fill(""));
    setGrNumValid(null);
    setTimeValid(Array(10).fill(null));
    setCallsignValid(Array(10).fill(null));
    setSerialValid(Array(10).fill(null));
    setGrNumText("");
    setTimeTexts(Array(10).fill(""));
    setCallsignTexts(Array(10).fill(""));
    setSerialTexts(Array(10).fill(""));
    setGrNumComparison(null);
    setTimeComparisons(Array(10).fill(null));
    setCallsignComparisons(Array(10).fill(null));
    setSerialComparisons(Array(10).fill(null));
    setQtcScores(Array(11).fill(0));
    setCorrectQtcCount(0);
  };

  // 按钮点击处理
  const handleButtonClick = () => {
    if (trainingPhase === "notStarted") {
      handleStart();
    } else if (trainingPhase === "training") {
      handleNext();
    } else if (trainingPhase === "checking") {
      handleCheck();
    } else if (trainingPhase === "completed") {
      handleRetry();
    }
  };

  // 输入框聚焦
  const focusInput = (index: number) => {
    setTimeout(() => {
      let inputElement: HTMLInputElement | null = null;
      if (index === 0) {
        inputElement = document.getElementById("grNumInput") as HTMLInputElement;
      } else if (index >= 1 && index <= 10) {
        inputElement = document.getElementById(`timeInput${index - 1}`) as HTMLInputElement;
      }
      inputElement?.focus();
      if (index === 11) {
        // 取消所有输入框的聚焦状态
        const activeElement = document.activeElement as HTMLElement;
        activeElement?.blur();
      }
    }, 0);
  };

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 处理 Enter 键：开始训练并进行下一个QTC
      if (event.key === "Enter") {
        event.preventDefault();
        handleButtonClick();
      }
      // 处理 Space 键：在同一个QTC的三个field间切换
      if (event.key === " " && trainingPhase === "training") {
        event.preventDefault();
        // 获取当前聚焦的元素
        const activeElement = document.activeElement as HTMLInputElement;
        const activeId = activeElement?.id;
        if (activeId && currentIndex >= 1 && currentIndex <= 10) {
          const qtcIndex = currentIndex - 1; // QTC数组索引（0-9）
          // 判断当前在哪个field，切换到下一个
          if (activeId === `timeInput${qtcIndex}`) {
            // 从 Time 切换到 Callsign
            const callsignInput = document.getElementById(`callsignInput${qtcIndex}`) as HTMLInputElement;
            callsignInput?.focus();
          } else if (activeId === `callsignInput${qtcIndex}`) {
            // 从 Callsign 切换到 Serial
            const serialInput = document.getElementById(`serialInput${qtcIndex}`) as HTMLInputElement;
            serialInput?.focus();
          } else if (activeId === `serialInput${qtcIndex}`) {
            // 如果在 Serial field，切换回 Time
            const timeInput = document.getElementById(`timeInput${qtcIndex}`) as HTMLInputElement;
            timeInput?.focus();
          }
        }
      }
      // 处理 Period 键（.）：重播音频
      if (event.key === "." && (trainingPhase === "training" || trainingPhase === "checking")) {
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
    currentIndex,
    qtcs,
    grNumInputText,
    timeInputTexts,
    callsignInputTexts,
    serialInputTexts,
    displayTotalDuration
  ]);

  // 渲染比对结果（输入结果+正确答案）
  const renderComparisonResult = (comparison: AccuracyResult, correctAnswer: string) => {
    const segments: { 
      char: string; 
      type: "correct" | "incorrect" | "missing" | "extra" 
    }[] = [];
    
    for (let i = 0; i < comparison.comparisons.length; i++) {
      const comp = comparison.comparisons[i];
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
      <span>
        {segments.map((segment, index) => (
          <span
            key={index}
            style={{
              color: segment.type === "correct" ? "#69b330" :
                    segment.type === "incorrect" ? "#f94144" :
                    segment.type === "missing" ? "#f8be37" :
                    "#277da1",
              backgroundColor: segment.type === "incorrect" ? "#fee4e5" :
                              segment.type === "missing" ? "#fef6e2" :
                              segment.type === "extra" ? "#dbeef6" :
                              "transparent",
            }}
          >
            {segment.char === " " ? "_" : segment.char}
          </span>
        ))}
        <span style={{ color: tokens.colorNeutralForeground4 }}>
          {`(${correctAnswer})`}
        </span>
      </span>
    );
  };

  // 计算累计总分
  const totalScore = useMemo(() => {
    return qtcScores.reduce((sum, score) => sum + score, 0);
  }, [qtcScores]);

  // 大写转换
  useLayoutEffect(() => {
    if (cursorPositionRef.current) {
      const input = document.getElementById(cursorPositionRef.current.id) as HTMLInputElement;
      if (input) {
        input.setSelectionRange(
          cursorPositionRef.current.start,
          cursorPositionRef.current.end
        );
        cursorPositionRef.current = null; // 重置
      }
    }
  }, [grNumInputText, timeInputTexts, callsignInputTexts, serialInputTexts]);

  // 输入处理函数
  const handleGrNumChange = (e: React.ChangeEvent<HTMLInputElement>, data: { value: string }) => {
    const inputElement = e.target as HTMLInputElement;
    cursorPositionRef.current = {
      id: inputElement.id,
      start: inputElement.selectionStart ?? 0,
      end: inputElement.selectionEnd ?? 0,
    };
    setGrNumInputText(data.value.replace(/\s/g, '').toUpperCase());
  };
  const handleTimeChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>, data: { value: string }) => {
    const inputElement = e.target as HTMLInputElement;
    cursorPositionRef.current = {
      id: inputElement.id,
      start: inputElement.selectionStart ?? 0,
      end: inputElement.selectionEnd ?? 0,
    };
    const newTimeTexts = [...timeInputTexts];
    newTimeTexts[index] = data.value.replace(/\s/g, '').toUpperCase();
    setTimeInputTexts(newTimeTexts);
  };
  const handleCallsignChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>, data: { value: string }) => {
    const inputElement = e.target as HTMLInputElement;
    cursorPositionRef.current = {
      id: inputElement.id,
      start: inputElement.selectionStart ?? 0,
      end: inputElement.selectionEnd ?? 0,
    };
    const newCallsignTexts = [...callsignInputTexts];
    newCallsignTexts[index] = data.value.replace(/\s/g, '').toUpperCase();
    setCallsignInputTexts(newCallsignTexts);
  };
  const handleSerialChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>, data: { value: string }) => {
    const inputElement = e.target as HTMLInputElement;
    cursorPositionRef.current = {
      id: inputElement.id,
      start: inputElement.selectionStart ?? 0,
      end: inputElement.selectionEnd ?? 0,
    };
    const newSerialTexts = [...serialInputTexts];
    newSerialTexts[index] = data.value.replace(/\s/g, '').toUpperCase();
    setSerialInputTexts(newSerialTexts);
  };

  // 验证函数
  const validateGrNum = (value: string): boolean | null => {
    if (value.length === 0) return null;
    const regex = /^[0-9/]+$/;
    return value.length >= 4 && value.length <= 6 && regex.test(value);
  };
  const validateTime = (value: string): boolean | null => {
    if (value.length === 0) return null;
    const regex = /^[0-9]+$/;
    return value.length === 4 && regex.test(value);
  };
  const validateCallsign = (value: string): boolean | null => {
    if (value.length === 0) return null;
    const regex = /^[A-Z0-9/]+$/;
    return value.length >= 3 && value.length <= 13 && regex.test(value);
  };
  const validateSerial = (value: string): boolean | null => {
    if (value.length === 0) return null;
    const regex = /^[0-9]+$/;
    return value.length >= 2 && value.length <= 3 && regex.test(value);
  };

  // 验证输入合法性
  const handleGrNumBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setGrNumValid(validateGrNum(e.target.value));
  };
  const handleTimeBlur = (index: number) => (e: React.FocusEvent<HTMLInputElement>) => {
    const newValid = [...timeValid];
    newValid[index] = validateTime(e.target.value);
    setTimeValid(newValid);
  };
  const handleCallsignBlur = (index: number) => (e: React.FocusEvent<HTMLInputElement>) => {
    const newValid = [...callsignValid];
    newValid[index] = validateCallsign(e.target.value);
    setCallsignValid(newValid);
  };
  const handleSerialBlur = (index: number) => (e: React.FocusEvent<HTMLInputElement>) => {
    const newValid = [...serialValid];
    newValid[index] = validateSerial(e.target.value);
    setSerialValid(newValid);
  };

  // 清除验证状态
  const handleGrNumFocus = () => {
    setGrNumValid(null);
  };
  const handleTimeFocus = (index: number) => () => {
    const newValid = [...timeValid];
    newValid[index] = null;
    setTimeValid(newValid);
  };
  const handleCallsignFocus = (index: number) => () => {
    const newValid = [...callsignValid];
    newValid[index] = null;
    setCallsignValid(newValid);
  };
  const handleSerialFocus = (index: number) => () => {
    const newValid = [...serialValid];
    newValid[index] = null;
    setSerialValid(newValid);
  };

  return (
    <div className={styles.container}>
      {/* 训练内容和控制区域 */}
      <div className={styles.contentSection}>
        {/* 训练内容区域 */}
        <div className={styles.trainingColumn}>
          <div className={styles.headerRow}>
            <div className={mergeClasses(styles.headerCell, styles.columnGrNum)}>Gr/Num</div>
            <div className={mergeClasses(styles.headerCell, styles.columnTime)}>Time</div>
            <div className={mergeClasses(styles.headerCell, styles.columnCallsign)}>Callsign</div>
            <div className={mergeClasses(styles.headerCell, styles.columnSerial)}>Serial</div>
          </div>
          <div className={styles.contentRow}>
            {/* 第1列：1个input */}
            <div className={mergeClasses(styles.column, styles.columnGrNum)}>
              {trainingPhase === "completed" && grNumComparison ? (
                <div className={styles.resultDisplay}>
                  {renderComparisonResult(grNumComparison, grNumText)}
                </div>
              ) : (
                <Input 
                  id="grNumInput"
                  className={mergeClasses(
                    styles.input,
                    grNumValid === true && styles.inputValid,
                    grNumValid === false && styles.inputInvalid
                  )}
                  value={grNumInputText}
                  onChange={handleGrNumChange}
                  onFocus={handleGrNumFocus}
                  onBlur={handleGrNumBlur}
                  maxLength={14}
                  autoComplete="off"
                />
              )}
            </div>
            {/* 第2列：10个input */}
            <div className={mergeClasses(styles.column, styles.columnTime)}>
              {Array.from({ length: 10 }, (_, i) => (
                trainingPhase === "completed" && timeComparisons[i] ? (
                  <div key={i} className={styles.resultDisplay}>
                    {renderComparisonResult(timeComparisons[i]!, timeTexts[i])}
                  </div>
                ) : (
                  <Input 
                    id={`timeInput${i}`}
                    key={i} 
                    className={mergeClasses(
                      styles.input,
                      timeValid[i] === true && styles.inputValid,
                      timeValid[i] === false && styles.inputInvalid
                    )}
                    value={timeInputTexts[i]}
                    onChange={handleTimeChange(i)}
                    onFocus={handleTimeFocus(i)}
                    onBlur={handleTimeBlur(i)}
                    maxLength={10}
                    autoComplete="off"
                  />
                )
              ))}
            </div>
            {/* 第3列：10个input */}
            <div className={mergeClasses(styles.column, styles.columnCallsign)}>
              {Array.from({ length: 10 }, (_, i) => (
                trainingPhase === "completed" && callsignComparisons[i] ? (
                  <div key={i} className={styles.resultDisplay}>
                    {renderComparisonResult(callsignComparisons[i]!, callsignTexts[i])}
                  </div>
                ) : (
                  <Input 
                    id={`callsignInput${i}`}
                    key={i} 
                    className={mergeClasses(
                      styles.input,
                      callsignValid[i] === true && styles.inputValid,
                      callsignValid[i] === false && styles.inputInvalid
                    )}
                    value={callsignInputTexts[i]}
                    onChange={handleCallsignChange(i)}
                    onFocus={handleCallsignFocus(i)}
                    onBlur={handleCallsignBlur(i)}
                    maxLength={28}
                    autoComplete="off" 
                  />
                )
              ))}
            </div>
            {/* 第4列：10个input */}
            <div className={mergeClasses(styles.column, styles.columnSerial)}>
              {Array.from({ length: 10 }, (_, i) => (
                trainingPhase === "completed" && serialComparisons[i] ? (
                  <div key={i} className={styles.resultDisplay}>
                    {renderComparisonResult(serialComparisons[i]!, serialTexts[i])}
                  </div>
                ) : (
                  <Input 
                    id={`serialInput${i}`}
                    key={i} 
                    className={mergeClasses(
                      styles.input,
                      serialValid[i] === true && styles.inputValid,
                      serialValid[i] === false && styles.inputInvalid
                    )}
                    value={serialInputTexts[i]}
                    onChange={handleSerialChange(i)}
                    onFocus={handleSerialFocus(i)}
                    onBlur={handleSerialBlur(i)}
                    maxLength={8}
                    autoComplete="off"
                  />
                )
              ))}
            </div>
          </div>
        </div>

        {/* 控制区域 */}
        <div className={styles.controlColumn}>
          {/* 上侧：信息展示 */}
          <div className={styles.topSection}>
            <div className={styles.infoRow}>
              <Text>Character speed:</Text>
              <Text>{config.charSpeed} WPM</Text>
            </div>
            <div className={styles.infoRow}>
              <Text>Completion status:</Text>
              <Text>
                {trainingPhase === "completed"
                  ? `${correctQtcCount}/10`
                  : "0/10"}
              </Text>
            </div>
            <div className={styles.infoRow}>
              <Text>Score:</Text>
              <Text>
                {trainingPhase === "completed"
                  ? Math.round(totalScore)
                  : 0}
              </Text>
            </div>
          </div>

          {/* 中间：音频控制 */}
          <div className={styles.middleSection}>
            <div 
              className={styles.audioRow}
              style={{
                opacity: trainingPhase === "training" || trainingPhase === "checking" ? 1 : 0.5,
                pointerEvents: trainingPhase === "training" || trainingPhase === "checking" ? "auto" : "none"
              }}
            >
              <Slider
                id="qtc-audio-slider"
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
                  {timing.formattedCurrentTime}
                </Text>
                <Text>/</Text>
                <Text className={styles.totalTimeText}>
                  {timing.formattedTotalDuration}
                </Text>
              </div>
            </div>
            
            <div 
              className={styles.audioButtonRow}
              style={{
                opacity: trainingPhase === "training" || trainingPhase === "checking" ? 1 : 0.5,
                pointerEvents: trainingPhase === "training" || trainingPhase === "checking" ? "auto" : "none"
              }}
            >
              <Button
                className={styles.button}
                style={{ width: "90px", minWidth: "90px" }}
                icon={
                    player.isPlaying 
                      ? <PauseCircle20Regular /> 
                      : <PlayCircle20Regular />
                }
                onClick={handlePlay}
                disabled={
                  player.playbackState.totalDuration > 0 &&
                  player.playbackState.currentTime >= player.playbackState.totalDuration - 0.01
                }
              >
                <Text className={styles.buttonText}>
                  {player.isPlaying ? "Pause" : "Play"}
                </Text>
              </Button>
              <Tooltip
                content={{
                  children: "Press period (.) to repeat",
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="above-end"
              >
                <Button
                  className={styles.button}
                  style={{ width: "90px", minWidth: "90px" }}
                  icon={<ArrowCounterclockwise20Regular />}
                  onClick={handleRestart}
                  disabled={
                    player.playbackState.currentTime <= 0 ||
                    player.playbackState.totalDuration === 0
                  }
                >
                  <Text className={styles.buttonText}>
                    Restart
                  </Text>
                </Button>
              </Tooltip>
            </div>

            <div className={styles.audioButtonRow}>
              <Tooltip
                content={{
                  children: 
                    trainingPhase === "notStarted" ? "Press Enter to start" :
                    trainingPhase === "training" ? "Press Enter to next QTC" :
                    trainingPhase === "checking" ? "Press Enter to check" :
                    "Press Enter to retry",
                  className: styles.tooltip,
                }}
                relationship="label"
                positioning="above-start"
              >
                <Button
                  className={styles.button}
                  style={{ width: "186px", minWidth: "186px" }}
                  icon={
                    trainingPhase === "notStarted" ? <Fire20Regular /> :
                    trainingPhase === "training" ? <ChevronCircleRight20Regular /> :
                    trainingPhase === "checking" ? <CheckmarkCircle20Regular /> :
                    <ArrowRepeatAll20Regular />
                  }
                  onClick={handleButtonClick}
                >
                  <Text className={styles.buttonText}>
                    {
                      trainingPhase === "notStarted" ? "Start" :
                      trainingPhase === "training" ? "Next" :
                      trainingPhase === "checking" ? "Check" :
                      "Retry"
                    }
                  </Text>
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* 下侧：按钮 */}
          <div className={styles.bottomSection}>
            <Button
              className={styles.button}
              style={{ width: "90px", minWidth: "90px" }}
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
    </div>
  );
};