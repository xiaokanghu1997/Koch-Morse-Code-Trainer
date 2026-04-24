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
import type { AudioConfig, WordTrainingConfig, TrainingResult } from "../../lib/types";
import { getRandomWords } from "../../services/dataLoader";
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
    width: "200px",
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
    paddingLeft: "1.5px",
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
interface WordTrainingProps {
  config: WordTrainingConfig;
  onBack: () => void;
}

// 训练阶段类型
type TrainingPhase = "notStarted" | "training" | "completed";

// Tooltips 提示文本
const tips = {
  start: "Press enter to start",
  next: "Press enter to confirm and move to next word",
  retry: "Press enter to retry",
  repeat: "Press period (.) to repeat",
};

export const WordTraining = ({ config, onBack }: WordTrainingProps) => {
  // 使用样式
  const styles = useStyles();

  // 单词与单词索引状态
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 训练阶段状态
  const [trainingPhase, setTrainingPhase] = useState<TrainingPhase>("notStarted");

  // 训练结果状态
  const [results, setResults] = useState<TrainingResult[]>([]);

  // 当前单词重听次数
  const [currentReplayCount, setCurrentReplayCount] = useState(0);

  // 音频配置状态
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    charSpeed: config.charSpeed,
    effSpeed: 0,
    tone: config.tone,
  });

  // 单词播放器
  const wordTextGen = useTextGenerator();
  const wordPlayer = useMorsePlayer();
  const wordTiming = useTiming();

  // 单词播放器拖动状态
  const [isWordSliderDragging, setIsWordSliderDragging] = useState(false);
  const [wordSliderValue, setWordSliderValue] = useState<number | null>(null);
  const [wordWasPlaying, setWordWasPlaying] = useState(false);

  // 单词输入与光标位置
  const [inputWord, setInputWord] = useState<string>("");
  const cursorPositionRef = useRef<{ start: number; end: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 单词生成与时长计算
  useEffect(() => {
    if (trainingPhase !== "notStarted" && words.length > 0 && currentIndex < words.length) {
      wordTextGen.generateCustomText(words[currentIndex], audioConfig);
    }
  }, [words, currentIndex, audioConfig, trainingPhase]);

  // 单词生成后，预加载到播放器
  useEffect(() => {
    if (wordTextGen.text && wordTextGen.duration > 0) {
      // 预加载到播放器（不播放，只生成事件序列）
      wordPlayer.preload(wordTextGen.text, audioConfig);
    }
  }, [wordTextGen.text, audioConfig]);

  // 单词音频总时长（优先级回退）
  const wordDisplayTotalDuration = useMemo(() => {
    // 优先使用播放器的总时长（更准确），其次使用生成器的时长
    if (wordPlayer.playbackState.totalDuration > 0) {
      return wordPlayer.playbackState.totalDuration;
    }
    return wordTextGen.duration;
  }, [wordPlayer.playbackState.totalDuration, wordTextGen.duration]);

  // 单词音频时长同步
  useEffect(() => {
    wordTiming.setTotalDuration(wordDisplayTotalDuration);
  }, [wordDisplayTotalDuration]);

  // 单词音频播放状态同步
  useEffect(() => {
    wordTiming.updateCurrentTime(wordPlayer.playbackState.currentTime);
    // 播放结束时停止计时
    if (wordPlayer.playbackState.status === "idle" && wordTiming.phase === "playing") {
      wordTiming.stop();
    }
  }, [wordPlayer.playbackState]);

  // 单词音频播放控制
  const handleWordPlay = async () => {
    if (wordTiming.phase === "delay") {
      wordTiming.stop();
      return;
    }
    if (wordPlayer.isPlaying) {
      wordPlayer.pause();
      wordTiming.pause();
    } else if (wordPlayer.isPaused) {
      wordPlayer.resume();
      wordTiming.resume();
    } else {
      if (wordPlayer.playbackState.currentTime === 0) {
        wordTiming.startDelay(3, async () => {
          await wordPlayer.play();
          wordTiming.startPlaying(wordDisplayTotalDuration);
        });
      } else {
        await wordPlayer.play();
        wordTiming.startPlaying(wordDisplayTotalDuration);
      }
    }
  };

  const handleWordRestart = () => {
    // 增加重听次数
    setCurrentReplayCount(prev => prev + 1);
    // 重置进度为0，不播放
    if (wordPlayer.isPlaying || wordPlayer.isPaused) {
      wordPlayer.stop();
    }
    wordTiming.stop();
    wordTiming.updateCurrentTime(0);
  };

  const handleWordReplay = () => {
    // 增加重听次数
    setCurrentReplayCount(prev => prev + 1);
    
    // 清理可能的拖动状态
    if (isWordSliderDragging) {
      setIsWordSliderDragging(false);
      setWordSliderValue(null);
      setWordWasPlaying(false);
    }
    
    // 完全停止播放器和计时器
    wordPlayer.stop();
    wordTiming.stop();
    
    // 强制重置到起始状态
    wordTiming.updateCurrentTime(0);
    
    // 直接启动倒计时+播放流程
    wordTiming.startDelay(3, async () => {
      await wordPlayer.play();
      wordTiming.startPlaying(wordDisplayTotalDuration);
    });
  };

  const handleWordSliderStart = () => {
    setIsWordSliderDragging(true);
    setWordSliderValue(wordPlayer.playbackState.currentTime);
    // 如果正在倒计时，停止倒计时
    if (wordTiming.phase === "delay") {
      wordTiming.stop();
    }
    // 记录播放状态并暂停
    if (wordPlayer.isPlaying) {
      setWordWasPlaying(true);
      wordPlayer.pause();
      wordTiming.pause();
    } else {
      setWordWasPlaying(false);
    }
  };

  const handleWordSliderChange = (value: number) => {
    if (isWordSliderDragging) {
      setWordSliderValue(value);
      wordPlayer.seek(value);
      wordTiming.updateCurrentTime(value);
    }
  };

  const handleWordSliderEnd = () => {
    setIsWordSliderDragging(false);
    // 如果之前是播放状态，继续播放
    if (wordWasPlaying) {
      wordPlayer.resume();
      wordTiming.resume();
    }
    setWordSliderValue(null);
    setWordWasPlaying(false);
  };

  // 在 DOM 更新后恢复光标位置
  useLayoutEffect(() => {
    if (cursorPositionRef.current) {
      const inputarea = document.getElementById("word-input") as HTMLInputElement;
      if (inputarea) {
        inputarea.setSelectionRange(
          cursorPositionRef.current.start,
          cursorPositionRef.current.end
        );
        cursorPositionRef.current = null; // 重置
      }
    }
  }, [inputWord]);

  // 输入框内容变化
  const handleInputChange = (ev: React.FormEvent<HTMLInputElement>, data: { value: string }) => {
    const inputarea = ev.target as HTMLInputElement;
    
    // 保存光标位置到 ref
    cursorPositionRef.current = {
      start: inputarea.selectionStart ?? 0,
      end: inputarea.selectionEnd ?? 0,
    };
    
    // 转换为大写
    setInputWord(data.value.toUpperCase());
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
    const newWords = await getRandomWords(25, config.dataset);
    setWords(newWords);
    setCurrentIndex(0);
    setResults([]);
    setInputWord("");
    setCurrentReplayCount(0);
    // 初始化音频配置
    setAudioConfig({
      charSpeed: config.charSpeed,
      effSpeed: 0,
      tone: config.randomTone ? generateRandomTone() : config.tone,
    });
    setTrainingPhase("training");
  };

  // 计算单词得分
  const calculateWordScore = (wordLength: number, charSpeed: number, replayCount: number): number => {
    const l = Math.sqrt(wordLength);
    const s = Math.pow(charSpeed / 20, 1.1);
    const r = Math.exp(-0.1 * replayCount);
    const score = Math.round(l * s * r * 10) / 10 * 100;
    return score;
  };

  // 计算单词比对结果
  const calculateWordComparison = (
    userInput: string, 
    correctWord: string, 
    currentSpeed: number,
    replayCount: number
  ): TrainingResult => {
    const cleanedInput = userInput.replace(/\s+/g, '');
    const comparison = calculateAccuracy(cleanedInput, correctWord);
    const score = calculateWordScore(correctWord.length, currentSpeed, replayCount);
    
    return {
      sent: correctWord,
      received: cleanedInput,
      wpm: currentSpeed,
      comparison: comparison,
      score: comparison.accuracy === 100 ? score : 0,
    };
  };

  // 确认输入并进入下一单词
  const handleConfirm = () => {
    // 记录结果
    const newResult = calculateWordComparison(
      inputWord, 
      words[currentIndex], 
      audioConfig.charSpeed,
      currentReplayCount
    );
    setResults(prev => [...prev, newResult]);
    // 清空输入
    setInputWord("");
    // 重置重听次数
    setCurrentReplayCount(0);
    // 检查是否完成所有单词
    if (currentIndex >= words.length - 1) {
      setTrainingPhase("completed");
      if (wordPlayer.isPlaying || wordPlayer.isPaused) {
        wordPlayer.stop();
      }
      wordTiming.stop();
    } else {
      // 准备进入下一单词，调整音频配置
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
      // 进入下一单词
      setCurrentIndex(prev => prev + 1);
    }
  };

  // 重新开始训练
  const handleRetry = () => {
    setTrainingPhase("notStarted");
    setWords([]);
    setCurrentIndex(0);
    setResults([]);
    setInputWord("");
    setCurrentReplayCount(0);
    setAudioConfig({
      charSpeed: config.charSpeed,
      effSpeed: 0,
      tone: config.randomTone ? generateRandomTone() : config.tone,
    });
    if (wordPlayer.isPlaying || wordPlayer.isPaused) {
      wordPlayer.stop();
    }
    wordTiming.stop();
    handleStart();
  };

  // 当单词索引变化时，自动播放新单词
  useEffect(() => {
    if (trainingPhase === "training" && wordPlayer.playbackState.totalDuration > 0) {
      // 确保音频已加载，然后自动播放
      const playNewWord = async () => {
        wordTiming.updateCurrentTime(0);
        wordTiming.startDelay(3, async () => {
          await wordPlayer.play();
          wordTiming.startPlaying(wordDisplayTotalDuration);
        });
      };
      playNewWord();
    }
  }, [currentIndex, trainingPhase, wordPlayer.playbackState.totalDuration]);

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
        handleWordReplay();
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
    words, 
    currentIndex, 
    inputWord, 
    audioConfig.charSpeed,
    isWordSliderDragging,
    wordDisplayTotalDuration
  ]);

  // 自动跳转
  useEffect(() => {
    // 判断是否需要启动自动跳转
    if (
      config.skip &&
      trainingPhase === "training" &&
      wordDisplayTotalDuration > 0 &&
      wordPlayer.playbackState.currentTime >= wordDisplayTotalDuration - 0.01
    ) {
      // 启动5秒定时器
      const timer = setTimeout(() => {
        handleConfirm();
      }, 5000);
      
      // React 自动清理：当任何依赖项变化时，清除定时器
      return () => clearTimeout(timer);
    }
  }, [
    config.skip,
    trainingPhase,
    wordPlayer.playbackState.currentTime,
    wordDisplayTotalDuration,
    currentIndex  // 确保切换单词时清除
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

  return (
    <div className={styles.container}>
      {/* 信息展示 */}
      <div className={styles.inforSection}>
        <div className={styles.speedSection}>
          <Text className={styles.speedText}>
            Current character speed:{" "}
            <span className={styles.valueText}>
              {audioConfig.charSpeed}
            </span>
            {" "}WPM
          </Text>
          <Text className={styles.speedText}>
            Maximum character speed:{" "}
            <span className={styles.valueText}>
              {Math.max(...results.map(r => r.wpm), audioConfig.charSpeed)}
            </span>
            {" "}WPM
          </Text>
        </div>
        <Text className={styles.scoreText}>
          Training score:{" "}
          <span className={styles.valueText}>
            {Math.round(totalScore)}
          </span>
        </Text>
      </div>

      {/* 文本输入与音频控制 */}
      <div className={styles.controlSection}>
        {/* 文本输入 */}
        <div className={styles.inputSection}>
          <Input
            id="word-input"
            ref={inputRef}
            className={styles.input}
            appearance="filled-darker"
            placeholder="Input word here..."
            value={inputWord}
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
            id="word-audio-slider"
            className={styles.slider}
            min={0}
            max={(wordPlayer.playbackState.totalDuration || 1) * 1000}
            value={
              isWordSliderDragging && wordSliderValue !== null 
              ? wordSliderValue * 1000
              : wordPlayer.playbackState.currentTime * 1000
            }
            onChange={(_, data) => handleWordSliderChange((data.value as number) / 1000)}
            onPointerDown={handleWordSliderStart}
            onPointerUp={handleWordSliderEnd}
          />
          <div className={styles.audioTimeContainer}>
            <Text className={styles.currentTimeText}>
              {wordTiming.phase === "delay"
                ? "-" + wordTiming.formattedDelayCountdown
                : wordTiming.formattedCurrentTime}
            </Text>
            <Text>/</Text>
            <Text className={styles.totalTimeText}>
              {wordTiming.formattedTotalDuration}
            </Text>
          </div>
          <Button
            className={styles.button}
            icon={
              wordTiming.phase === "delay"
                ? <ArrowUndo16Regular />
                : wordPlayer.isPlaying 
                  ? <PauseCircle20Regular /> 
                  : <PlayCircle20Regular />
            }
            onClick={handleWordPlay}
            disabled={
              wordPlayer.playbackState.totalDuration > 0 &&
              wordPlayer.playbackState.currentTime >= wordPlayer.playbackState.totalDuration - 0.01 &&
              wordTiming.phase !== "delay"
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
              onClick={handleWordRestart}
              disabled={
                wordPlayer.playbackState.currentTime <= 0 ||
                wordPlayer.playbackState.totalDuration === 0
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
                const result = results[i];
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
                const result = results[i + 9];
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
                const result = results[i + 18];
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