import appIcon from "../assets/icon.svg";
import { makeStyles, tokens } from "@fluentui/react-components";
import { 
  Subtract16Regular,  
  Dismiss16Regular 
} from "@fluentui/react-icons";
import { getCurrentWindow } from "@tauri-apps/api/window";

const useStyles = makeStyles({
  titleBar: {
    height: "32px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    userSelect: "none",
    // @ts-ignore
    "-webkit-app-region": "drag",
  },
  appIcon: {
    marginLeft: "8px",
    marginRight: "8px",
    display: "flex",
    alignItems: "center",
  },
  title: {
    marginLeft: "0px",
    fontSize: "12px",
    fontWeight: 400,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    marginLeft: "8px",
    fontSize: "12px",
    fontWeight: 400,
    color: tokens.colorNeutralForeground3,
  },
  controls: {
    display: "flex",
    height: "100%",
  },
  controlButton: {
    width: "46px",
    height: "100%",
    border: "none",
    backgroundColor: "transparent",
    color: tokens.colorNeutralForeground1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // @ts-ignore
    "-webkit-app-region": "no-drag",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    ":active": {
      backgroundColor:  tokens.colorNeutralBackground1Pressed,
    },
  },
  closeButton: {
    ":hover": {
      backgroundColor: "#c42b1c",
      color: "white",
    },
  },
});

export const TitleBar = () => {
  const styles = useStyles();

  const appTitle = "Koch - Morse Code Trainer";
  const version = "v0.0.0";

  // 异步调用窗口方法
  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error("Failed to minimize:", error);
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error("Failed to close:", error);
    }
  };

  return (
    <div className={styles.titleBar}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div className={styles.appIcon}>
          <img src={appIcon} alt="app icon" style={{ width: "20px", height: "20px" }} />
        </div>
        <div className={styles.title}>{appTitle}</div>
        <div className={styles.subtitle}>{version}</div>
      </div>
      <div className={styles.controls}>
        <button className={styles.controlButton} onClick={handleMinimize}>
          <Subtract16Regular />
        </button>
        <button 
          className={`${styles.controlButton} ${styles.closeButton}`} 
          onClick={handleClose}
        >
          <Dismiss16Regular />
        </button>
      </div>
    </div>
  );
};