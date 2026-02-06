import { 
  Text, 
  Dropdown,
  Option,
  Button,
  Slider,
  Textarea,
  MessageBar,
  MessageBarBody,
  makeStyles,
  mergeClasses,
  tokens
} from "@fluentui/react-components";
import { 
  PlayCircle20Regular, 
  PauseCircle20Regular, 
  ArrowUndo16Regular,
  ArrowClockwise20Regular,
  CheckmarkCircle20Regular,
  ChevronCircleRight20Regular,
} from "@fluentui/react-icons";
import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { AccuracyResult } from "../lib/types";
import { AudioWaveform } from "../components/AudioWaveform";
import { HighlightedText } from "../components/HighlightedText";
import { useTiming } from "../hooks/useTiming";
import { useLessonManager } from "../hooks/useLessonManager";
import { useTextGenerator } from "../hooks/useTextGenerator";
import { useMorsePlayer } from "../hooks/useMorsePlayer";
import { calculateAccuracy } from "../services/statisticalToolset";
import { useTrainingStore } from "../stores/trainingStore";
import { useGeneratorStore } from "../stores/generatorStore";
import { useSettingsStore } from "../stores/settingsStore";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "5px 10px",
  },
  containerGapCloseWave: {
    gap: "10px",
  },
  containerGapOpenWave: {
    gap: "5px",
  },
  // 第一行：课程进度和选择
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "-5px",
  },
  progressText: {
    fontSize: tokens.fontSizeBase300,
  },
  lessonNumber: {
    fontWeight: tokens.fontWeightSemibold,
  },
  lessonSelector: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dropdown: {
    minWidth: "105px",
    maxWidth: "105px",
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
    minWidth: "105px",
    maxWidth: "105px",
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground4,
  },
  dropdownListboxWithHeight: {
    height: "166px",
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
  // 第二行：当前课程字符
  charactersRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  characterLabels: {
    display: "flex",
    alignItems: "center",
    gap: "4.8px",
  },
  clickableChar: {
    fontFamily: tokens.fontFamilyMonospace,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    textDecoration: "underline",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
    userSelect: "none",  // 防止文本被选中
    ":hover": {
      color: tokens.colorBrandForeground1,
    },
  },
  // 第三、四行：音频播放控制
  audioControlRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  audioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  currentChar: {
    fontFamily: tokens.fontFamilyMonospace,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    textAlign: "center",
    transform: "translateY(0.8px)",
  },
  audioControls: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  slider: {
    width: "180px",
    transform: "translateY(1px)",
    marginRight: "-14px",
    "& .fui-Slider__thumb": {
      border: `4px solid ${tokens.colorNeutralBackground3Selected}`,
      boxShadow: tokens.shadow2,
    },
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
    width: "100px",
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
    "&:disabled": {
      cursor: "not-allowed",
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorNeutralForegroundDisabled,
    },
  },
  // 第五行：练习文本输入
  textAreaContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    paddingTop: "1px",
    position: "relative",
    gap: "5px",
  },
  textArea: {
    flex: 1,
    resize: "none",
    border: "none",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    boxShadow: tokens.shadow2,
    "& textarea": {
      fontFamily: tokens.fontFamilyMonospace,
      fontSize: "15px",
      lineHeight: "20px",
      padding: "8px 12px",
    },
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    ":focus-within": {
      backgroundColor: tokens.colorNeutralBackground3Pressed,
    },
    ":focus-within:hover": {
      backgroundColor: tokens.colorNeutralBackground3Pressed,
    },
    "::selection": {
      backgroundColor: tokens.colorCompoundBrandBackground,
    },
  },
  resultOverlay: {
    position: "absolute",
    padding: "8px 12px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    overflowY: "auto",
    overflowX: "hidden",
    zIndex: 10,
    pointerEvents: "auto",
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
  },
  // 第六行：结果检查按钮
  actionBar: {
    display: "flex",
    justifyContent: "flex-end",
  },
  messageContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    marginBottom: "-6px",
  },
  messageBar: {
    height: "32px",
    transform: "translateY(-1.2px)",
    boxShadow: tokens.shadow2,
  },
  messageBarBody: {
    display: "inline-flex",
    alignItems: "center",
    paddingBottom: "1.2px",
    paddingRight: "4px",
    gap: "12px"
  },
  checkButton: {
    width: "140px",
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

// 结果评价文本
const resultMessage = {
  "excellent": "Excellent performance with outstanding accuracy!",
  "good": "Good performance meeting basic requirements!",
  "close": "Close to passing but needs more practice!",
  "again": "Needs much more practice to improve!",
};

export const TrainingPage = () => {
  // 使用样式
  const styles = useStyles();

  // 获取配置
  const { savedConfig } = useGeneratorStore();

  // 获取波形图显示和主题
  const showWaveform = useSettingsStore(state => state.showWaveform);

  // 获取当前训练进度
  const { 
    currentDatasetName, 
    currentLessonNumber,
    setLessonNumber,
    submitRecord,
    syncFromGeneratorConfig,
  } = useTrainingStore();
  const { 
    lessons, 
    currentLesson, 
    totalLessonNumber,
  } = useLessonManager(currentDatasetName, currentLessonNumber);

  // 字符播放器
  const charTextGen = useTextGenerator();
  const charPlayer = useMorsePlayer();
  const charTiming = useTiming();

  // 练习文本播放器
  const textTextGen = useTextGenerator();
  const textPlayer = useMorsePlayer();
  const textTiming = useTiming();

  // 字符播放器拖动状态
  const [isCharSliderDragging, setIsCharSliderDragging] = useState(false);
  const [charSliderValue, setCharSliderValue] = useState<number | null>(null);
  const [charWasPlaying, setCharWasPlaying] = useState(false);

  // 练习文本播放器拖动状态
  const [isTextSliderDragging, setIsTextSliderDragging] = useState(false);
  const [textSliderValue, setTextSliderValue] = useState<number | null>(null);
  const [textWasPlaying, setTextWasPlaying] = useState(false);

  // 当前点击播放的字符
  const [currentPlayingChar, setCurrentPlayingChar] = useState<string>("");

  // 练习文本输入与光标位置
  const [inputText, setInputText] = useState<string>("");
  const cursorPositionRef = useRef<{ start: number; end: number } | null>(null);

  // 结果检查与显示
  const [checkedResult, setCheckedResult] = useState<AccuracyResult | null>(null);

  // 练习开始时间戳（毫秒）
  const [practiceStartTime, setPracticeStartTime] = useState<number | null>(null);

  // 追踪最后活跃的播放器
  const [lastActivePlayer, setLastActivePlayer] = useState<"char" | "text">("text");

  // 课程显示
  const currentLessonDisplay = useMemo(
    () => lessons.find(l => l.lessonNumber === currentLessonNumber)?.displayText || "",
    [lessons, currentLessonNumber]
  );

  // 课程进度文本格式化
  const formattedProgress = useMemo(() => ({
    current: currentLessonNumber.toString().padStart(2, "0"),
    total: totalLessonNumber.toString().padStart(2, "0"),
  }), [currentLessonNumber, totalLessonNumber]);

  // 结果评价
  const resultIntent = useMemo(() => {
    if (!checkedResult) return undefined;
    if (checkedResult.accuracy >= 90) return "success";
    if (checkedResult.accuracy >= 80) return "warning";
    return "error";
  }, [checkedResult]);
  
  const resultMessageText = useMemo(() => {
    if (!checkedResult) return "";
    if (checkedResult.accuracy >= 95) return resultMessage.excellent;
    if (checkedResult.accuracy >= 90) return resultMessage.good;
    if (checkedResult.accuracy >= 80) return resultMessage.close;
    return resultMessage.again;
  }, [checkedResult]);

  // 同步生成器配置到训练存储
  useEffect(() => {
    syncFromGeneratorConfig(savedConfig.datasetName);
  }, [savedConfig.datasetName]);
  
  // 字符音频文本生成
  useEffect(() => {
    if (currentLesson.characters.length > 0) {
      const lastChar = currentLesson.characters[currentLesson.characters.length - 1];
      setCurrentPlayingChar(lastChar);
      charTextGen.generateSingleChar(lastChar, 15, savedConfig);
    }
  }, [currentLesson]);

  // 练习文本生成
  useEffect(() => {
    if (currentLesson.characters.length > 0) {
      const charSet = currentLesson.characters.join("");
      textTextGen.generate(savedConfig, charSet);
    }
  }, [currentLessonNumber, currentDatasetName]);

  // 字符文本生成后，预加载到播放器
  useEffect(() => {
    if (charTextGen.text && charTextGen.duration > 0) {
      // 预加载到播放器（不播放，只生成事件序列）
      charPlayer.preload(charTextGen.text, savedConfig);
    }
  }, [charTextGen.text]);

  // 练习文本生成后，预加载到播放器
  useEffect(() => {
    if (textTextGen.text && textTextGen.duration > 0) {
      // 预加载到播放器（不播放，只生成事件序列）
      textPlayer.preload(textTextGen.text, savedConfig);
    }
  }, [textTextGen.text]);

  // 字符音频时长同步
  useEffect(() => {
    charTiming.setTotalDuration(charTextGen.duration);
  }, [charTextGen.duration]);

  // 练习文本音频时长同步
  useEffect(() => {
    textTiming.setTotalDuration(textTextGen.duration);
  }, [textTextGen.duration]);

  // 字符音频播放状态同步
  useEffect(() => {
    charTiming.updateCurrentTime(charPlayer.playbackState.currentTime);
    // 播放结束时停止计时
    if (charPlayer.playbackState.status === "idle" && charTiming.phase === "playing") {
      charTiming.stop();
    }
  }, [charPlayer.playbackState]);

  // 练习文本音频播放状态同步
  useEffect(() => {
    textTiming.updateCurrentTime(textPlayer.playbackState.currentTime);
    // 播放结束时停止计时
    if (textPlayer.playbackState.status === "idle" && textTiming.phase === "playing") {
      textTiming.stop();
    }
  }, [textPlayer.playbackState]);
  // 课程切换时停止所有播放
  useEffect(() => {
    if (charPlayer.isPlaying || charPlayer.isPaused) {
      charPlayer.stop();
      charTiming.stop();
    }
    if (textPlayer.isPlaying || textPlayer.isPaused) {
      textPlayer.stop();
      textTiming.stop();
    }
    setInputText("");
    setCheckedResult(null);
    setPracticeStartTime(null);
    setLastActivePlayer("text");
  }, [currentLessonNumber]);

  // 在 DOM 更新后恢复光标位置
  useLayoutEffect(() => {
    if (cursorPositionRef.current) {
      const textarea = document.getElementById("practice-textarea") as HTMLTextAreaElement;
      if (textarea) {
        textarea.setSelectionRange(
          cursorPositionRef.current.start,
          cursorPositionRef.current.end
        );
        cursorPositionRef.current = null; // 重置
      }
    }
  }, [inputText]);

  // 点击字符播放
  const handleCharClick = (char: string) => {
    if (textPlayer.isPlaying) {
      textPlayer.pause();
      textTiming.pause();
    }
    if (charPlayer.isPlaying || charPlayer.isPaused) {
      charPlayer.stop();
      charTiming.stop();
    }
    setCurrentPlayingChar(char);
    charTextGen.generateSingleChar(char, 15, savedConfig);
  }

  // 字符音频播放控制
  const handleCharPlay = () => {
    setLastActivePlayer("char");
    if (textPlayer.isPlaying) {
      textPlayer.pause();
      textTiming.pause();
    }

    if (charPlayer.isPlaying) {
      charPlayer.pause();
      charTiming.pause();
    } else if (charPlayer.isPaused) {
      charPlayer.resume();
      charTiming.resume();
    } else {
      charPlayer.play(charTextGen.text, savedConfig);
      charTiming.startPlaying(charTextGen.duration);
    }
  };

  const handleCharRestart = () => {
    // 重置进度为0，不播放
    if (charPlayer.isPlaying || charPlayer.isPaused) {
      charPlayer.stop();
    }
    charTiming.updateCurrentTime(0);
  };

  const handleCharSliderStart = () => {
    if (!textPlayer.isPlaying) {
      setLastActivePlayer("char");
    }
    setIsCharSliderDragging(true);
    setCharSliderValue(charPlayer.playbackState.currentTime);
    // 记录播放状态并暂停
    if (charPlayer.isPlaying) {
      setCharWasPlaying(true);
      charPlayer.pause();
      charTiming.pause();
    } else {
      setCharWasPlaying(false);
    }
  };

  const handleCharSliderChange = (value: number) => {
    if (isCharSliderDragging) {
      setCharSliderValue(value);
      // 实时更新播放进度
      charTiming.updateCurrentTime(value);
    }
  };

  const handleCharSliderEnd = () => {
    setIsCharSliderDragging(false);
    if (charSliderValue !== null) {
      // 跳转到指定位置
      charPlayer.seek(charSliderValue);
      // 如果之前是播放状态，继续播放
      if (charWasPlaying) {
        charPlayer.resume();
        charTiming.resume();
      }
    }
    setCharSliderValue(null);
    setCharWasPlaying(false);
  };

  // 练习文本音频播放控制
  const handleTextPlay = () => {
    setLastActivePlayer("text");
    if (charPlayer.isPlaying) {
      charPlayer.pause();
      charTiming.pause();
    }

    if (textTiming.phase === "delay") {
      textTiming.stop();
      return;
    }

    if (textPlayer.isPlaying) {
      textPlayer.pause();
      textTiming.pause();
    } else if (textPlayer.isPaused) {
      textPlayer.resume();
      textTiming.resume();
    } else {
      if (savedConfig.startDelay > 0) {
        textTiming.startDelay(savedConfig.startDelay, async () => {
          // 首次播放且倒计时完成，记录开始时间
          if (practiceStartTime === null) {
            setPracticeStartTime(Date.now());
          }
          await textPlayer.play(textTextGen.text, savedConfig);
          textTiming.startPlaying(textTextGen.duration);
        });
      } else {
        if (practiceStartTime === null) {
          setPracticeStartTime(Date.now());
        }
        textPlayer.play(textTextGen.text, savedConfig);
        textTiming.startPlaying(textTextGen.duration);
      }
    }
  };

  const handleTextRestart = () => {
    // 重置进度为0，不播放
    if (textPlayer.isPlaying || textPlayer.isPaused) {
      textPlayer.stop();
    }
    textTiming.updateCurrentTime(0);
    // 清空输入和结果
    setInputText("");
    setCheckedResult(null);
  };

  const handleTextSliderStart = () => {
    if (!charPlayer.isPlaying) {
      setLastActivePlayer("text");
    }
    setIsTextSliderDragging(true);
    setTextSliderValue(textPlayer.playbackState.currentTime);
    // 如果正在倒计时，停止倒计时
    if (textTiming.phase === "delay") {
      textTiming.stop();
    }
    // 记录播放状态并暂停
    if (textPlayer.isPlaying) {
      setTextWasPlaying(true);
      textPlayer.pause();
      textTiming.pause();
    } else {
      setTextWasPlaying(false);
    }
  };

  const handleTextSliderChange = (value: number) => {
    if (isTextSliderDragging) {
      setTextSliderValue(value);
      // 实时更新播放进度
      textTiming.updateCurrentTime(value);
    }
  };

  const handleTextSliderEnd = () => {
    setIsTextSliderDragging(false);
    if (textSliderValue !== null) {
      // 跳转到指定位置
      textPlayer.seek(textSliderValue);
      // 如果之前是播放状态，继续播放
      if (textWasPlaying) {
        textPlayer.resume();
        textTiming.resume();
      }
    }
    setTextSliderValue(null);
    setTextWasPlaying(false);
  };

  // 输入框内容变化
  const handleTextareaChange = (ev: React.FormEvent<HTMLTextAreaElement>, data: { value: string }) => {
    const textarea = ev.target as HTMLTextAreaElement;
    
    // 保存光标位置到 ref
    cursorPositionRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
    
    // 转换为大写
    setInputText(data.value.toUpperCase());
  };

  // 结果检查
  const handleCheckResult = () => {
    // 获取生成的文本和用户输入
    const correctText = textTextGen.text;
    const userInput = inputText;
    
    // 检查是否为空
    if (!correctText || !userInput) {
      return;
    }
    
    // 使用 calculateAccuracy 计算准确率（已经包含了比对逻辑）
    const result = calculateAccuracy(userInput, correctText);
    
    // 保存结果
    setCheckedResult(result);

    // 保存训练记录到 training store
    if (practiceStartTime !== null) {
      const endTime = Date.now();
      const duration = (endTime - practiceStartTime) / 1000; // 秒
      submitRecord(currentDatasetName, currentLessonNumber, {
        timestamp: practiceStartTime,
        duration: duration,
        accuracy: result.accuracy,
      });
    }
  };

  // 进入下一次训练
  const handleNextTraining = () => {
    // 清空输入和结果
    setInputText("");
    setCheckedResult(null);

    // 停止所有播放
    if (charPlayer.isPlaying || charPlayer.isPaused) {
      charPlayer.stop();
      charTiming.stop();
    }
    if (textPlayer.isPlaying || textPlayer.isPaused) {
      textPlayer.stop();
      textTiming.stop();
    }

    // 重新生成练习文本
    if (currentLesson.characters.length > 0) {
      const charSet = currentLesson.characters.join("");
      textTextGen.generate(savedConfig, charSet);
    }

    // 重置练习开始时间
    setPracticeStartTime(null);
  };

  // 获取字符波形数据
  const charWaveformData = useMemo(() => {
    return charPlayer.getWaveformData() || [];
  }, [charPlayer.playbackState.totalDuration]);

  // 获取练习文本波形数据
  const textWaveformData = useMemo(() => {
    return textPlayer.getWaveformData() || [];
  }, [textPlayer.playbackState.totalDuration]);

  // 动态选择当前活跃的波形数据和播放状态
  const { activeWaveformData, activePlaybackState } = useMemo(() => {
    if (charPlayer.isPlaying) {
      return {
        activeWaveformData: charWaveformData,
        activePlaybackState: charPlayer.playbackState,
      }
    } 
    if (textPlayer.isPlaying) {
      return {
        activeWaveformData: textWaveformData,
        activePlaybackState: textPlayer.playbackState,
      }
    }

    if (lastActivePlayer === 'char' && charPlayer.isPaused) {
      return {
        activeWaveformData: charWaveformData,
        activePlaybackState: charPlayer.playbackState,
      };
    }
    if (lastActivePlayer === 'text' && textPlayer.isPaused) {
      return {
        activeWaveformData: textWaveformData,
        activePlaybackState: textPlayer.playbackState,
      };
    }

    return {
      activeWaveformData: textWaveformData,
      activePlaybackState: textPlayer.playbackState,
    };
  }, [
    charPlayer.isPlaying,
    charPlayer.isPaused,
    textPlayer.isPlaying,
    textPlayer.isPaused,
    lastActivePlayer,
    charWaveformData,
    textWaveformData,
    charPlayer.playbackState,
    textPlayer.playbackState,
  ]);

  // 渲染
  return (
    <div className={mergeClasses(
      styles.container,
      showWaveform ? styles.containerGapOpenWave : styles.containerGapCloseWave
    )}>
      {/* 第一行：课程进度和选择 */}
      <div className={styles.headerRow}>
        <Text className={styles.progressText}>
          You are currently on lesson{" "}
          <span className={styles.lessonNumber}>
            {formattedProgress.current}
          </span> of{" "}
          <span className={styles.lessonNumber}>
            {formattedProgress.total}
          </span> total lessons.
        </Text>
        <div className={styles.lessonSelector}>
          <Text>Change to lesson: </Text>
          <Dropdown
            id="train-lesson-dropdown"
            className={styles.dropdown}
            listbox={{ 
              className: mergeClasses(
                styles.dropdownListbox,
                lessons.length >= 5 && styles.dropdownListboxWithHeight
              )
            }}
            value={currentLessonDisplay}
            selectedOptions={[currentLessonNumber.toString()]}
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                setLessonNumber(Number(data.optionValue));
              }
            }}
          >
            {lessons.map((lesson) => (
              <Option
                key={lesson.lessonNumber}
                value={lesson.lessonNumber.toString()}
                className={styles.dropdownOption}
                checkIcon={null}
              >
                {lesson.displayText}
              </Option>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* 第二行：当前课程字符 */}
      <div className={styles.charactersRow}>
        <Text>Current lesson characters:</Text>
        <div className={styles.characterLabels}>
          {currentLesson.characters.map((char, index) => (
            <Text
              key={index}
              className={styles.clickableChar}
              onClick={() => handleCharClick(char)}
            >
              {char}
            </Text>
          ))}
        </div>
      </div>

      {/* 第三行：字符音频播放控制 */}
      <div className={styles.audioControlRow}>
        <div className={styles.audioLabel}>
          <Text>The sound of character:</Text>
          <Text className={styles.currentChar}>
            {currentPlayingChar}
          </Text>
        </div>
        <div className={styles.audioControls}>
          <Slider
            id="char-audio-slider"
            className={styles.slider}
            min={0}
            max={(charPlayer.playbackState.totalDuration || 1) * 1000}
            value={
              isCharSliderDragging && charSliderValue !== null
              ? charSliderValue * 1000
              : charPlayer.playbackState.currentTime * 1000
            }
            onChange={(_, data) => handleCharSliderChange((data.value as number) / 1000)}
            onPointerDown={handleCharSliderStart}
            onPointerUp={handleCharSliderEnd}
          />
          <div className={styles.audioTimeContainer}>
            <Text className={styles.currentTimeText}>
              {charTiming.formattedCurrentTime}
            </Text>
            <Text>/</Text>
            <Text className={styles.totalTimeText}>
              {charTiming.formattedTotalDuration}
            </Text>
          </div>
          <Button
            className={styles.button}
            icon={
              charPlayer.isPlaying 
              ? <PauseCircle20Regular /> 
              : <PlayCircle20Regular />
            }
            onClick={handleCharPlay}
            disabled={
              charPlayer.playbackState.totalDuration > 0 &&
              charPlayer.playbackState.currentTime >= charPlayer.playbackState.totalDuration - 0.01
            }
          >
            <Text className={styles.buttonText}>
              {charPlayer.isPlaying ? "Pause" : "Play"}
            </Text>
          </Button>
          <Button
            className={styles.button}
            icon={<ArrowClockwise20Regular />}
            onClick={handleCharRestart}
            disabled={
              charPlayer.playbackState.currentTime <= 0 ||
              charPlayer.playbackState.totalDuration === 0
            }
          >
            <Text className={styles.buttonText}>
              Restart
            </Text>
          </Button>
        </div>
      </div>

      {/* 第四行：练习文本音频播放控制 */}
      <div className={styles.audioControlRow}>
        <Text>Practice text: </Text>
        <div className={styles.audioControls}>
          <Slider
            id="text-audio-slider"
            className={styles.slider}
            min={0}
            max={(textPlayer.playbackState.totalDuration || 1) * 1000}
            value={
              isTextSliderDragging && textSliderValue !== null 
              ? textSliderValue * 1000
              : textPlayer.playbackState.currentTime * 1000
            }
            onChange={(_, data) => handleTextSliderChange((data.value as number) / 1000)}
            onPointerDown={handleTextSliderStart}
            onPointerUp={handleTextSliderEnd}
          />
          <div className={styles.audioTimeContainer}>
            <Text className={styles.currentTimeText}>
              {textTiming.phase === "delay"
                ? "-" + textTiming.formattedDelayCountdown
                : textTiming.formattedCurrentTime}
            </Text>
            <Text>/</Text>
            <Text className={styles.totalTimeText}>
              {textTiming.formattedTotalDuration}
            </Text>
          </div>
          <Button
            className={styles.button}
            icon={
              textTiming.phase === "delay"
                ? <ArrowUndo16Regular />
                : textPlayer.isPlaying 
                  ? <PauseCircle20Regular /> 
                  : <PlayCircle20Regular />
            }
            onClick={handleTextPlay}
            disabled={
              textPlayer.playbackState.totalDuration > 0 &&
              textPlayer.playbackState.currentTime >= textPlayer.playbackState.totalDuration - 0.01 &&
              textTiming.phase !== "delay"
            }
          >
            <Text className={styles.buttonText}>
              {textTiming.phase === "delay" 
                ? "Cancel" 
                : textPlayer.isPlaying 
                  ? "Pause" 
                  : "Play"}
            </Text>
          </Button>
          <Button
            className={styles.button}
            icon={<ArrowClockwise20Regular />}
            onClick={handleTextRestart}
            disabled={
              textPlayer.playbackState.currentTime <= 0 ||
              textPlayer.playbackState.totalDuration === 0
            }
          >
            <Text className={styles.buttonText}>
              Restart
            </Text>
          </Button>
        </div>
      </div>

      {/* 第五行：波形图 + 练习文本输入框 */}
      <div className={styles.textAreaContainer}>
        {/* 波形图显示 */}
        {showWaveform && (
          <AudioWaveform
            waveformData={activeWaveformData}
            playbackState={activePlaybackState}
            height={60}
            windowDuration={5.5}
            playheadPosition={1}
          />
        )}
        {/* 练习文本输入框 */}
        <Textarea
          id="practice-textarea"
          className={styles.textArea}
          appearance="filled-darker"
          placeholder="Enter your practice text here ..."
          value={inputText}
          onChange={handleTextareaChange}
          disabled={checkedResult !== null}
        />

        {/* 结果显示 */}
        {checkedResult && (
          <div className={`${styles.resultOverlay} fluent-scrollbar`}>
            <HighlightedText result={checkedResult} />
          </div>
        )}
      </div>

      {/* 第六行：结果检查按钮 */}
      <div className={styles.actionBar}>
        {/* 左侧：结果消息 */}
        <div className={styles.messageContainer}>
          {checkedResult !== null && (
            <MessageBar
              className={styles.messageBar}
              intent={resultIntent}
            >
              <MessageBarBody>
                <span className={styles.messageBarBody}>
                  <span>
                    Accuracy: <strong>{checkedResult.accuracy.toFixed(2)}%</strong>
                  </span>
                  {resultMessageText}
                </span>
              </MessageBarBody>
            </MessageBar>
          )}
        </div>

        {/* 右侧：检查按钮 */}
        <Button
          className={styles.checkButton}
          icon={checkedResult ? <ChevronCircleRight20Regular /> : <CheckmarkCircle20Regular />}
          onClick={() => {
            if (checkedResult) {
              handleNextTraining();
            } else {
              handleCheckResult();
            }
          }}
        >
          <Text className={styles.buttonText}>
            {checkedResult ? "Next Training" : "Check Result"}
          </Text>
        </Button>
      </div>
    </div>
  );
};