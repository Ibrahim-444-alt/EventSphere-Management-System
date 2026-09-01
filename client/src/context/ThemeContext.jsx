import { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext(null);

const STORAGE_KEY = "eventsphere-theme";

// EventSphere ka poora CSS pehle se hi var(--x) tokens par bana hua hai, is
// liye theme switch karne ke liye component styles se chhedchhad nahi karni
// parti — sirf yeh attribute badalta hai aur index.css ka [data-theme="light"]
// block khud sambhal leta hai.
function getInitialTheme() {
  if (typeof window === "undefined") return "dark";

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;

  // Pehli dafa koi saved pasand nahi — user ke OS/browser se pucch lete hain.
  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
  return prefersLight ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private browsing ya storage disabled hone par bhi app chalta rahe —
      // sirf agli baar pasand yaad nahi rahegi.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const value = { theme, isDark: theme === "dark", toggleTheme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
