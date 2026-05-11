import { useState, useEffect } from 'react';
import { X, ShoppingBag, Coffee, Car, DollarSign } from 'lucide-react';
import { useTransaction } from '../contexts/TransactionContext';
import { toast } from 'react-hot-toast';

export default function EditTransactionModal({ isOpen, onClose, transaction }) {
    const { updateTransaction, categories } = useTransaction();

    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (transaction) {
            setType(transaction.isIncome ? 'income' : 'expense');
            setAmount(new Intl.NumberFormat('vi-VN').format(transaction.amount));
            setTitle(transaction.title);
            setCategoryId(transaction.categoryId || '');
        }
    }, [transaction, isOpen]);

    const filteredCategories = categories.filter(c => c.type === (type === 'income' ? 'INCOME' : 'EXPENSE'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !title || !categoryId || isSubmitting) return;

        setIsSubmitting(true);
        const loadingToast = toast.loading('Đang cập nhật giao dịch...');

        try {
            const updatedTx = {
                title: title,
                amount: parseInt(amount.replace(/\D/g, '')),
                isIncome: type === 'income',
                categoryId: categoryId,
                date: transaction.date
            };

            const success = await updateTransaction(transaction.id, updatedTx);

            if (success) {
                toast.success('Cập nhật thành công!', { id: loadingToast });
                onClose();
            } else {
                toast.error('Cập nhật thất bại!', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra!', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value) {
            setAmount(new Intl.NumberFormat('vi-VN').format(value));
        } else {
            setAmount('');
        }
    };

    if (!isOpen || !transaction) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sửa giao dịch</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white dark:bg-gray-700 text-expense shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Khoản chi
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-white dark:bg-gray-700 text-income shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Khoản thu
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Số tiền</label>
                        <div className="relative">
                            <input
                                type="text" required disabled={isSubmitting} value={amount} onChange={handleAmountChange}
                                className={`w-full bg-gray-50 dark:bg-gray-800/50 border ${type === 'expense' ? 'focus:border-expense focus:ring-expense/20' : 'focus:border-income focus:ring-income/20'} rounded-2xl py-4 pl-4 pr-12 text-2xl font-black text-gray-900 dark:text-white outline-none transition-all`}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">đ</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Diễn giải</label>
                            <input
                                type="text" required disabled={isSubmitting} value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 dark:text-white focus:border-black outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Danh mục</label>
                            <select
                                value={categoryId} disabled={isSubmitting} onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 dark:text-white focus:border-black outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Chọn danh mục</option>
                                {filteredCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit" disabled={isSubmitting}
                        className={`w-full font-bold text-white py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all mt-4 ${type === 'expense' ? 'bg-expense hover:bg-red-700' : 'bg-income hover:bg-green-700'}`}
                    >
                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </form>
            </div>
        </div>
    );
}