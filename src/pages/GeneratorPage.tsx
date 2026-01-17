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
import { useState } from "react";

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

function clampNumber(value: number, min: number, max: number) {
  if (isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export const GeneratorPage = () => {
  const styles = useStyles();

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
  
  const [trainingSet, setTrainingSet] = useState("Koch-LCWO");
  const [distribution, setDistribution] = useState("Gradual");
  const [groupLength, setGroupLength] = useState("5");
  const [groupSpacing, setGroupSpacing] = useState("1");
  const [duration, setDuration] = useState("1");
  const [charSpeed, setCharSpeed] = useState(20);
  const [effSpeed, setEffSpeed] = useState(10);
  const [tone, setTone] = useState(600);
  const [startDelay, setStartDelay] = useState("3");
  const [usePrefixSuffix, setUsePrefixSuffix] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(20);

  const handleSpin =
  (min: number, max: number, setter: (v: string)=>void) =>
  (_: any, data: any) => {
    const raw = Number(data.value ?? data.displayValue);
    const clamped = clampNumber(raw, min, max);
    setter(String(clamped));
  };

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
              value={trainingSet}
              selectedOptions={[trainingSet]}
              onOptionSelect={(_, data) => setTrainingSet(data.optionValue as string)}
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
              value={distribution}
              selectedOptions={[distribution]}
              onOptionSelect={(_, data) => setDistribution(data.optionValue as string)}
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
              value={Number(groupLength)}
              onChange={handleSpin(1, 10, setGroupLength)}
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
              value={Number(groupSpacing)}
              onChange={handleSpin(1, 10, setGroupSpacing)}
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
              value={Number(duration)}
              onChange={handleSpin(1, 10, setDuration)}
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
                value={charSpeed}
                onChange={(_, data) => setCharSpeed(data.value)}
              />
              <Text className={styles.sliderValueText}>{charSpeed} WPM</Text>
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
                value={effSpeed}
                onChange={(_, data) => setEffSpeed(data.value)}
              />
              <Text className={styles.sliderValueText}>{effSpeed} WPM</Text>
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
                value={tone}
                onChange={(_, data) => setTone(data.value)}
              />
              <Text className={styles.sliderValueText}>{tone} Hz</Text>
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
              value={Number(startDelay)}
              onChange={handleSpin(1, 30, setStartDelay)}
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
                checked={usePrefixSuffix}
                onChange={(_, data) => setUsePrefixSuffix(data.checked === true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className={styles.actionBar}>
        <div className={styles.countdownContainer}>
          <Timer20Regular />
          <Text className={styles.countdownText}>{countdown} s</Text>
        </div>
        <Button
          className={styles.button}
          icon={isPlaying ? <PauseCircle20Regular /> : <PlayCircle20Regular />}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? "Pause" : "Preview"}
        </Button>
        <Button
          className={styles.button}
          icon={<SoundWaveCircleSparkle20Regular />}
        >
          Generate
        </Button>
      </div>
    </div>
  );
};