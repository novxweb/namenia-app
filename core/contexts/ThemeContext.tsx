import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeMode;
    toggleTheme: (mode: ThemeMode) => void;
    activeScheme: 'light' | 'dark'; // The actual applied scheme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState<ThemeMode>('system');

    useEffect(() => {
        // Load saved theme preference
        AsyncStorage.getItem('theme').then((savedTheme) => {
            if (savedTheme) {
                setTheme(savedTheme as ThemeMode);
            }
        });
    }, []);

    const toggleTheme = (mode: ThemeMode) => {
        setTheme(mode);
        AsyncStorage.setItem('theme', mode);
    };

    const activeScheme = theme === 'system' ? (systemScheme || 'light') : theme;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, activeScheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
