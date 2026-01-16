import { useEffect } from "react";
import { FluentProvider } from "@fluentui/react-components";
import { makeStyles, tokens } from "@fluentui/react-components";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
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

const useStyles = makeStyles({
  appWrapper: {
    borderRadius: "10px",
    border: `1.5px solid ${tokens.colorNeutralStroke1}`,
    overflow: "hidden",
    height: "100vh",
  },
});

function AppContent() {
  const styles = useStyles();
  const { theme } = useTheme();

  // 禁用右键菜单
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className={styles.appWrapper}>
      <FluentProvider theme={theme === "Dark" ? kochDarkTheme : kochLightTheme}>
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

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;