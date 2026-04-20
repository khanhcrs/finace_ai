// File: src/contexts/TransactionContext.jsx
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    ShoppingBag, Coffee, Car, DollarSign, Utensils, 
    Home, Tv, Briefcase, HelpCircle, Zap, Heart, 
    Bus, Film, BookOpen, GraduationCap,
    Plane, Gift, Stethoscope, PawPrint
} from 'lucide-react';

const TransactionContext = createContext();

// TỪ ĐIỂN CHUYỂN ĐỔI CHỮ THÀNH ICON COMPONENT
const ICON_MAP = {
    'Coffee': Coffee,
    'Utensils': Utensils,
    'Car': Car,
    'Bus': Bus,
    'ShoppingBag': ShoppingBag,
    'DollarSign': DollarSign,
    'Home': Home,
    'Tv': Tv,
    'Film': Film,
    'Zap': Zap,
    'Heart': Heart,
    'Briefcase': Briefcase,
    'BookOpen': BookOpen,
    'GraduationCap': GraduationCap,
    'HelpCircle': HelpCircle,
    'Plane': Plane,
    'Gift': Gift,
    'Stethoscope': Stethoscope,
    'PawPrint': PawPrint
};

const API_TX_URL = `http://localhost:8080/api/transactions`;
const API_CAT_URL = `http://localhost:8080/api/categories`;

export function TransactionProvider({ children }) {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Lấy userId trực tiếp trong hàm để luôn mới nhất
    const getUserId = () => {
        const savedUserId = localStorage.getItem('finance_user_id');
        return savedUserId ? parseInt(savedUserId) : 1;
    };

    const fetchData = useCallback(async (silent = false) => {
        const userId = getUserId();
        try {
            if (!silent) setIsLoading(true);
            const [catRes, txRes] = await Promise.all([
                axios.get(`${API_CAT_URL}/user/${userId}`),
                axios.get(`${API_TX_URL}/user/${userId}`)
            ]);

            setCategories(catRes.data);

            const formattedTx = txRes.data.map(tx => {
                let IconComponent = ShoppingBag;
                if (tx.category && tx.category.icon) {
                    IconComponent = ICON_MAP[tx.category.icon] || ShoppingBag;
                }

                return {
                    id: tx.id,
                    title: tx.note,
                    date: tx.transactionDate,
                    amount: Number(tx.amount),
                    isIncome: tx.type === 'INCOME',
                    icon: IconComponent,
                    categoryId: tx.category ? tx.category.id : null,
                    categoryName: tx.category ? tx.category.name : 'Khác',
                    createdAt: tx.createdAt // Lưu thêm createdAt để sắp xếp chính xác hơn nếu có
                };
            });

            // SẮP XẾP: Mới nhất lên đầu (Theo ngày giảm dần, sau đó theo ID giảm dần)
            formattedTx.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (dateB - dateA !== 0) return dateB - dateA;
                return b.id - a.id;
            });

            setTransactions(formattedTx);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addTransaction = async (newTx) => {
        const userId = getUserId();
        try {
            let categoryId = newTx.categoryId;

            // Nếu KHÔNG có categoryId truyền vào, mới thử logic đoán category
            if (!categoryId) {
                if (newTx.icon && typeof newTx.icon !== 'string') {
                    const iconName = newTx.icon.displayName || newTx.icon.name;
                    if (iconName) {
                        const matched = categories.find(c => c.icon === iconName);
                        if (matched) categoryId = matched.id;
                    }
                }

                if (!categoryId && newTx.category) {
                    const matched = categories.find(c => c.name.toLowerCase().includes(newTx.category.toLowerCase()));
                    if (matched) categoryId = matched.id;
                }

                if (!categoryId && newTx.title) {
                    const titleLower = newTx.title.toLowerCase();
                    const isFood = ['ăn sáng', 'ăn trưa', 'ăn tối', 'ăn phở', 'ăn uống', 'cà phê', 'cafe', 'trà sữa'].some(k => titleLower.includes(k));
                    const isTransport = ['xăng', 'xe ôm', 'grab', 'di chuyển', 'taxi'].some(k => titleLower.includes(k));
                    const isShopping = ['mua', 'vé số', 'quần áo', 'siêu thị'].some(k => titleLower.includes(k));

                    if (isFood) {
                        categoryId = categories.find(c => c.name === 'Ăn uống')?.id;
                    } else if (isTransport) {
                        categoryId = categories.find(c => c.name === 'Di chuyển')?.id;
                    } else if (isShopping) {
                        categoryId = categories.find(c => c.name === 'Mua sắm')?.id;
                    }
                }

                if (!categoryId && categories.length > 0) {
                    const fallbackList = categories.filter(c => c.type === (newTx.isIncome ? 'INCOME' : 'EXPENSE'));
                    categoryId = fallbackList.length > 0 ? fallbackList[0].id : categories[0].id;
                }
            }

            if (!categoryId) return false;

            const dataToSend = {
                amount: newTx.amount,
                note: newTx.title,
                type: newTx.isIncome ? 'INCOME' : 'EXPENSE',
                transactionDate: new Date().toISOString().split('T')[0],
                isAnomaly: false,
                category: { id: categoryId },
                user: { id: userId }
            };

            await axios.post(API_TX_URL, dataToSend);
            await fetchData(true);
            return true;
        } catch (error) {
            console.error("Lỗi khi lưu vào DB:", error);
            return false;
        }
    };

    const updateTransaction = async (id, updatedTx) => {
        const userId = getUserId();
        try {
            const dataToSend = {
                amount: updatedTx.amount,
                note: updatedTx.title,
                type: updatedTx.isIncome ? 'INCOME' : 'EXPENSE',
                transactionDate: updatedTx.date || new Date().toISOString().split('T')[0],
                category: { id: updatedTx.categoryId },
                user: { id: userId }
            };

            await axios.put(`${API_TX_URL}/${id}`, dataToSend);
            await fetchData(true);
            return true;
        } catch (error) {
            console.error("Lỗi khi cập nhật giao dịch:", error);
            return false;
        }
    };

    const deleteTransaction = async (id) => {
        try {
            await axios.delete(`${API_TX_URL}/${id}`);
            await fetchData(true);
            return true;
        } catch (error) {
            console.error("Lỗi khi xóa giao dịch:", error);
            return false;
        }
    };

    return (
        <TransactionContext.Provider value={{ transactions, categories, addTransaction, updateTransaction, deleteTransaction, isLoading, fetchData }}>
            {children}
        </TransactionContext.Provider>
    );
}

export const useTransaction = () => useContext(TransactionContext);