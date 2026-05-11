import { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
    const [chartType, setChartType] = useState(() => localStorage.getItem('chartType') || 'pie');
    const [reportRange, setReportRange] = useState(() => localStorage.getItem('reportRange') || 'month');

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        localStorage.setItem('chartType', chartType);
        localStorage.setItem('reportRange', reportRange);

        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode, chartType, reportRange]);

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

export const useSettings = () => useContext(SettingsContext);