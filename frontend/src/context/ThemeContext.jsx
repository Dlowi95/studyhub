import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    let saved = null;
    try {
      saved = localStorage.getItem("studyhub_theme");
    } catch {
      // Private browsing or a disabled storage area should not block rendering.
    }
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.colorScheme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === "dark" ? "#171c19" : "#f2d9b3";
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("studyhub_theme", theme);
    } catch {
      // The theme still applies for this session when persistence is unavailable.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// This hook intentionally lives next to its provider for a single theme API.
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
