// File: src/contexts/SettingsContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    // 1. Khởi tạo state, ưu tiên lấy từ localStorage (nếu người dùng đã từng lưu)
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
    const [chartType, setChartType] = useState(() => localStorage.getItem('chartType') || 'pie');
    const [reportRange, setReportRange] = useState(() => localStorage.getItem('reportRange') || 'month');

    // 2. Lắng nghe thay đổi: Hễ state đổi là lưu ngay xuống localStorage của trình duyệt
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        localStorage.setItem('chartType', chartType);
        localStorage.setItem('reportRange', reportRange);

        // Logic đổi màu Dark Mode cơ bản (Sẽ cần cấu hình thêm Tailwind sau)
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