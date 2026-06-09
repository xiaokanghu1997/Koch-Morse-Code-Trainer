import { 
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Button,
  ToggleButton,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Dropdown,
  Option,
  Input,
  Text,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens
} from "@fluentui/react-components";
import {
  Quiz20Filled,
  Quiz20Regular,
  Certificate20Filled,
  Certificate20Regular,
  bundleIcon,
} from "@fluentui/react-icons";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { ChevronDown16Regular } from "@fluentui/react-icons";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBasicsStore } from "../stores/basicsStore";
import { useAdvancedStore } from "../stores/advancedStore";
import { useOptionsStore } from "../stores/optionsStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useLessonManager } from "../hooks/useLessonManager";
import { recordManager } from "../services/recordManager";
import { formatTimestamp } from "../services/statisticalToolset";
import { log } from "../utils/logger";

// 样式定义
const useStyles = makeStyles({
  popoverSurface: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground2,
    boxShadow: tokens.shadow2,
    gap: "8px",
    padding: "6px",
  },
  button: {
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
  buttonText: {
    paddingBottom: "1.4px",
  },
  modifyDialogSurface: {
    display: "flex",
    flexDirection: "column",
    width: "280px",
    padding: "10px 16px 12px 16px",
  },
  clearDialogSurface: {
    display: "flex",
    flexDirection: "column",
    padding: "8px 16px 12px 16px",
  },
  modifyDialogContent: {
    fontSize: tokens.fontSizeBase300,
    marginTop: "-2px",
    marginBottom: "1px",
    marginLeft: "6px",
    flex: 1,
    overflow: "hidden",
  },
  clearDialogContent: {
    fontSize: tokens.fontSizeBase300,
  },
  dialogTitleContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "230px",
  },
  dialogIconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    marginRight: "-16px",
  },
  dialogTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    width: "180px",
  },
  dialogContentContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },
  dialogRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  dialogLabel: {
    fontSize: tokens.fontSizeBase300,
    flexShrink: 0,
    textAlign: "left",
  },
  toggleButton: {
    minWidth: "32px",
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
  dropdown: {
    flexShrink: 0,
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
    backgroundColor: tokens.colorNeutralBackground3,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground3Pressed,
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
  inputBase: {
    flexShrink: 0,
    height: "32px",
    paddingBottom: "1.5px",
    transform: "translateY(1.5px)",
    border: "none",
    backgroundColor: tokens.colorNeutralBackground3,
    boxShadow: tokens.shadow2,
    "& input": {
      lineHeight: "20px",
      color: tokens.colorNeutralForeground1,
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
  inputLong: {
    minWidth: "150px",
    maxWidth: "150px",
  },
  inputShort: {
    minWidth: "100px",
    maxWidth: "100px",
  },
  inputWithError: {
    "& input": {
      color: tokens.colorPaletteRedForeground1,
    },
  },
  tooltip: {
    backgroundColor: tokens.colorNeutralBackground3Hover,
    boxShadow: tokens.shadow2,
  },
});

// 数据管理组件
interface DataManagementProps {
  children?: React.ReactNode;
  onDataChange?: () => void;
}

// 类型图标
const Basics = bundleIcon(Quiz20Filled, Quiz20Regular);
const Advanced = bundleIcon(Certificate20Filled, Certificate20Regular);

// 验证并解析时间戳字符串
const validateTimestamp = (value: string): { valid: boolean; timestamp: number } => {
  const timestampRegex = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!timestampRegex.test(value)) {
    return { valid: false, timestamp: 0 };
  }
  const [datePart, timePart] = value.split(" ");
  const [year, month, day] = datePart.split("/").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  const timestamp = new Date(year, month - 1, day, hours, minutes, seconds).getTime();
  if (isNaN(timestamp)) {
    return { valid: false, timestamp: 0 };
  }
  return { valid: true, timestamp };
};

export const DataManagement = ({ children, onDataChange }: DataManagementProps) => {
  const styles = useStyles();

  // 使用 i18n 获取翻译函数
  const { t } = useTranslation();
  // 获取当前语言设置
  const { language } = useSettingsStore();

  // 获取当前数据集
  const currentDatasetName = useOptionsStore((state) => state.savedConfig.datasetName);

  // 获取训练记录
  const basicsDatasets = useBasicsStore((state) => state.datasets);
  const advancedWord = useAdvancedStore((state) => state.word);
  const advancedCallsign = useAdvancedStore((state) => state.callsign);
  const advancedQTC = useAdvancedStore((state) => state.qtc);

  // 获取有训练记录的数据集
  const availableBasicsDatasets = useMemo(() => {
    return Object.keys(basicsDatasets).filter((datasetName) => {
      const dataset = basicsDatasets[datasetName];
      return Object.values(dataset).some(
        (lesson) => lesson.length > 0
      );
    });
  }, [basicsDatasets]);

  const availableAdvancedTypes = useMemo(() => {
    const types: string[] = [];
    if (advancedWord.length > 0) types.push("word");
    if (advancedCallsign.length > 0) types.push("callsign");
    if (advancedQTC.length > 0) types.push("qtc");
    return types;
  }, [advancedWord, advancedCallsign, advancedQTC]);

  // Popover 状态
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // 修改数据操作
  const [isModifyEnabled, setIsModifyEnabled] = useState(false);
  const [inputBuffer, setInputBuffer] = useState("");

  // 修改数据对话框状态
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false);
  const [modifyStoreType, setModifyStoreType] = useState<"basics" | "advanced">("basics");
  const [modifySelectedDataset, setModifySelectedDataset] = useState<string>(() => {
    if (availableBasicsDatasets.includes(currentDatasetName)) {
      return currentDatasetName;
    }
    return availableBasicsDatasets.length > 0 ? availableBasicsDatasets[0] : "";
  });
  const [modifySelectedLesson, setModifySelectedLesson] = useState<number>(0);
  const [modifySelectedRecord, setModifySelectedRecord] = useState<number>(0);
  const [modifyAdvancedType, setModifyAdvancedType] = useState<"word" | "callsign" | "qtc">("word");
  const [modifyAdvancedIndex, setModifyAdvancedIndex] = useState<number>(0);

  const [editedTimestamp, setEditedTimestamp] = useState<string>("");
  const [editedAccuracy, setEditedAccuracy] = useState<string>("");
  const [editedDuration, setEditedDuration] = useState<string>("");
  const [editedCharSpeed, setEditedCharSpeed] = useState<string>("");
  const [editedScore, setEditedScore] = useState<string>("");
  const [timestampError, setTimestampError] = useState<boolean>(false);
  const [accuracyError, setAccuracyError] = useState<boolean>(false);
  const [durationError, setDurationError] = useState<boolean>(false);
  const [charSpeedError, setCharSpeedError] = useState<boolean>(false);
  const [scoreError, setScoreError] = useState<boolean>(false);

  // 清空数据对话框状态
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  // 监听键盘输入以启用数据修改功能
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const newBuffer = (inputBuffer + event.key).slice(-6);
      setInputBuffer(newBuffer);

      if (newBuffer === "modify") {
        setIsModifyEnabled(true);
        log.info("Data modification enabled", "DataManagement");
      }
    };
    addEventListener("keydown", handleKeyDown);
    return () => {
      removeEventListener("keydown", handleKeyDown);
    };
  }, [inputBuffer]);

  // 获取课程列表
  const { lessons } = useLessonManager(modifySelectedDataset, modifySelectedLesson);

  // 筛选出有记录的课程
  const availableLessons = useMemo(() => {
    if (!modifySelectedDataset) {
      return [];
    }
    const dataset = basicsDatasets[modifySelectedDataset];
    if (!dataset) {
      return [];
    }
    const lessonsWithRecords = lessons.filter((lesson) => {
      const lessonData = dataset[lesson.lessonNumber];
      return lessonData && lessonData.length > 0;
    });
    return lessonsWithRecords;
  }, [basicsDatasets, modifySelectedDataset, lessons]);

  // 获取当前选中课程的显示文本
  const modifySelectedLessonDisplay = useMemo(() => {
    const lesson = availableLessons.find(l => l.lessonNumber === modifySelectedLesson);
    return lesson?.displayText || "";
  }, [availableLessons, modifySelectedLesson]);

  // 获取可用的记录列表
  const availableRecords = useMemo(() => {
    if (!modifySelectedDataset) {
      return [];
    }
    const dataset = basicsDatasets[modifySelectedDataset];
    if (!dataset || !dataset[modifySelectedLesson]) {
      return [];
    }
    const lessonRecords = dataset[modifySelectedLesson];
    return lessonRecords.map((record, index) => ({
      index: index,
      displayText: t("dataManagement.recordLabel", { number: (index + 1).toString().padStart(2, "0") }),
      timestamp: record.timestamp,
      accuracy: record.accuracy,
      duration: record.duration,
    }));
  }, [basicsDatasets, modifySelectedDataset, modifySelectedLesson]);

  const availableAdvancedRecords = useMemo(() => {
    const recordsMap: Record<string, any[]> = {
      "word": advancedWord,
      "callsign": advancedCallsign,
      "qtc": advancedQTC,
    };
    const records = recordsMap[modifyAdvancedType] || [];
    return records.map((record, index) => ({
      index: index,
      displayText: t("dataManagement.recordLabel", { number: (index + 1).toString().padStart(2, "0") }),
      timestamp: record.timestamp,
      duration: record.duration,
      charSpeed: record.charSpeed,
      score: record.score,
    }));
  }, [modifyAdvancedType, advancedWord, advancedCallsign, advancedQTC]);

  // 获取当前选中记录的显示文本
  const modifySelectedRecordDisplay = useMemo(() => {
    const record = availableRecords.find(r => r.index === modifySelectedRecord);
    return record?.displayText || "";
  }, [availableRecords, modifySelectedRecord]);

  const modifyAdvancedRecordDisplay = useMemo(() => {
    const record = availableAdvancedRecords.find(r => r.index === modifyAdvancedIndex);
    return record?.displayText || "";
  }, [availableAdvancedRecords, modifyAdvancedIndex]);

  // 数据集变化时重置课程和记录选择
  useEffect(() => {
    if (!modifySelectedDataset) {
      return;
    }
    const dataset = basicsDatasets[modifySelectedDataset];
    if (dataset) {
      const lessonNumbers = Object.keys(dataset).map(Number).sort((a, b) => b - a);
      if (lessonNumbers.length > 0) {
        const latestLesson = lessonNumbers[0];
        setModifySelectedLesson(latestLesson);
        const lessonRecords = dataset[latestLesson];
        if (lessonRecords && lessonRecords.length > 0) {
          const latestRecordIndex = lessonRecords.length - 1;
          setModifySelectedRecord(latestRecordIndex);
        }
      }
    }
  }, [modifySelectedDataset]);

  // 变化时重置记录选择
  useEffect(() => {
    if (availableRecords.length > 0) {
      const latestRecordIndex = availableRecords.length - 1;
      setModifySelectedRecord(latestRecordIndex);
    }
  }, [modifySelectedLesson, availableRecords]);

  useEffect(() => {
    if (availableAdvancedRecords.length > 0) {
      const latestRecordIndex = availableAdvancedRecords.length - 1;
      setModifyAdvancedIndex(latestRecordIndex);
    }
  }, [modifyAdvancedType, availableAdvancedRecords]);

  // 选中记录变化时更新编辑数据
  useEffect(() => {
    if (modifyStoreType === "basics") {
      if (availableRecords.length === 0) {
        setEditedTimestamp("");
        setEditedAccuracy("");
        setEditedDuration("");
        return;
      }
      const record = availableRecords.find(r => r.index === modifySelectedRecord);
      if (record) {
        setEditedTimestamp(formatTimestamp(record.timestamp, true));
        setEditedAccuracy(record.accuracy.toString());
        setEditedDuration(record.duration.toString());
      }
    } else {
      if (availableAdvancedRecords.length === 0) {
        setEditedTimestamp("");
        setEditedDuration("");
        setEditedCharSpeed("");
        setEditedScore("");
        return;
      }
      const record = availableAdvancedRecords.find(r => r.index === modifyAdvancedIndex);
      if (record) {
        setEditedTimestamp(formatTimestamp(record.timestamp, true));
        setEditedDuration(record.duration.toString());
        setEditedCharSpeed(record.charSpeed.toString());
        setEditedScore(record.score.toString());
      }
    }
  }, [modifyStoreType, modifySelectedRecord, availableRecords, modifyAdvancedIndex, availableAdvancedRecords]);

  // 初始化基础训练
  const initializeBasicsSelection = () => {
    if (availableBasicsDatasets.length === 0) {
      setModifySelectedDataset("");
      setModifySelectedLesson(0);
      setModifySelectedRecord(0);
      return;
    }
    const defaultDataset = availableBasicsDatasets.includes(currentDatasetName)
      ? currentDatasetName
      : availableBasicsDatasets[0];
    setModifySelectedDataset(defaultDataset);
    const dataset = basicsDatasets[defaultDataset];
    if (!dataset) return;
    const lessonNumbers = Object.keys(dataset).map(Number).sort((a, b) => b - a);
    if (lessonNumbers.length === 0) return;
    const latestLesson = lessonNumbers[0];
    setModifySelectedLesson(latestLesson);
    const lessonRecords = dataset[latestLesson];
    if (lessonRecords && lessonRecords.length > 0) {
      setModifySelectedRecord(lessonRecords.length - 1);
    }
  };

  // 初始化进阶训练
  const initializeAdvancedSelection = () => {
    if (availableAdvancedTypes.length === 0) {
      setModifyAdvancedType("word");
      setModifyAdvancedIndex(0);
      return;
    }
    const defaultType = availableAdvancedTypes[0] as "word" | "callsign" | "qtc";
    setModifyAdvancedType(defaultType);
    const recordsMap: Record<string, any[]> = {
      "word": advancedWord,
      "callsign": advancedCallsign,
      "qtc": advancedQTC,
    };
    const records = recordsMap[defaultType] || [];
    if (records.length > 0) {
      setModifyAdvancedIndex(records.length - 1);
    }
  };

  // 打开对话框时初始化选择
  useEffect(() => {
    if (isModifyDialogOpen) {
      setModifyStoreType("basics");
      initializeBasicsSelection();
    }
  }, [isModifyDialogOpen]);

  useEffect(() => {
    if (!isModifyDialogOpen) return;
    if (modifyStoreType === "basics") {
      initializeBasicsSelection();
    } else {
      initializeAdvancedSelection();
    }
  }, [modifyStoreType]);

  // 当选中记录变化或对话框关闭时，清除错误提示
  useEffect(() => {
    setTimestampError(false);
    setAccuracyError(false);
    setDurationError(false);
    setCharSpeedError(false);
    setScoreError(false);
  }, [modifyStoreType, modifySelectedRecord, modifyAdvancedIndex, isModifyDialogOpen]);

  // 导出数据
  const handleExport = async () => {
    try {
      const filePath = await save({
        title: t("dataManagement.dialogs.exportTitle"),
        defaultPath: `morse-training-data.json`,
        filters: [{
          name: t("dataManagement.dialogs.jsonFiles"),
          extensions: ["json"],
        }],
      });

      if (filePath) {
        const jsonData = recordManager.exportData();
        await writeTextFile(filePath, jsonData);
        setIsPopoverOpen(false);
        onDataChange?.();
      }
    } catch (error) {
      log.error(`Error exporting data: ${error}`, "DataManagement");
    }
  };

  // 导入数据
  const handleImport = async () => {
    try {
      const filePath = await open({
        title: t("dataManagement.dialogs.importTitle"),
        multiple: false,
        directory: false,
        filters: [{
          name: t("dataManagement.dialogs.jsonFiles"),
          extensions: ["json"],
        }],
      });

      if (filePath && typeof filePath === "string") {
        const content = await readTextFile(filePath);
        const success = recordManager.importData(content);
        if (success) {
          setIsPopoverOpen(false);
          onDataChange?.();
        }
      }
    } catch (error) {
      log.error(`Error importing data: ${error}`, "DataManagement");
    }
  };

  // 验证基础训练数据
  const validateBasicsData = () => {
    let hasError = false;
    // 验证时间戳
    const { valid: timestampValid, timestamp } = validateTimestamp(editedTimestamp);
    if (!timestampValid) {
      setTimestampError(true);
      hasError = true;
    }
    // 验证准确率
    const accuracy = Number(editedAccuracy);
    if (isNaN(accuracy) || accuracy < 0 || accuracy > 100) {
      setAccuracyError(true);
      hasError = true;
    }
    // 验证时长
    const duration = Number(editedDuration);
    if (isNaN(duration) || duration < 0) {
      setDurationError(true);
      hasError = true;
    }
    if (hasError) {
      return null;
    }
    return { timestamp, accuracy, duration };
  };

  // 验证进阶训练数据
  const validateAdvancedData = () => {
    let hasError = false;
    // 验证时间戳
    const { valid: timestampValid, timestamp } = validateTimestamp(editedTimestamp);
    if (!timestampValid) {
      setTimestampError(true);
      hasError = true;
    }
    // 验证字符速率
    const charSpeed = Number(editedCharSpeed);
    if (isNaN(charSpeed) || charSpeed < 5 || charSpeed > 125) {
      setCharSpeedError(true);
      hasError = true;
    }
    // 验证分数
    const score = Number(editedScore);
    if (isNaN(score) || score < 0) {
      setScoreError(true);
      hasError = true;
    }
    // 验证时长
    const duration = Number(editedDuration);
    if (isNaN(duration) || duration < 0) {
      setDurationError(true);
      hasError = true;
    }
    if (hasError) {
      return null;
    }
    return { timestamp, charSpeed, score, duration };
  };

  // 修改数据
  const handleModify = () => {
    setTimestampError(false);
    setAccuracyError(false);
    setDurationError(false);
    setCharSpeedError(false);
    setScoreError(false);

    let success = false;
    if (modifyStoreType === "basics") {
      const data = validateBasicsData();
      if (!data) return;
      success = recordManager.modifyBasicsRecord(
        modifySelectedDataset,
        modifySelectedLesson,
        modifySelectedRecord,
        data
      );
    } else {
      const data = validateAdvancedData();
      if (!data) return;
      success = recordManager.modifyAdvancedRecord(
        modifyAdvancedType,
        modifyAdvancedIndex,
        data
      );
    }

    if (success) {
      log.info("Record modified successfully", "DataManagement");
      onDataChange?.();
    } else {
      log.error("Failed to modify record", "DataManagement");
    }
  };

  // 更新基础训练数据选择
  const updateBasicsSelection = () => {
    const freshDatasets = useBasicsStore.getState().datasets;
    const dataset = freshDatasets[modifySelectedDataset];
    if (!dataset || Object.keys(dataset).length === 0) {
      const remainDatasets = availableBasicsDatasets.filter(name => name !== modifySelectedDataset);
      if (modifySelectedDataset === currentDatasetName) {
        if (remainDatasets.length > 0) {
          const nextDataset = remainDatasets[0];
          const nextLessons = Object.keys(freshDatasets[nextDataset]).map(Number).sort((a, b) => b - a);
          useBasicsStore.setState({
            currentDatasetName: nextDataset,
            currentLessonNumber: nextLessons[0] ?? 1,
          });
        } else {
          useBasicsStore.setState({
            currentDatasetName: "koch-lcwo",
            currentLessonNumber: 1,
          });
        }
      }
      if (remainDatasets.length > 0) {
        setModifySelectedDataset(remainDatasets[0]);
      } else {
        setModifySelectedDataset("");
        setModifySelectedLesson(0);
        setModifySelectedRecord(0);
      }
      return;
    } 
    const lessonRecords = dataset[modifySelectedLesson];
    if (!lessonRecords || lessonRecords.length === 0) {
      const lessonNumbers = Object.keys(dataset).map(Number).sort((a, b) => b - a);
      if (lessonNumbers.length > 0) {
        const newLesson = lessonNumbers[0];
        setModifySelectedLesson(newLesson);
        const newLessonRecords = dataset[newLesson];
        if (newLessonRecords && newLessonRecords.length > 0) {
          setModifySelectedRecord(newLessonRecords.length - 1);
        }
        if (modifySelectedDataset === currentDatasetName) {
          useBasicsStore.setState({ currentLessonNumber: newLesson });
        }
      }
      return;
    }
    setModifySelectedRecord(Math.max(0, lessonRecords.length - 1));
  };

  // 更新进阶训练数据选择
  const updateAdvancedSelection = () => {
    const recordsMap: Record<string, any[]> = {
      "word": advancedWord,
      "callsign": advancedCallsign,
      "qtc": advancedQTC,
    };
    const records = recordsMap[modifyAdvancedType] || [];
    if (records.length === 0) {
      const remainTypes = availableAdvancedTypes.filter(type => type !== modifyAdvancedType);
      if (remainTypes.length > 0) {
        setModifyAdvancedType(remainTypes[0] as "word" | "callsign" | "qtc");
      }
      return;
    }
    setModifyAdvancedIndex(Math.max(0, records.length - 1));
  };

  // 删除数据
  const handleDelete = () => {
    let success = false;
    if (modifyStoreType === "basics") {
      success = recordManager.deleteBasicsRecord(
        modifySelectedDataset,
        modifySelectedLesson,
        modifySelectedRecord
      );
      if (success) {
        updateBasicsSelection();
      }
    } else {
      success = recordManager.deleteAdvancedRecord(
        modifyAdvancedType,
        modifyAdvancedIndex
      );
      if (success) {
        updateAdvancedSelection();
      }
    }

    if (success) {
      log.info("Record deleted successfully", "DataManagement");
      onDataChange?.();
    } else {
      log.error("Failed to delete record", "DataManagement");
    }
  };

  // 清空数据
  const handleClear = () => {
    recordManager.clearAllData();
    setIsClearDialogOpen(false);
    setIsPopoverOpen(false);
    onDataChange?.();
  };

  return (
    <>
      <Popover
        withArrow
        open={isPopoverOpen}
        onOpenChange={(_, data) => {
          setIsPopoverOpen(data.open);
          if (!data.open) {
            setIsModifyEnabled(false);
            setInputBuffer("");
          }
        }}
        positioning="after"
      >
        <PopoverTrigger disableButtonEnhancement>
          <div onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
            {children}
          </div>
        </PopoverTrigger>
        <PopoverSurface className={styles.popoverSurface}>
          <Button 
            className={styles.button}
            onClick={handleImport}
          >
            <Text className={styles.buttonText}>
              {t("dataManagement.buttons.import")}
            </Text>
          </Button>
          <Button 
            className={styles.button}
            onClick={handleExport}
          >
            <Text className={styles.buttonText}>
              {t("dataManagement.buttons.export")}
            </Text>
          </Button>
          {isModifyEnabled && (
            <Button 
              className={styles.button}
              onClick={() => setIsModifyDialogOpen(true)}
            >
              <Text className={styles.buttonText}>
                {t("dataManagement.buttons.modify")}
              </Text>
            </Button>
          )}
          <Button 
            className={styles.button}
            onClick={() => setIsClearDialogOpen(true)}
          >
            <Text className={styles.buttonText}>
              {t("dataManagement.buttons.clear")}
            </Text>
          </Button>
        </PopoverSurface>
      </Popover>

      {/* 修改数据的 Dialog */}
      <Dialog 
        open={isModifyDialogOpen}
        onOpenChange={(_, data) => setIsModifyDialogOpen(data.open)}
      >
        <DialogSurface className={styles.modifyDialogSurface}>
          <DialogBody>
            <div className={styles.dialogTitleContainer}>
              <DialogTitle className={styles.dialogTitle}>
                {t("dataManagement.modifyDialog.title", {
                  type: modifyStoreType === "basics" 
                  ? t("dataManagement.modifyDialog.types.basics") 
                  : t("dataManagement.modifyDialog.types.advanced")
                })}
              </DialogTitle>
              <div className={styles.dialogIconContainer}>
                <Tooltip
                  content={{
                    children: t("dataManagement.types.basics"),
                    className: styles.tooltip,
                  }}
                  relationship="label"
                  positioning="below-end"
                >
                  <ToggleButton
                    className={styles.toggleButton}
                    appearance="transparent"
                    icon={<Basics />}
                    checked={modifyStoreType === "basics"}
                    onClick={() => setModifyStoreType("basics")}
                  />
                </Tooltip>
                <Tooltip
                  content={{
                    children: t("dataManagement.types.advanced"),
                    className: styles.tooltip,
                  }}
                  relationship="label"
                  positioning="below-end"
                >
                  <ToggleButton
                    className={styles.toggleButton}
                    appearance="transparent"
                    icon={<Advanced />}
                    checked={modifyStoreType === "advanced"}
                    onClick={() => setModifyStoreType("advanced")}
                  />
                </Tooltip>
              </div>
            </div>
            <DialogContent className={styles.modifyDialogContent}>
              <div className={styles.dialogContentContainer}>
                {modifyStoreType === "basics" ? (
                  <>
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.selectDataset")}
                      </Text>
                      <Dropdown
                        id="modify-basics-dataset-dropdown"
                        className={styles.dropdown}
                        expandIcon={<ChevronDown16Regular />}
                        listbox={{ 
                          className: mergeClasses(
                            styles.dropdownListbox,
                            availableBasicsDatasets.length >= 5 && styles.dropdownListboxWithHeight
                          ) 
                        }}
                        value={availableRecords.length > 0 ? t(`dataManagement.basicsDatasets.${modifySelectedDataset}`) : ""}
                        selectedOptions={availableRecords.length > 0 ? [modifySelectedDataset] : []}
                        onOptionSelect={(_, data) => {
                          if (data.optionValue) {
                            setModifySelectedDataset(data.optionValue);
                          }
                        }}
                        disabled={availableBasicsDatasets.length === 0}
                      >
                        {availableBasicsDatasets.map((dataset) => (
                          <Option
                            key={dataset}
                            value={dataset}
                            className={styles.dropdownOption}
                            checkIcon={null}
                          >
                            {t(`dataManagement.basicsDatasets.${dataset}`)}
                          </Option>
                        ))}
                      </Dropdown>
                    </div>
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.selectLesson")}
                      </Text>
                      <Dropdown
                        id="modify-basics-lesson-dropdown"
                        className={styles.dropdown}
                        expandIcon={<ChevronDown16Regular />}
                        listbox={{ 
                          className: mergeClasses(
                            styles.dropdownListbox,
                            availableLessons.length >= 5 && styles.dropdownListboxWithHeight
                          ) 
                        }}
                        value={availableLessons.length > 0 ? modifySelectedLessonDisplay : ""}
                        selectedOptions={availableLessons.length > 0 ? [modifySelectedLesson.toString()] : []}
                        onOptionSelect={(_, data) => {
                          if (data.optionValue) {
                            setModifySelectedLesson(Number(data.optionValue));
                          }
                        }}
                        disabled={availableLessons.length === 0}
                      >
                        {availableLessons.map((lesson) => (
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
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.selectRecord")}
                      </Text>
                      <Dropdown
                        id="modify-basics-record-dropdown"
                        className={styles.dropdown}
                        expandIcon={<ChevronDown16Regular />}
                        listbox={{ 
                          className: mergeClasses(
                            styles.dropdownListbox,
                            availableRecords.length >= 5 && styles.dropdownListboxWithHeight
                          ) 
                        }}
                        value={availableRecords.length > 0 ? modifySelectedRecordDisplay : ""}
                        selectedOptions={availableRecords.length > 0 ? [modifySelectedRecord.toString()] : []}
                        onOptionSelect={(_, data) => {
                          if (data.optionValue) {
                            setModifySelectedRecord(Number(data.optionValue));
                          }
                        }}
                        disabled={availableRecords.length === 0}
                      >
                        {availableRecords.map((record) => (
                          <Option
                            key={record.index}
                            value={record.index.toString()}
                            className={styles.dropdownOption}
                            checkIcon={null}
                          >
                            {record.displayText}
                          </Option>
                        ))}
                      </Dropdown>
                    </div>
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.timestamp")}
                      </Text>
                      <Input 
                        id="modify-basics-timestamp-input"
                        className={mergeClasses(
                          styles.inputBase, 
                          styles.inputLong,
                          timestampError && styles.inputWithError
                        )}
                        value={availableRecords.length > 0 ? editedTimestamp : ""}
                        onFocus={() => setTimestampError(false)}
                        onChange={(_, data) => setEditedTimestamp(data.value)}
                        autoComplete="off"
                        disabled={availableRecords.length === 0}
                      />
                    </div>
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.accuracy")}
                      </Text>
                      <Input 
                        id="modify-basics-accuracy-input"
                        className={mergeClasses(
                          styles.inputBase, 
                          styles.inputShort,
                          accuracyError && styles.inputWithError
                        )}
                        value={availableRecords.length > 0 ? editedAccuracy : ""}
                        onFocus={() => setAccuracyError(false)}
                        onChange={(_, data) => setEditedAccuracy(data.value)}
                        autoComplete="off"
                        disabled={availableRecords.length === 0}
                      />
                    </div>
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.duration")}
                      </Text>
                      <Input
                        id="modify-basics-duration-input"
                        className={mergeClasses(
                          styles.inputBase, 
                          styles.inputShort,
                          durationError && styles.inputWithError
                        )}
                        value={availableRecords.length > 0 ? editedDuration : ""}
                        onFocus={() => setDurationError(false)}
                        onChange={(_, data) => setEditedDuration(data.value)}
                        autoComplete="off"
                        disabled={availableRecords.length === 0}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.selectType")}
                      </Text>
                      <Dropdown
                        id="modify-advanced-type-dropdown"
                        className={styles.dropdown}
                        expandIcon={<ChevronDown16Regular />}
                        listbox={{ className: styles.dropdownListbox }}
                        value={availableAdvancedTypes.length > 0 ? t(`dataManagement.advancedTypes.${modifyAdvancedType}`) : ""}
                        selectedOptions={availableAdvancedTypes.length > 0 ? [modifyAdvancedType] : []}
                        onOptionSelect={(_, data) => {
                          if (data.optionValue) {
                            setModifyAdvancedType(data.optionValue as "word" | "callsign" | "qtc");
                          }
                        }}
                        disabled={availableAdvancedTypes.length === 0}
                      >
                        {availableAdvancedTypes.map((type) => (
                          <Option
                            key={type}
                            value={type}
                            className={styles.dropdownOption}
                            checkIcon={null}
                          >
                            {t(`dataManagement.advancedTypes.${type}`)}
                          </Option>
                        ))}
                      </Dropdown>
                    </div>
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.selectRecord")}
                      </Text>
                      <Dropdown
                        id="modify-advanced-record-dropdown"
                        className={styles.dropdown}
                        expandIcon={<ChevronDown16Regular />}
                        listbox={{ 
                          className: mergeClasses(
                            styles.dropdownListbox,
                            availableAdvancedRecords.length >= 5 && styles.dropdownListboxWithHeight
                          ) 
                        }}
                        value={availableAdvancedRecords.length > 0 ? modifyAdvancedRecordDisplay : ""}
                        selectedOptions={availableAdvancedRecords.length > 0 ? [modifyAdvancedIndex.toString()] : []}
                        onOptionSelect={(_, data) => {
                          if (data.optionValue) {
                            setModifyAdvancedIndex(Number(data.optionValue));
                          }
                        }}
                        disabled={availableAdvancedRecords.length === 0}
                      >
                        {availableAdvancedRecords.map((record) => (
                          <Option
                            key={record.index}
                            value={record.index.toString()}
                            className={styles.dropdownOption}
                            checkIcon={null}
                          >
                            {record.displayText}
                          </Option>
                        ))}
                      </Dropdown>
                    </div>
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.timestamp")}
                      </Text>
                      <Input 
                        id="modify-advanced-timestamp-input"
                        className={mergeClasses(
                          styles.inputBase, 
                          styles.inputLong,
                          timestampError && styles.inputWithError
                        )}
                        value={availableAdvancedRecords.length > 0 ? editedTimestamp : ""}
                        onFocus={() => setTimestampError(false)}
                        onChange={(_, data) => setEditedTimestamp(data.value)}
                        autoComplete="off"
                        disabled={availableAdvancedRecords.length === 0}
                      />
                    </div>
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.score")}
                      </Text>
                      <Input 
                        id="modify-advanced-score-input"
                        className={mergeClasses(
                          styles.inputBase, 
                          styles.inputShort,
                          scoreError && styles.inputWithError
                        )}
                        value={availableAdvancedRecords.length > 0 ? editedScore : ""}
                        onFocus={() => setScoreError(false)}
                        onChange={(_, data) => setEditedScore(data.value)}
                        autoComplete="off"
                        disabled={availableAdvancedRecords.length === 0}
                      />
                    </div>
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.speed")}
                      </Text>
                      <Input
                        id="modify-advanced-speed-input"
                        className={mergeClasses(
                          styles.inputBase, 
                          styles.inputShort,
                          charSpeedError && styles.inputWithError
                        )}
                        value={availableAdvancedRecords.length > 0 ? editedCharSpeed : ""}
                        onFocus={() => setCharSpeedError(false)}
                        onChange={(_, data) => setEditedCharSpeed(data.value)}
                        autoComplete="off"
                        disabled={availableAdvancedRecords.length === 0}
                      />
                    </div>
                    <div className={styles.dialogRow}>
                      <Text className={styles.dialogLabel}>
                        {t("dataManagement.modifyDialog.labels.duration")}
                      </Text>
                      <Input
                        id="modify-advanced-duration-input"
                        className={mergeClasses(
                          styles.inputBase, 
                          styles.inputShort,
                          durationError && styles.inputWithError
                        )}
                        value={availableAdvancedRecords.length > 0 ? editedDuration : ""}
                        onFocus={() => setDurationError(false)}
                        onChange={(_, data) => setEditedDuration(data.value)}
                        autoComplete="off"
                        disabled={availableAdvancedRecords.length === 0}
                      />
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button 
                className={styles.button}
                style={{ minWidth: "75px" }}
                onClick={handleModify}
                disabled={
                  (modifyStoreType === "basics" && availableRecords.length === 0) ||
                  (modifyStoreType === "advanced" && availableAdvancedRecords.length === 0)
                }
              >
                <Text className={styles.buttonText}>
                  {t("dataManagement.modifyDialog.buttons.modify")}
                </Text>
              </Button>
              <Button 
                className={styles.button}
                style={{ minWidth: "75px" }}
                onClick={handleDelete}
                disabled={
                  (modifyStoreType === "basics" && availableRecords.length === 0) ||
                  (modifyStoreType === "advanced" && availableAdvancedRecords.length === 0)
                }
              >
                <Text className={styles.buttonText}>
                  {t("dataManagement.modifyDialog.buttons.delete")}
                </Text>
              </Button>
              <Button 
                className={styles.button}
                style={{ minWidth: "75px" }}
                onClick={() => setIsModifyDialogOpen(false)}
              >
                <Text className={styles.buttonText}>
                  {t("dataManagement.modifyDialog.buttons.close")}
                </Text>
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 确认清空数据的 Dialog */}
      <Dialog 
        open={isClearDialogOpen}
        onOpenChange={(_, data) => setIsClearDialogOpen(data.open)}
      >
        <DialogSurface 
          className={styles.clearDialogSurface}
          style={{ width: language === "English" ? "345px" : "330px" }}
        >
          <DialogBody>
            <DialogTitle className={styles.dialogTitle}>
              {t("dataManagement.clearDialog.title")}
            </DialogTitle>
            <DialogContent 
              className={styles.clearDialogContent}
              style={{ margin: language === "English" ? "-10px 0px -2px 6px" : "-8px -10px -8px 4px" }}
            >
              <Text>
                {t("dataManagement.clearDialog.content")}
              </Text>
            </DialogContent>
            <DialogActions>
              <Button 
                className={styles.button}
                style={{ minWidth: "85px" }}
                onClick={handleClear}
              >
                <Text className={styles.buttonText}>
                  {t("dataManagement.clearDialog.buttons.yes")}
                </Text>
              </Button>
              <Button 
                className={styles.button}
                style={{ minWidth: "85px" }}
                onClick={() => setIsClearDialogOpen(false)}
              >
                <Text className={styles.buttonText}>
                  {t("dataManagement.clearDialog.buttons.no")}
                </Text>
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};