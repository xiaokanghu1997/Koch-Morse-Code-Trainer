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
import type { AudioConfig, QTCTrainingConfig } from "../../lib/types";
import { getRandomQTC } from "../../services/dataLoader";
import { useTiming } from "../../hooks/useTiming";
import { useTextGenerator } from "../../hooks/useTextGenerator";
import { useMorsePlayer } from "../../hooks/useMorsePlayer";

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
      marginBottom: "1px",
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
});

// 训练阶段类型
type TrainingPhase = "notStarted" | "training" | "review" | "completed";

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

  // 训练阶段状态
  const [trainingPhase, setTrainingPhase] = useState<TrainingPhase>("notStarted");

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

  // 验证状态
  const [grNumValid, setGrNumValid] = useState<boolean | null>(null);
  const [timeValid, setTimeValid] = useState<(boolean | null)[]>(Array(10).fill(null));
  const [callsignValid, setCallsignValid] = useState<(boolean | null)[]>(Array(10).fill(null));
  const [serialValid, setSerialValid] = useState<(boolean | null)[]>(Array(10).fill(null));

  // 文本生成与时长计算
  useEffect(() => {
    if (trainingPhase !== "notStarted" && qtcs.length > 0 && currentIndex < qtcs.length) {
      textGen.generateCustomText(qtcs[currentIndex], audioConfig);
    }
  }, [qtcs, currentIndex, audioConfig, trainingPhase]);

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
    setCurrentReplayCount(prev => prev + 1);
    // 重置进度为0，不播放
    if (player.isPlaying || player.isPaused) {
      player.stop();
    }
    timing.stop();
    timing.updateCurrentTime(0);
  };

  const handleReplay = async () => {
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

  // 开始训练
  const handleStart = async () => {
    const qtcData = await getRandomQTC(
      config.abbrevNumbers,
      config.chronological,
      config.abbrevTimes
    );
    if (qtcData) {
      const formattedQtcs: string[] = [];
      formattedQtcs.push(`QTC ${qtcData.grnum} = QRV?`);
      qtcData.qtcs.forEach((qtc: any) => {
        formattedQtcs.push(`${qtc.time} ${qtc.callsign} ${qtc.serial}`);
      });
      formattedQtcs.push(`R QSL QTC ${qtcData.grnum}`);
      setQtcs(formattedQtcs);
      setCurrentIndex(0);
    }
    console.log("Generated QTC:", qtcs);
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
              <Input 
                id="grNumInput"
                className={mergeClasses(
                  styles.input,
                  grNumValid === true && styles.inputValid,
                  grNumValid === false && styles.inputInvalid
                )}
                onFocus={handleGrNumFocus}
                onBlur={handleGrNumBlur}
                maxLength={14}
                autoComplete="off"
              />
            </div>
            {/* 第2列：10个input */}
            <div className={mergeClasses(styles.column, styles.columnTime)}>
              {Array.from({ length: 10 }, (_, i) => (
                <Input 
                  id={`timeInput${i}`}
                  key={i} 
                  className={mergeClasses(
                    styles.input,
                    timeValid[i] === true && styles.inputValid,
                    timeValid[i] === false && styles.inputInvalid
                  )}
                  onFocus={handleTimeFocus(i)}
                  onBlur={handleTimeBlur(i)}
                  maxLength={10}
                  autoComplete="off"
                />
              ))}
            </div>
            {/* 第3列：10个input */}
            <div className={mergeClasses(styles.column, styles.columnCallsign)}>
              {Array.from({ length: 10 }, (_, i) => (
                <Input 
                  id={`callsignInput${i}`}
                  key={i} 
                  className={mergeClasses(
                    styles.input,
                    callsignValid[i] === true && styles.inputValid,
                    callsignValid[i] === false && styles.inputInvalid
                  )}
                  onFocus={handleCallsignFocus(i)}
                  onBlur={handleCallsignBlur(i)}
                  maxLength={28}
                  autoComplete="off" 
                />
              ))}
            </div>
            {/* 第4列：10个input */}
            <div className={mergeClasses(styles.column, styles.columnSerial)}>
              {Array.from({ length: 10 }, (_, i) => (
                <Input 
                  id={`serialInput${i}`}
                  key={i} 
                  className={mergeClasses(
                    styles.input,
                    serialValid[i] === true && styles.inputValid,
                    serialValid[i] === false && styles.inputInvalid
                  )}
                  onFocus={handleSerialFocus(i)}
                  onBlur={handleSerialBlur(i)}
                  maxLength={8}
                  autoComplete="off"
                />
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
              <Text>10/10</Text>
            </div>
            <div className={styles.infoRow}>
              <Text>Score:</Text>
              <Text>0</Text>
            </div>
          </div>

          {/* 中间：音频控制 */}
          <div className={styles.middleSection}>
            <div className={styles.audioRow}>
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
            
            <div className={styles.audioButtonRow}>
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
              <Button
                className={styles.button}
                style={{ width: "90px", minWidth: "90px" }}
                icon={<ArrowClockwise20Regular />}
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
            </div>

            <div className={styles.audioButtonRow}>
              <Button
                className={styles.button}
                style={{ width: "186px", minWidth: "186px" }}
                icon={<Fire20Regular />}
                onClick={handleStart}
              >
                <Text className={styles.buttonText}>
                  Start
                </Text>
              </Button>
            </div>
          </div>

          {/* 下侧：按钮 */}
          <div className={styles.bottomSection}>
            <Button
              className={styles.button}
              style={{ width: "90px", minWidth: "90px" }}
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
    </div>
  );
};