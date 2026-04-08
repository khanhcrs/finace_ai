import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type SettingsContextType = {
    darkMode: boolean;
    setDarkMode: (value: boolean) => void;
    chartType: string;
    setChartType: (value: string) => void;
    reportRange: string;
    setReportRange: (value: string) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Safe storage wrapper to handle "Native module is null" errors
const safeStorage = {
    getItem: async (key: string) => {
        try {
            return await AsyncStorage.getItem(key);
        } catch (e) {
            console.warn(`AsyncStorage.getItem error for ${key}:`, e);
            // Fallback for web if AsyncStorage fails
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key);
            }
            return null;
        }
    },
    setItem: async (key: string, value: string) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (e) {
            console.warn(`AsyncStorage.setItem error for ${key}:`, e);
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, value);
            }
        }
    }
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [chartType, setChartType] = useState<string>('pie');
    const [reportRange, setReportRange] = useState<string>('month');
    const [isLoaded, setIsLoaded] = useState(false);
    const isFirstRender = useRef(true);

    // Load initial values
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedDarkMode = await safeStorage.getItem('darkMode');
                const savedChartType = await safeStorage.getItem('chartType');
                const savedReportRange = await safeStorage.getItem('reportRange');

                if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');
                if (savedChartType !== null) setChartType(savedChartType);
                if (savedReportRange !== null) setReportRange(savedReportRange);
            } catch (e) {
                console.error('Failed to load settings', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadSettings();
    }, []);

    // Save changes - only after initial load and when values actually change
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (isLoaded) {
            const saveSettings = async () => {
                try {
                    await safeStorage.setItem('darkMode', String(darkMode));
                    await safeStorage.setItem('chartType', chartType);
                    await safeStorage.setItem('reportRange', reportRange);
                } catch (e) {
                    console.error('Failed to save settings', e);
                }
            };
            saveSettings();
        }
    }, [darkMode, chartType, reportRange, isLoaded]);

    return (
        <SettingsContext.Provider value={{
            darkMode, setDarkMode,
            chartType, setChartType,
            reportRange, setReportRange
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
