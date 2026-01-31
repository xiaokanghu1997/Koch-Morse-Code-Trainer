import { FluentProvider, makeStyles } from "@fluentui/react-components";
import { useSettingsStore } from "./stores/settingsStore";
import { kochLightTheme } from "./themes/kochLightTheme";
import { kochDarkTheme } from "./themes/kochDarkTheme";
import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { TrainingPage } from "./pages/TrainingPage";
import { ActivityPage } from "./pages/ActivityPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { GeneratorPage } from "./pages/GeneratorPage";
import { AboutPage } from "./pages/AboutPage";
import { SettingsPage } from "./pages/SettingsPage";

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

  return (
    <div className={styles.appWrapper}>
      <FluentProvider 
        theme={theme === "Dark" ? kochDarkTheme : kochLightTheme} 
        data-theme={theme === "Dark" ? "dark" : "light"}
      >
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/training" replace />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="generator" element={<GeneratorPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/training" replace />} />
          </Route>
        </Routes>
      </FluentProvider>
    </div>
  );
}

export default App;