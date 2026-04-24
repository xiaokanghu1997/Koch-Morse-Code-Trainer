import { 
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Button,
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
  makeStyles,
  mergeClasses,
  tokens
} from "@fluentui/react-components";
import { ChevronDown16Regular } from "@fluentui/react-icons";
import { useEffect, useState, useMemo } from "react";
import { useTrainingStore } from "../stores/trainingStore";
import { useGeneratorStore } from "../stores/generatorStore";
import { useLessonManager } from "../hooks/useLessonManager";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
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
    width: "105px",
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
    paddingBottom: "1.2px",
  },
  modifyDialogSurface: {
    display: "flex",
    flexDirection: "column",
    width: "280px",
    height: "330px",
    padding: "12px 16px",
  },
  clearDialogSurface: {
    display: "flex",
    flexDirection: "column",
    width: "360px",
    height: "135px",
    padding: "12px 16px",
  },
  modifyDialogContent: {
    fontSize: tokens.fontSizeBase300,
    marginTop: "-4px",
    marginBottom: "1px",
    marginLeft: "6px",
    flex: 1,
    overflow: "hidden",
  },
  clearDialogContent: {
    fontSize: tokens.fontSizeBase300,
    marginTop: "-8px",
    marginBottom: "-2px",
    marginLeft: "6px",
  },
  dialogTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
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
  dialogButton: {
    width: "80px",
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
});

interface DataManagementProps {
  children?: React.ReactNode; // 用于接收触发图标
  onDataChange?: () => void;
}

export const DataManagement = ({ children, onDataChange }: DataManagementProps) => {
  const styles = useStyles();

  // 获取当前数据集
  const currentDatasetName = useGeneratorStore((state) => state.savedConfig.datasetName);

  // 获取全局训练记录
  const globalRecords = useTrainingStore((state) => state.globalRecords);

  // 获取有训练记录的数据集
  const availableDatasets = useMemo(() => {
    return Object.keys(globalRecords.datasets).filter(
      (datasetName) => globalRecords.datasets[datasetName].recordCount > 0
    );
  }, [globalRecords]);

  // Popover 状态
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // 数据操作函数
  const { exportData, importData, clearAllData, modifyRecord } = useTrainingStore();

  // 修改数据操作
  const [isModifyEnabled, setIsModifyEnabled] = useState(false);
  const [inputBuffer, setInputBuffer] = useState("");

  // 修改数据对话框状态
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false);
  const [modifySelectedDataset, setModifySelectedDataset] = useState<string>(() => {
    if (availableDatasets.includes(currentDatasetName)) {
      return currentDatasetName;
    }
    return availableDatasets.length > 0 ? availableDatasets[0] : "";
  });
  const [modifySelectedLesson, setModifySelectedLesson] = useState<number>(0);
  const [modifySelectedRecord, setModifySelectedRecord] = useState<number>(0);
  const [editedTimestamp, setEditedTimestamp] = useState<string>("");
  const [editedAccuracy, setEditedAccuracy] = useState<string>("");
  const [editedDuration, setEditedDuration] = useState<string>("");
  const [timestampError, setTimestampError] = useState<boolean>(false);
  const [accuracyError, setAccuracyError] = useState<boolean>(false);
  const [durationError, setDurationError] = useState<boolean>(false);

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

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [inputBuffer]);

  // 获取课程列表
  const { lessons } = useLessonManager(modifySelectedDataset, modifySelectedLesson);

  // 筛选出有记录的课程
  const availableLessons = useMemo(() => {
    const dataset = globalRecords.datasets[modifySelectedDataset];
    if (!dataset) {
      return [];
    }
    const lessonsWithRecords = lessons.filter(
      (lesson) => dataset.lessons[lesson.lessonNumber]?.recordCount > 0
    );
    return lessonsWithRecords;
  }, [globalRecords, modifySelectedDataset, lessons]);

  // 获取当前选中课程的显示文本
  const modifySelectedLessonDisplay = useMemo(() => {
    const lesson = availableLessons.find(l => l.lessonNumber === modifySelectedLesson);
    return lesson?.displayText || "";
  }, [availableLessons, modifySelectedLesson]);

  // 获取可用的记录列表
  const availableRecords = useMemo(() => {
    const dataset = globalRecords.datasets[modifySelectedDataset];
    if (!dataset || !dataset.lessons[modifySelectedLesson]) {
      return [];
    }
    const records = dataset.lessons[modifySelectedLesson].records;
    return records.map((record, index) => ({
      index: index,
      displayText: `Record #${(index + 1).toString().padStart(2, "0")}`,
      timestamp: record.timestamp,
      accuracy: record.accuracy,
      duration: record.duration,
    }));
  }, [globalRecords, modifySelectedDataset, modifySelectedLesson]);

  // 获取当前选中记录的显示文本
  const modifySelectedRecordDisplay = useMemo(() => {
    const record = availableRecords.find(r => r.index === modifySelectedRecord);
    return record?.displayText || "";
  }, [availableRecords, modifySelectedRecord]);

  // 数据集变化时重置课程和记录选择
  useEffect(() => {
    const dataset = globalRecords.datasets[modifySelectedDataset];

    if (dataset) {
      const lessons = Object.keys(dataset.lessons)
        .map(Number)
        .sort((a, b) => b - a);
      
      if (lessons.length > 0) {
        const latestLesson = lessons[0];
        setModifySelectedLesson(latestLesson);

        const records = dataset.lessons[latestLesson].records;
        if (records && records.length > 0) {
          const latestRecordIndex = records.length - 1;
          setModifySelectedRecord(latestRecordIndex);
        }
      }
    }
  }, [modifySelectedDataset, globalRecords]);

  // 课程变化时重置记录选择
  useEffect(() => {
    if (availableRecords.length > 0) {
      const latestRecordIndex = availableRecords.length - 1;
      setModifySelectedRecord(latestRecordIndex);
    }
  }, [modifySelectedLesson, availableRecords]);

  // 选中记录变化时更新编辑数据
  useEffect(() => {
    const record = availableRecords.find(r => r.index === modifySelectedRecord);
    if (record) {
      const date = new Date(record.timestamp);
      const year = date.getFullYear().toString().padStart(4, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      const formattedTimestamp = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    
      setEditedTimestamp(formattedTimestamp);
      setEditedAccuracy(record.accuracy.toString());
      setEditedDuration(record.duration.toString());
    }
  }, [modifySelectedRecord, availableRecords]);

  // 打开对话框时初始化选择
  useEffect(() => {
    if (isModifyDialogOpen && availableDatasets.length > 0) {
      const defaultDataset = availableDatasets.includes(currentDatasetName) 
        ? currentDatasetName 
        : availableDatasets[0];
      setModifySelectedDataset(defaultDataset);

      const dataset = globalRecords.datasets[defaultDataset];
      if (dataset) {
        const lessons = Object.keys(dataset.lessons)
          .map(Number)
          .sort((a, b) => b - a);

        if (lessons.length > 0) {
          const latestLesson = lessons[0];
          setModifySelectedLesson(latestLesson);

          const records = dataset.lessons[latestLesson].records;
          if (records && records.length > 0) {
            const latestRecordIndex = records.length - 1;
            setModifySelectedRecord(latestRecordIndex);
          }
        }
      }
    }
  }, [isModifyDialogOpen]);

  // 当选中记录变化或对话框关闭时，清除错误提示
  useEffect(() => {
    setTimestampError(false);
    setAccuracyError(false);
    setDurationError(false);
  }, [modifySelectedRecord, isModifyDialogOpen]);

  // 导出数据
  const handleExport = async () => {
    try {
      const filePath = await save({
        title: "Export Training Data",
        defaultPath: `morse-training-data.json`,
        filters: [{
          name: "JSON Files",
          extensions: ["json"],
        }],
      });

      if (filePath) {
        const jsonData = exportData();
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
        title: "Import Training Data",
        multiple: false,
        directory: false,
        filters: [{
          name: "JSON Files",
          extensions: ["json"],
        }],
      });

      if (filePath && typeof filePath === "string") {
        const content = await readTextFile(filePath);
        importData(content);
        setIsPopoverOpen(false);
        onDataChange?.();
      }
    } catch (error) {
      log.error(`Error importing data: ${error}`, "DataManagement");
    }
  };

  // 修改数据
  const handleModify = () => {
    setTimestampError(false);
    setAccuracyError(false);
    setDurationError(false);

    let hasError = false;

    // 验证时间戳格式
    const timestampRegex = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!timestampRegex.test(editedTimestamp)) {
      setTimestampError(true);
      hasError = true;
    }

    // 解析时间戳
    let timestamp = 0;
    if (!timestampError) {
      const [datePart, timePart] = editedTimestamp.split(" ");
      const [year, month, day] = datePart.split("/").map(Number);
      const [hours, minutes, seconds] = timePart.split(":").map(Number);
      timestamp = new Date(year, month - 1, day, hours, minutes, seconds).getTime();

      if (isNaN(timestamp)) {
        setTimestampError(true);
        hasError = true;
      }
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
      return;
    }

    const success = modifyRecord(
      modifySelectedDataset,
      modifySelectedLesson,
      modifySelectedRecord,
      {
        timestamp,
        accuracy,
        duration,
      }
    );

    if (success) {
      log.info("Record modified successfully", "DataManagement");
      setIsModifyDialogOpen(false);
      onDataChange?.();
    } else {
      log.error("Failed to modify record", "DataManagement");
    }
  };

  // 清空数据
  const handleClear = () => {
    clearAllData();
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
            <Text className={styles.buttonText}>Import Data</Text>
          </Button>
          <Button 
            className={styles.button}
            onClick={handleExport}
          >
            <Text className={styles.buttonText}>Export Data</Text>
          </Button>
          {isModifyEnabled && (
            <Button 
              className={styles.button}
              onClick={() => setIsModifyDialogOpen(true)}
            >
              <Text className={styles.buttonText}>Modify Data</Text>
            </Button>
          )}
          <Button 
            className={styles.button}
            onClick={() => setIsClearDialogOpen(true)}
          >
            <Text className={styles.buttonText}>Clear Data</Text>
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
            <DialogTitle className={styles.dialogTitle}>
              Modify Training Data
            </DialogTitle>
            <DialogContent className={styles.modifyDialogContent}>
              <div className={styles.dialogContentContainer}>
                <div className={styles.dialogRow}>
                  <Text className={styles.dialogLabel}>Select dataset:</Text>
                  <Dropdown
                    id="modify-dataset-dropdown"
                    className={styles.dropdown}
                    expandIcon={<ChevronDown16Regular />}
                    listbox={{ 
                      className: mergeClasses(
                        styles.dropdownListbox,
                        availableDatasets.length >= 5 && styles.dropdownListboxWithHeight
                      ) 
                    }}
                    value={modifySelectedDataset}
                    selectedOptions={[modifySelectedDataset]}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) {
                        setModifySelectedDataset(data.optionValue);
                      }
                    }}
                  >
                    {availableDatasets.map((dataset) => (
                      <Option
                        key={dataset}
                        value={dataset}
                        className={styles.dropdownOption}
                        checkIcon={null}
                      >
                        {dataset}
                      </Option>
                    ))}
                  </Dropdown>
                </div>
                <div className={styles.dialogRow}>
                  <Text className={styles.dialogLabel}>Select lesson:</Text>
                  <Dropdown
                    id="modify-lesson-dropdown"
                    className={styles.dropdown}
                    expandIcon={<ChevronDown16Regular />}
                    listbox={{ 
                      className: mergeClasses(
                        styles.dropdownListbox,
                        availableLessons.length >= 5 && styles.dropdownListboxWithHeight
                      ) 
                    }}
                    value={modifySelectedLessonDisplay}
                    selectedOptions={[modifySelectedLesson.toString()]}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) {
                        setModifySelectedLesson(Number(data.optionValue));
                      }
                    }}
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
                  <Text className={styles.dialogLabel}>Select record:</Text>
                  <Dropdown
                    id="modify-record-dropdown"
                    className={styles.dropdown}
                    expandIcon={<ChevronDown16Regular />}
                    listbox={{ 
                      className: mergeClasses(
                        styles.dropdownListbox,
                        availableRecords.length >= 5 && styles.dropdownListboxWithHeight
                      ) 
                    }}
                    value={modifySelectedRecordDisplay}
                    selectedOptions={[modifySelectedRecord.toString()]}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) {
                        setModifySelectedRecord(Number(data.optionValue));
                      }
                    }}
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
                  <Text className={styles.dialogLabel}>Timestamp:</Text>
                  <Input 
                    id="modify-timestamp-input"
                    className={mergeClasses(
                      styles.inputBase, 
                      styles.inputLong,
                      timestampError && styles.inputWithError
                    )}
                    value={editedTimestamp}
                    onFocus={() => setTimestampError(false)}
                    onChange={(_, data) => setEditedTimestamp(data.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.dialogRow}>
                  <Text className={styles.dialogLabel}>Accuracy (%):</Text>
                  <Input 
                    id="modify-accuracy-input"
                    className={mergeClasses(
                      styles.inputBase, 
                      styles.inputShort,
                      accuracyError && styles.inputWithError
                    )}
                    value={editedAccuracy}
                    onFocus={() => setAccuracyError(false)}
                    onChange={(_, data) => setEditedAccuracy(data.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.dialogRow}>
                  <Text className={styles.dialogLabel}>Duration (s):</Text>
                  <Input
                    id="modify-duration-input"
                    className={mergeClasses(
                      styles.inputBase, 
                      styles.inputShort,
                      durationError && styles.inputWithError
                    )}
                    value={editedDuration}
                    onFocus={() => setDurationError(false)}
                    onChange={(_, data) => setEditedDuration(data.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button 
                className={styles.dialogButton}
                onClick={handleModify}
              >
                <Text className={styles.buttonText}>Modify</Text>
              </Button>
              <Button 
                className={styles.dialogButton}
                onClick={() => setIsModifyDialogOpen(false)}
              >
                <Text className={styles.buttonText}>Cancel</Text>
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
        <DialogSurface className={styles.clearDialogSurface}>
          <DialogBody>
            <DialogTitle className={styles.dialogTitle}>
              Confirm Clear Data
            </DialogTitle>
            <DialogContent className={styles.clearDialogContent}>
              <Text>
                Are you sure you want to clear all training data?
                <br />
                This action cannot be undone.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button 
                className={styles.dialogButton}
                onClick={handleClear}
              >
                <Text className={styles.buttonText}>Yes</Text>
              </Button>
              <Button 
                className={styles.dialogButton}
                onClick={() => setIsClearDialogOpen(false)}
              >
                <Text className={styles.buttonText}>No</Text>
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};