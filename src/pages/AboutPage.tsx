import { 
  Text, 
  Card,
  Link,
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
  makeStyles,
  tokens
} from "@fluentui/react-components";
import {
  Apps24Regular,
  TargetArrow24Regular,
  Mail24Regular,
  Heart24Regular
} from "@fluentui/react-icons";
import { useState } from "react";
import { useTrainingStore } from "../stores/trainingStore";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { log } from "../utils/logger";

// 样式定义
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  card: {
    padding: "14px 16px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "16px",
    backgroundColor: tokens.colorNeutralBackground3,
  },
  icon: {
    color: tokens.colorBrandForeground1,
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  header: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  description: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  value: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    textAlign: "right",
    flexShrink: 0,
  },
  popoverSurface: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground2,
    boxShadow: tokens.shadow2,
    gap: "8px",
    padding: "6px",
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
  buttonText: {
    paddingBottom: "1.2px",
  },
  dialogSurface: {
    width: "360px",
    padding: "12px 16px",
  },
  dialogTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  dialogContent: {
    fontSize: tokens.fontSizeBase300,
    marginTop: "-8px",
    marginBottom: "2px",
  },
});

export const AboutPage = () => {
  // 使用样式
  const styles = useStyles();
  
  // 软件信息
  const appTitle = "Koch - Morse Code Trainer";
  const version = "Version 1.2.0";

  // Popover 状态
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Dialog 状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 数据操作函数
  const { exportData, importData, clearAllData } = useTrainingStore();

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
      }
    } catch (error) {
      log.error(`Error exporting data: ${error}`, "ProcessTrainingData");
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
      }
    } catch (error) {
      log.error(`Error importing data: ${error}`, "ProcessTrainingData");
    }
  };

  // 清空数据
  const handleClear = () => {
    clearAllData();
    setIsDialogOpen(false);
    setIsPopoverOpen(false);
  };

  return (
    <>
      <div className={styles.container}>
        {/* 软件信息 */}
        <Card className={styles.card}>
          <Popover
            withArrow
            open={isPopoverOpen}
            onOpenChange={(_, data) => setIsPopoverOpen(data.open)}
            positioning="after"
          >
            <PopoverTrigger disableButtonEnhancement>
              <Apps24Regular 
                className={styles.icon}
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              />
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
              <Button 
                className={styles.button}
                onClick={() => setIsDialogOpen(true)}
              >
                <Text className={styles.buttonText}>Clear Data</Text>
              </Button>
            </PopoverSurface>
          </Popover>
          <div className={styles.content}>
            <Text className={styles.header}>{appTitle}</Text>
            <Text className={styles.description}>
              © 2026 Xiaokang HU. Licensed under MIT.
            </Text>
          </div>
          <Text className={styles.value}>{version}</Text>
        </Card>

        {/* 设计目的 */}
        <Card className={styles.card}>
          <TargetArrow24Regular className={styles.icon} />
          <div className={styles.content}>
            <Text className={styles.header}>Purpose</Text>
            <Text className={styles.description}>
              Koch-method listening and copying practice
            </Text>
          </div>
          <Text className={styles.value}>
            Train faster and more accurate decoding
          </Text>
        </Card>

        {/* 联系方式 */}
        <Card className={styles.card}>
          <Mail24Regular className={styles.icon} />
          <div className={styles.content}>
            <Text className={styles.header}>Contact</Text>
            <Text className={styles.description}>
              Get in touch with the developer
            </Text>
          </div>
          <Text className={styles.value}>xiaokangh@foxmail.com</Text>
        </Card>

        {/* 致谢信息 */}
        <Card className={styles.card}>
          <Heart24Regular className={styles.icon} />
          <div className={styles.content}>
            <Text className={styles.header}>Acknowledgements</Text>
            <Text className={styles.description}>
              Thanks for the inspiration and support
            </Text>
          </div>
          <Text className={styles.value}>
            Inspired and supported by <Link href="https://fkurz.net/ham/jscwlib.html" target="_blank">jscwlib</Link>
          </Text>
        </Card>
      </div>

      {/* 确认清空数据的 Dialog */}
      <Dialog 
        open={isDialogOpen}
        onOpenChange={(_, data) => setIsDialogOpen(data.open)}
      >
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle className={styles.dialogTitle}>
              Confirm Clear Data
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Text>
                Are you sure you want to clear all training data?
                <br />
                This action cannot be undone.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button 
                className={styles.button}
                onClick={handleClear}
              >
                <Text className={styles.buttonText}>Yes</Text>
              </Button>
              <Button 
                className={styles.button}
                onClick={() => setIsDialogOpen(false)}
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