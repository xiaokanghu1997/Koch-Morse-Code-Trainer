import { 
  Text, 
  Dropdown,
  Option,
  Button,
  Slider,
  Textarea,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens
} from "@fluentui/react-components";
import { 
  PlayCircle20Regular, 
  PauseCircle20Regular, 
  ArrowClockwise20Regular,
  CheckmarkCircle20Regular,
  CheckmarkCircle20Filled,
  ErrorCircle20Filled,
  Warning20Filled,
} from "@fluentui/react-icons";
import { useState, useEffect } from "react";
import { useMorsePlayer } from "../hooks/useMorsePlayer";
import { useProgress } from "../hooks/useProgress";
import { useTrainingStore } from "../stores/trainingStore";
import { useSettingsStore } from "../stores/settingsStore";
import { CourseManager } from "../services/courseManager";
import { TextGenerator } from "../services/textGenerator";
import { checkText, formatAccuracy, getAccuracyGrade } from "../utils/textChecker";
import type { AudioConfig } from "../lib/types";
import { log } from "../utils/logger";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "5px 10px",
    gap: "10px",
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
    minWidth: "110px",
    maxWidth: "110px",
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
    minWidth: "110px",
    maxWidth: "110px",
    height: "166px",
    overflowY: "auto",
    backgroundColor: tokens.colorNeutralBackground4,
    scrollbarWidth: "thin",
    scrollbarColor: `${tokens.colorNeutralStroke1} ${tokens.colorNeutralBackground4}`,
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
    ":active": {
      transform: "scale(0.95)",  // 点击时轻微缩小
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
    "& .fui-Slider__thumb": {
      border: `4px solid ${tokens.colorNeutralBackground3Selected}`,
      boxShadow: tokens.shadow2,
    },
    marginRight: "-6px"
  },
  audioTimeContainer: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  timeText: {
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
    gap: "10px",
    paddingTop: "1px",
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
    maxWidth: "450px",
    boxShadow: tokens.shadow2,
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

// 格式化时间（秒 -> MM:SS）
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return "00:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const TrainingPage = () => {
  const styles = useStyles();

  // Hooks
  const { currentLesson, setCurrentLesson } = useTrainingStore();
  const { volume } = useSettingsStore();
  const {
    playText: playMorseText,
    playCharacter,
    pause,
    resume,
    stop,
    setPosition,
    state: playerState,
    isPlaying,
    isPaused,
  } = useMorsePlayer();
  const {
    saveAccuracy,
    incrementPracticeCount,
    recordCharacterErrors,
  } = useProgress();
  const [selectedChar, setSelectedChar] = useState<string>('');
  const [isCharSeeking, setIsCharSeeking] = useState(false);
  const [isTextSeeking, setIsTextSeeking] = useState(false);
  const [charPreviewTime, setCharPreviewTime] = useState(0);
  const [textPreviewTime, setTextPreviewTime] = useState(0);

  // 状态管理
  const [courseManager] = useState(() => new CourseManager('Koch-LCWO'));
  const totalLessons = courseManager.getTotalLessons();
  const allLessons = courseManager.getAllLessons();
  const currentLessonData = allLessons.find(l => l.id === currentLesson) || allLessons[0];
  const [lessonChars, setLessonChars] = useState('');
  const [newChar, setNewChar] = useState('');
  const [practiceText, setPracticeText] = useState('');
  const [generatedText, setGeneratedText] = useState(''); // 标准答案
  const [playMode, setPlayMode] = useState<'char' | 'text' | null>(null);
  const [checkResult, setCheckResult] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    content: string;
  } | null>(null);
  
  // ==================== 音频配置 ====================
  const audioConfig: AudioConfig = {
    charSpeed: 20,
    effSpeed: 15,
    tone: 600,
    volume: volume,
  };

  // 初始化课程数据
  useEffect(() => {
    try {
      const lesson = courseManager.getLesson(currentLesson);
      setLessonChars(lesson.chars);
      setNewChar(lesson.newChar);
      setSelectedChar(lesson.newChar);
      log.info('Lesson loaded', 'TrainingPage', {
        lessonNum: currentLesson,
        chars: lesson.chars,
        newChar: lesson.newChar,
      });
    } catch (error) {
      log.error('Failed to load lesson', 'TrainingPage', error);
    }
  }, [currentLesson, courseManager]);

  // 生成练习文本
  useEffect(() => {
    if (!lessonChars) return;

    try {
      const textGen = new TextGenerator();
      const text = textGen.generate({
        charSet: lessonChars,
        mode: 'Gradual',
        groupLength: 5,
        groupSpacing: 1,
        targetDuration: 60, // 1分钟
        audioConfig,
        usePrefixSuffix: false,
      });

      setGeneratedText(text);
      log.debug('Practice text generated', 'TrainingPage', {
        textLength: text.length,
      });
    } catch (error) {
      log.error('Failed to generate practice text', 'TrainingPage', error);
    }
  }, [lessonChars]);

  // 字符点击处理
  const handleCharClick = async (char: string) => {
    try {
      setSelectedChar(char);
      setNewChar(char);
      stop();
      setPlayMode(null);
      setPlayMode('char');
      await playCharacter(char, audioConfig, 5);
      log.info('Character clicked', 'TrainingPage', { char });
    } catch (error) {
      log.error('Failed to play character', 'TrainingPage', error);
    }
  };

  // 播放单字符
  const handleCharPlay = async () => {
    if (playMode === 'char' && isPlaying) {
      pause();
    } else if (playMode === 'char' && isPaused) {
      resume();
    } else {
      stop();
      setPlayMode('char');
      try {
        await playCharacter(newChar, audioConfig, 5); // 重复5次
        log.info('Playing character', 'TrainingPage', { char: newChar });
      } catch (error) {
        log.error('Failed to play character', 'TrainingPage', error);
      }
    }
  };

  const handleCharRestart = async () => {
    stop();
    setPlayMode('char');
    try {
      await playCharacter(newChar, audioConfig, 5);
      log.info('Character audio restarted', 'TrainingPage', { char: newChar });
    } catch (error) {
      log.error('Failed to restart character', 'TrainingPage', error);
    }
  };

  // 播放练习文本
  const handleTextPlay = async () => {
    if (playMode === 'text' && isPlaying) {
      pause();
    } else if (playMode === 'text' && isPaused) {
      resume();
    } else {
      if (!generatedText) {
        log.warn('No practice text to play', 'TrainingPage');
        return;
      }

      stop();
      setPlayMode('text');
      try {
        await playMorseText(generatedText, audioConfig);
        log.info('Playing practice text', 'TrainingPage', {
          textLength: generatedText.length,
        });
      } catch (error) {
        log.error('Failed to play practice text', 'TrainingPage', error);
      }
    }
  };

  const handleTextRestart = async () => {
    if (!generatedText) return;

    stop();
    setPlayMode('text');
    try {
      await playMorseText(generatedText, audioConfig);
      log.info('Practice text audio restarted', 'TrainingPage');
    } catch (error) {
      log.error('Failed to restart practice text', 'TrainingPage', error);
    }
  };

  // 字符音频进度条按下
  const handleCharSliderMouseDown = () => {
    setIsCharSeeking(true);
    log.debug('Character slider seeking started', 'TrainingPage');
  };

  // 字符音频进度条释放
  const handleCharSliderMouseUp = () => {
    setIsCharSeeking(false);
    if (charPreviewTime > 0 && totalDuration > 0) {
      const targetMs = charPreviewTime * 1000;
      setPosition(targetMs);
      log.debug('Character slider seeked', 'TrainingPage', {
        targetTime: charPreviewTime,
      });
    }
  };

  // 字符音频进度条变化
  const handleCharSliderChange = (_:  any, data: { value: number }) => {
    if (!totalDuration) return;
  
    // 计算预览时间（进度条值 0-1000 映射到 0-duration）
    const previewSeconds = (data.value / 1000) * totalDuration;
    setCharPreviewTime(previewSeconds);
  };

  // 练习文本音频进度条按下
  const handleTextSliderMouseDown = () => {
    setIsTextSeeking(true);
    log.debug('Text slider seeking started', 'TrainingPage');
  };

  // 练习文本音频进度条释放
  const handleTextSliderMouseUp = () => {
    setIsTextSeeking(false);
    if (textPreviewTime > 0 && totalDuration > 0) {
      const targetMs = textPreviewTime * 1000;
      setPosition(targetMs);
      log.debug('Text slider seeked', 'TrainingPage', {
        targetTime: textPreviewTime,
      });
    }
  };

  // 练习文本音频进度条变化
  const handleTextSliderChange = (_:  any, data: { value: number }) => {
    if (!totalDuration) return;
  
    // 计算预览时间（进度条值 0-1000 映射到 0-duration）
    const previewSeconds = (data.value / 1000) * totalDuration;
    setTextPreviewTime(previewSeconds);
  };

  // 检查结果
  const handleCheckResult = async () => {
    if (!practiceText.trim()) {
      setCheckResult({
        type: 'warning',
        title: 'No input',
        content: 'Please enter your answer before checking.',
      });
      return;
    }

    if (!generatedText) {
      log.warn('No generated text to compare', 'TrainingPage');
      return;
    }

    try {
      // 检查文本
      const result = checkText(practiceText, generatedText);
      
      log.info('Text checked', 'TrainingPage', {
        accuracy: result.accuracy,
        correctCount: result.correctCount,
        totalCount: result.totalCount,
      });

      // 保存准确率
      await saveAccuracy(currentLesson, result.accuracy);

      // 记录错误字符
      if (result.errorChars.length > 0) {
        await recordCharacterErrors(result.errorChars);
      }

      // 增加练习次数
      await incrementPracticeCount(currentLesson);

      // 显示结果
      const grade = getAccuracyGrade(result.accuracy);
      setCheckResult({
        type: grade.color,
        title: `${grade.grade} - ${formatAccuracy(result.accuracy)}`,
        content: `${result.correctCount}/${result.totalCount} correct.${grade.message}`,
      });

      // 自动隐藏消息
      setTimeout(() => {
        setCheckResult(null);
      }, 8000);

    } catch (error) {
      log.error('Failed to check result', 'TrainingPage', error);
      setCheckResult({
        type: 'error',
        title: 'Check failed',
        content: 'An error occurred while checking your answer.',
      });
    }
  };

  // 课程切换
  const handleLessonChange = (lessonDescription: string) => {
    const lesson = allLessons.find(l => l.description === lessonDescription);
    if (!lesson) {
      log.warn('Invalid lesson description', 'TrainingPage', { lessonDescription });
      return;
    }
    setCurrentLesson(lesson.id);
    setPracticeText(''); // 清空输入
    setCheckResult(null); // 清空结果
    stop(); // 停止播放
    setPlayMode(null);
    setSelectedChar(lesson.newChar);
    setNewChar(lesson.newChar);
    log.info('Lesson changed', 'TrainingPage', { 
      lessonId: lesson.id,
      description: lesson.description,
    });
  };

  // 计算播放时间
  const currentTime = playerState.currentTime;
  const totalDuration = playerState.totalDuration;

  // 判断当前播放的是字符还是文本
  const isCharMode = playMode === 'char';
  const isTextMode = playMode === 'text';

  // 渲染
  return (
    <div className={styles.container}>
      {/* 第一行：课程进度和选择 */}
      <div className={styles.headerRow}>
        <Text className={styles.progressText}>
          You are currently on lesson{" "}
          <span className={styles.lessonNumber}>
            {currentLesson.toString().padStart(2, '0')}
          </span> of{" "}
          <span className={styles.lessonNumber}>
            {totalLessons.toString().padStart(2, '0')}
          </span> total lessons.
        </Text>
        <div className={styles.lessonSelector}>
          <Text>Change to lesson: </Text>
          <Dropdown
            className={styles.dropdown}
            listbox={{ className: styles.dropdownListbox }}
            value={currentLessonData.description}
            selectedOptions={[currentLessonData.description]}
            onOptionSelect={(_, data) => handleLessonChange(data.optionValue as string)}
          >
            {allLessons.map((lesson) => (
              <Option 
                key={lesson.id} 
                value={lesson.description} 
                className={styles.dropdownOption}
                checkIcon={null}
              >
                {lesson.description}
              </Option>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* 第二行：当前课程字符 */}
      <div className={styles.charactersRow}>
        <Text>Current lesson characters:</Text>
        <div className={styles.characterLabels}>
          {lessonChars.split('').map((char, index) => (
            <Text
              key={`${char}-${index}`}
              className={`${styles.clickableChar} ${
                char === selectedChar
              }`}
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
          <Text className={styles.currentChar}>{newChar}</Text>
        </div>
        <div className={styles.audioControls}>
          <Slider
            className={styles.slider}
            min={0}
            max={1000}
            value={
              isCharMode
                ? isCharSeeking
                  ? Math.round((charPreviewTime / totalDuration) * 1000)
                  : Math.round((currentTime / (totalDuration || 1)) * 1000)
                : 0
            }
            onMouseDown={handleCharSliderMouseDown}
            onMouseUp={handleCharSliderMouseUp}
            onChange={handleCharSliderChange}
          />
          <div className={styles.audioTimeContainer}>
            <Text className={styles.timeText}>
              {formatTime(
                isCharMode 
                  ? isCharSeeking 
                    ? charPreviewTime 
                    : currentTime 
                  : 0
              )}
            </Text>
            <Text>/</Text>
            <Text className={styles.timeText}>
              {formatTime(isCharMode ? totalDuration : 0)}
            </Text>
          </div>
          <Button
            className={styles.button}
            icon={
              isCharMode && isPlaying 
                ? <PauseCircle20Regular /> 
                : <PlayCircle20Regular />
            }
            onClick={handleCharPlay}
          >
            <Text className={styles.buttonText}>
              {isCharMode && isPlaying ? "Pause" : "Play"}
            </Text>
          </Button>
          <Button
            className={styles.button}
            icon={<ArrowClockwise20Regular />}
            onClick={handleCharRestart}
            disabled={!isCharMode || playerState.status === 'idle'}
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
            className={styles.slider}
            min={0}
            max={1000}
            value={
              isTextMode
                ? isTextSeeking
                  ? Math.round((textPreviewTime / totalDuration) * 1000)
                  : Math.round((currentTime / (totalDuration || 1)) * 1000)
                : 0
            }
            onMouseDown={handleTextSliderMouseDown}
            onMouseUp={handleTextSliderMouseUp}
            onChange={handleTextSliderChange}
          />
          <div className={styles.audioTimeContainer}>
            <Text className={styles.timeText}>
              {formatTime(
                isTextMode 
                  ? isTextSeeking
                    ? textPreviewTime
                    : currentTime
                  : 0
              )}
            </Text>
            <Text>/</Text>
            <Text className={styles.timeText}>
              {formatTime(isTextMode ? totalDuration : 0)}
            </Text>
          </div>
          <Button
            className={styles.button}
            icon={
              isTextMode && isPlaying 
                ? <PauseCircle20Regular /> 
                : <PlayCircle20Regular />
            }
            onClick={handleTextPlay}
          >
            <Text className={styles.buttonText}>
              {isTextMode && isPlaying ? "Pause" : "Play"}
            </Text>
          </Button>
          <Button
            className={styles.button}
            icon={<ArrowClockwise20Regular />}
            onClick={handleTextRestart}
            disabled={!isTextMode || playerState.status === 'idle'}
          >
            <Text className={styles.buttonText}>
              Restart
            </Text>
          </Button>
        </div>
      </div>

      {/* 第五行：练习文本输入框 */}
      <div className={styles.textAreaContainer}>
        <Textarea
          className={styles.textArea}
          appearance="filled-darker"
          placeholder="Enter your practice text here ..."
          value={practiceText}
          onChange={(_, data) => setPracticeText(data.value)}
        />
      </div>

      {/* 第六行：结果检查按钮 */}
      <div className={styles.actionBar}>
        {/* 左侧：结果消息 */}
        <div className={styles.messageContainer}>
          {checkResult && (
            <MessageBar
              className={styles.messageBar}
              intent={checkResult.type}
              icon={
                checkResult.type === 'success' 
                  ? <CheckmarkCircle20Filled /> 
                  : checkResult.type === 'warning'
                  ? <Warning20Filled />
                  : <ErrorCircle20Filled />
              }
            >
              <MessageBarBody>
                <MessageBarTitle>{checkResult.title}</MessageBarTitle>
                <div>{checkResult.content}</div>
              </MessageBarBody>
            </MessageBar>
          )}
        </div>

        {/* 右侧：检查按钮 */}
        <Button
          className={styles.checkButton}
          icon={<CheckmarkCircle20Regular />}
          onClick={handleCheckResult}
        >
          <Text className={styles.buttonText}>
            Check result
          </Text>
        </Button>
      </div>
    </div>
  );
};