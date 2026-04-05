// File: src/contexts/TransactionContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Coffee, Car, DollarSign } from 'lucide-react';

const TransactionContext = createContext();

// TỪ ĐIỂN CHUYỂN ĐỔI CHỮ THÀNH ICON COMPONENT
const ICON_MAP = {
    'Coffee': Coffee,
    'Car': Car,
    'ShoppingBag': ShoppingBag,
    'DollarSign': DollarSign,
};

const savedUserId = localStorage.getItem('finance_user_id');
const USER_ID = savedUserId ? parseInt(savedUserId) : 1;

const API_TX_URL = `http://localhost:8080/api/transactions`;
const API_GET_TX_BY_USER = `http://localhost:8080/api/transactions/user/${USER_ID}`;
const API_GET_CAT_BY_USER = `http://localhost:8080/api/categories/user/${USER_ID}`;

export function TransactionProvider({ children }) {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [catRes, txRes] = await Promise.all([
                axios.get(API_GET_CAT_BY_USER),
                axios.get(API_GET_TX_BY_USER)
            ]);

            setCategories(catRes.data);

            const formattedTx = txRes.data.map(tx => ({
                id: tx.id,
                title: tx.note,
                date: tx.transactionDate,
                amount: tx.amount,
                isIncome: tx.type === 'INCOME',
                icon: tx.category && tx.category.icon ? ICON_MAP[tx.category.icon] : ShoppingBag,

                // BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ THỐNG KÊ BIẾT ĐƯỜNG CHIA
                categoryName: tx.category ? tx.category.name : 'Khác'
            }));

            setTransactions(formattedTx);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addTransaction = async (newTx) => {
        try {
            let categoryId = null;

            // 1. NẾU NHẬP TỪ NÚT DẤU "+" (Có icon)
            if (newTx.icon && typeof newTx.icon !== 'string') {
                const iconName = newTx.icon.displayName || newTx.icon.name;
                // Nếu tìm ra tên icon thì mới dò, không thì thôi
                if (iconName) {
                    const matched = categories.find(c => c.icon === iconName);
                    if (matched) categoryId = matched.id;
                }
            }

            // 2. NẾU AI BOT GỬI KÈM TÊN DANH MỤC
            if (!categoryId && newTx.category) {
                const matched = categories.find(c => c.name.toLowerCase().includes(newTx.category.toLowerCase()));
                if (matched) categoryId = matched.id;
            }

            // 3. BOT LƯỜI KHÔNG GỬI -> QUÉT TỪ KHÓA TRONG CÂU NÓI CỦA BẠN
            if (!categoryId && newTx.title) {
                const titleLower = newTx.title.toLowerCase();

                // Khai báo cụm từ rõ ràng thay vì chữ đơn lẻ
                const isFood = ['ăn sáng', 'ăn trưa', 'ăn tối', 'ăn phở', 'ăn uống', 'cà phê', 'cafe', 'trà sữa'].some(k => titleLower.includes(k));
                const isTransport = ['xăng', 'xe ôm', 'grab', 'di chuyển', 'taxi'].some(k => titleLower.includes(k));
                const isShopping = ['mua', 'vé số', 'quần áo', 'siêu thị'].some(k => titleLower.includes(k));

                if (isFood) {
                    categoryId = categories.find(c => c.name === 'Ăn uống')?.id;
                } else if (isTransport) {
                    categoryId = categories.find(c => c.name === 'Di chuyển')?.id;
                } else if (isShopping) {
                    // Nếu là "mua vé số" thì vào Mua sắm
                    categoryId = categories.find(c => c.name === 'Mua sắm')?.id;
                }
            }

            // 4. FALLBACK CUỐI CÙNG: Nếu vẫn mù tịt, ép nó vào danh mục đúng loại (Thu/Chi)
            if (!categoryId) {
                const fallbackList = categories.filter(c => c.type === (newTx.isIncome ? 'INCOME' : 'EXPENSE'));
                categoryId = fallbackList.length > 0 ? fallbackList[0].id : categories[0].id;
            }

            if (!categoryId) {
                alert("Lỗi: Tài khoản chưa có danh mục!");
                return;
            }

            const dataToSend = {
                amount: newTx.amount,
                note: newTx.title,
                type: newTx.isIncome ? 'INCOME' : 'EXPENSE',
                transactionDate: new Date().toISOString().split('T')[0],
                isAnomaly: false,
                category: { id: categoryId },
                user: { id: USER_ID }
            };

            await axios.post(API_TX_URL, dataToSend);
            fetchData();

        } catch (error) {
            console.error("Lỗi khi lưu vào DB:", error);
        }
    };

    return (
        <TransactionContext.Provider value={{ transactions, addTransaction, isLoading, fetchData }}>
            {children}
        </TransactionContext.Provider>
    );
}

export const useTransaction = () => useContext(TransactionContext);