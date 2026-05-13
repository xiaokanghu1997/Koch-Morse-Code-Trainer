import { FluentProvider, makeStyles } from "@fluentui/react-components";
import { useSettingsStore } from "./stores/settingsStore";
import { lightTheme } from "./themes/lightTheme";
import { darkTheme } from "./themes/darkTheme";
import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { BasicsPage } from "./pages/BasicsPage";
import { AdvancedPage} from "./pages/AdvancedPage";
import { ActivityPage } from "./pages/ActivityPage";
import { AboutPage } from "./pages/AboutPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

// 样式定义
const useStyles = makeStyles({
  appWrapper: {
    overflow: "hidden",
    height: "100vh",
  },
});

function App() {
  // 使用样式
  const styles = useStyles();
  // 获取主题设置
  const { theme } = useSettingsStore();

  useEffect(() => {
    getCurrentWindow().show();
/*
    // 禁用全局右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener("contextmenu", handleContextMenu);

    // 清理函数，防止多次 mount 导致重复监听
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
*/
  }, []);

  return (
    <div className={styles.appWrapper}>
      <FluentProvider 
        theme={theme === "Dark" ? darkTheme : lightTheme} 
        data-theme={theme === "Dark" ? "dark" : "light"}
      >
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/basics" replace />} />
            <Route path="basics" element={<BasicsPage />} />
            <Route path="advanced" element={<AdvancedPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/basics" replace />} />
          </Route>
        </Routes>
      </FluentProvider>
    </div>
  );
}

export default App;