// File: src/contexts/TransactionContext.jsx
import { createContext, useState, useContext } from 'react';
import { Coffee, Wallet, Car, ShoppingBag } from 'lucide-react';

// 1. Khởi tạo Context (Cái kho)
const TransactionContext = createContext();

// 2. Tạo Provider (Người phân phối dữ liệu cho các màn hình)
export function TransactionProvider({ children }) {
    // Chuyển mảng dữ liệu ảo từ HomeScreen sang đây
    const [transactions, setTransactions] = useState([
        { id: 1, title: "Ăn sáng - Phở", date: "Hôm nay, 08:30", amount: 45000, isIncome: false, icon: Coffee },
        { id: 2, title: "Nhận lương tháng 3", date: "Hôm qua, 15:00", amount: 5000000, isIncome: true, icon: Wallet },
        { id: 3, title: "Đổ xăng", date: "24/03/2026", amount: 60000, isIncome: false, icon: Car },
    ]);

    // Hàm thêm giao dịch mới
    const addTransaction = (newTx) => {
        // Lấy giao dịch mới nhét lên ĐẦU mảng, theo sau là copy lại các giao dịch cũ
        setTransactions([newTx, ...transactions]);
    };

    return (
        <TransactionContext.Provider value={{ transactions, addTransaction }}>
            {children}
        </TransactionContext.Provider>
    );
}

// 3. Tạo Custom Hook để các Component khác gọi ra xài cho nhanh
export const useTransaction = () => useContext(TransactionContext);