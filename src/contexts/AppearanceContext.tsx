import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "Light" | "Dark";

interface AppearanceContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const AppearanceProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("appTheme");
    return (saved === "Light" || saved === "Dark") ? saved : "Light";
  });
  const [opacity, setOpacity] = useState<number>(100);

  useEffect(() => {
    // 保存到 localStorage
    localStorage.setItem("appTheme", theme);
  }, [theme]);

  return (
    <AppearanceContext.Provider value={{ theme, setTheme, opacity, setOpacity }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }
  return context;
};