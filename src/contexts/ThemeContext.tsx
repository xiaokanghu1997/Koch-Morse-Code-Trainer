import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "Light" | "Dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 从 localStorage 读取，默认为 Light
    const saved = localStorage.getItem("appTheme");
    return (saved === "Light" || saved === "Dark") ? saved : "Light";
  });

  useEffect(() => {
    // 保存到 localStorage
    localStorage.setItem("appTheme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};