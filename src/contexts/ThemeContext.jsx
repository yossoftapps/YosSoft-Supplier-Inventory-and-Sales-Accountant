import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // محاولة استعادة المظهر من localStorage أو استخدام 'light' كافتراضي
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('yossoft_theme');
        return savedTheme || 'light';
    });

    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('yossoft_theme', newTheme);
            return newTheme;
        });
    };

    // تطبيق المظهر على جسم الصفحة (Body) لبعض التنسيقات العامة
    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
