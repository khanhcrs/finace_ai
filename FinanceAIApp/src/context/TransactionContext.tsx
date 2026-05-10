import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ShoppingBag, Coffee, Car, DollarSign, Utensils,
    Home, Tv, Briefcase, HelpCircle, Zap, Heart,
    Bus, Film, BookOpen, GraduationCap,
    Plane, Gift, Stethoscope, PawPrint
} from 'lucide-react-native';
import { API_BASE_URL } from '../api/config';

export type Transaction = {
    id: number;
    title: string;
    date: string;
    amount: number;
    isIncome: boolean;
    icon: any;
    categoryId: number | null;
    categoryName: string;
};

export type Category = {
    id: number;
    name: string;
    icon: string;
    type: 'INCOME' | 'EXPENSE';
    limitAmount: number | null;
};

type TransactionContextType = {
    transactions: Transaction[];
    categories: Category[];
    isLoading: boolean;
    addTransaction: (newTx: any) => Promise<boolean>;
    updateTransaction: (id: number, updatedTx: any) => Promise<boolean>;
    deleteTransaction: (id: number) => Promise<boolean>;
    fetchData: (silent?: boolean) => Promise<void>;
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const ICON_MAP: Record<string, any> = {
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

const API_TX_URL = `${API_BASE_URL}/transactions`;
const API_CAT_URL = `${API_BASE_URL}/categories`;

export function TransactionProvider({ children }: { children: React.ReactNode }) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getUserId = async () => {
        try {
            const savedUserId = await AsyncStorage.getItem('finance_user_id');
            return savedUserId ? parseInt(savedUserId) : 1;
        } catch (e) {
            console.warn("AsyncStorage.getItem error for finance_user_id:", e);
            return 1; // Default fallback
        }
    };

    const fetchData = useCallback(async (silent: boolean = false) => {
        const userId = await getUserId();
        try {
            if (!silent) setIsLoading(true);
            const [catRes, txRes] = await Promise.all([
                axios.get(`${API_CAT_URL}/user/${userId}`),
                axios.get(`${API_TX_URL}/user/${userId}`)
            ]);

            setCategories(catRes.data);

            const formattedTx = txRes.data.map((tx: any) => {
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
                    categoryName: tx.category ? tx.category.name : 'Khác'
                };
            });

            // SẮP XẾP: Mới nhất lên đầu
            formattedTx.sort((a: any, b: any) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateB !== dateA) return dateB - dateA;
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

    const addTransaction = async (newTx: any) => {
        const userId = await getUserId();
        try {
            let categoryId = newTx.categoryId;

            // Nếu chưa có categoryId (nhập từ AI hoặc text), thử tìm kiếm
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
            }

            // Fallback cuối cùng: Lấy danh mục đầu tiên phù hợp với loại Thu/Chi
            if (!categoryId && categories.length > 0) {
                const typeToMatch = newTx.isIncome ? 'INCOME' : 'EXPENSE';
                const fallbackList = categories.filter(c => c.type === typeToMatch);
                categoryId = fallbackList.length > 0 ? fallbackList[0].id : categories[0].id;
            }

            if (!categoryId) {
                console.error("Không tìm thấy danh mục hợp lệ");
                return false;
            }

            const dataToSend = {
                amount: newTx.amount,
                note: newTx.title,
                type: newTx.isIncome ? 'INCOME' : 'EXPENSE',
                transactionDate: new Date().toISOString().split('T')[0],
                isAnomaly: false,
                category: { id: categoryId },
                user: { id: userId }
            };

            const response = await axios.post(API_TX_URL, dataToSend);
            if (response.status === 200 || response.status === 201) {
                await fetchData(true); // Cập nhật lại danh sách ngay lập tức (ngầm)
                return true;
            }
            return false;
        } catch (error) {
            console.error("Lỗi khi lưu vào DB:", error);
            return false;
        }
    };

    const updateTransaction = async (id: number, updatedTx: any) => {
        const userId = await getUserId();
        try {
            let currentCategoryId = updatedTx.categoryId;
            const expectedType = updatedTx.isIncome ? 'INCOME' : 'EXPENSE';

            // KIỂM TRA MÂU THUẪN: Tìm danh mục hiện tại xem nó là Thu hay Chi
            const categoryToUse = categories.find(c => c.id === currentCategoryId);
            
            // Nếu danh mục cũ không cùng loại với loại mới (Ví dụ đổi từ Chi sang Thu)
            if (!categoryToUse || categoryToUse.type !== expectedType) {
                // Tự động tìm một danh mục bất kỳ thuộc loại mới (Thu/Chi) để thay thế
                const fallbackList = categories.filter(c => c.type === expectedType);
                if (fallbackList.length > 0) {
                    currentCategoryId = fallbackList[0].id; // Lấy tạm danh mục đầu tiên làm mặc định
                }
            }

            const dataToSend = {
                amount: updatedTx.amount,
                note: updatedTx.title,
                type: expectedType,
                transactionDate: updatedTx.date || new Date().toISOString().split('T')[0],
                category: { id: currentCategoryId }, // Gửi danh mục đã được xử lý mâu thuẫn
                user: { id: userId }
            };

            const response = await axios.put(`${API_TX_URL}/${id}`, dataToSend);
            
            // Cập nhật lại danh sách trên màn hình
            await fetchData(true);
            return true;
        } catch (error) {
            console.error("Lỗi khi cập nhật giao dịch:", error);
            return false;
        }
    };
    const deleteTransaction = async (id: number) => {
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

export const useTransaction = () => {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error('useTransaction must be used within a TransactionProvider');
    }
    return context;
};
