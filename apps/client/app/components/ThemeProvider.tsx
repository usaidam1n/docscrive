'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateThemeVariables, defaultTheme } from '../../app/theme-config';

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: () => null,
  isDarkMode: false,
  toggleDarkMode: () => null,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState(defaultTheme);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || defaultTheme;
    const darkMode = localStorage.getItem('darkMode') === 'true';

    setThemeState(savedTheme);
    setIsDarkMode(darkMode);

    if (darkMode) {
      document.documentElement.classList.add('dark');
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem('theme', theme);

    const styleElement = document.createElement('style');
    styleElement.setAttribute('id', 'theme-variables');
    styleElement.textContent = generateThemeVariables(theme);

    const existingStyle = document.getElementById('theme-variables');
    if (existingStyle?.parentNode) {
      existingStyle.parentNode.removeChild(existingStyle);
    }

    document.head.appendChild(styleElement);
  }, [theme, mounted]);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, isDarkMode, toggleDarkMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
