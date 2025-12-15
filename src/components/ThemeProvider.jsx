import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const themeVariables = {
    light: {
      '--background-color': '#f0f2f5',
      '--card-background': '#ffffff',
      '--text-primary': '#1f1f1f',
      '--text-secondary': '#595959',
      '--border-color': '#d9d9d9',
      '--hover-color': '#e6f7ff',
      '--header-background': '#fafafa',
      '--primary-color': '#1890ff',
      '--success-color': '#52c41a',
      '--warning-color': '#faad14',
      '--error-color': '#ff4d4f',
      '--info-color': '#1890ff'
    },
    dark: {
      '--background-color': '#141414',
      '--card-background': '#1f1f1f',
      '--text-primary': '#ffffff',
      '--text-secondary': '#bfbfbf',
      '--border-color': '#434343',
      '--hover-color': '#262626',
      '--header-background': '#262626',
      '--primary-color': '#177ddc',
      '--success-color': '#49aa19',
      '--warning-color': '#d89614',
      '--error-color': '#dc4446',
      '--info-color': '#177ddc'
    }
  };

  const applyTheme = (themeName) => {
    const variables = themeVariables[themeName];
    if (variables) {
      Object.keys(variables).forEach(key => {
        document.documentElement.style.setProperty(key, variables[key]);
      });
    }
  };

  // Apply theme on initial load
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { ThemeProvider, useTheme };