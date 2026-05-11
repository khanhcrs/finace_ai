import { useState, useEffect } from 'react';
import { X, ShoppingBag, Coffee, Car, DollarSign } from 'lucide-react';
import { useTransaction } from '../contexts/TransactionContext';
import { toast } from 'react-hot-toast';

export default function AddTransactionModal({ isOpen, onClose }) {
    const { addTransaction, categories } = useTransaction();

    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState(''); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredCategories = categories.filter(c => c.type === (type === 'expense' ? 'EXPENSE' : 'INCOME'));

    useEffect(() => {
        if (filteredCategories.length > 0) {
            setCategoryId(filteredCategories[0].id);
        }
    }, [type, categories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !title || isSubmitting || !categoryId) return;

        setIsSubmitting(true);
        const loadingToast = toast.loading('Đang lưu giao dịch...');

        try {
            const newTx = {
                title: title,
                amount: parseInt(amount.replace(/\D/g, '')),
                isIncome: type === 'income',
                categoryId: parseInt(categoryId)
            };

            const success = await addTransaction(newTx);

            if (success) {
                toast.success('Thêm giao dịch thành công!', { id: loadingToast });
                setAmount('');
                setTitle('');
                setType('expense');
                onClose();
            } else {
                toast.error('Thêm giao dịch thất bại. Vui lòng thử lại!', { id: loadingToast });
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-in slide-in-from-bottom-8 duration-300 border border-gray-100 dark:border-gray-800">

                
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thêm giao dịch</h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => { setType('expense'); }} 
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white dark:bg-gray-700 text-expense shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Khoản chi
                        </button>
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => { setType('income'); }}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-white dark:bg-gray-700 text-income shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Khoản thu
                        </button>
                    </div>

                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Số tiền</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                disabled={isSubmitting}
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0"
                                className={`w-full bg-gray-50 dark:bg-gray-800/50 border ${type === 'expense' ? 'focus:border-expense focus:ring-expense/20' : 'focus:border-income focus:ring-income/20'} rounded-2xl py-4 pl-4 pr-12 text-2xl font-black text-gray-900 dark:text-white outline-none transition-all placeholder-gray-300 dark:placeholder-gray-600 disabled:opacity-50`}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">đ</span>
                        </div>
                    </div>

                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Diễn giải</label>
                            <input
                                type="text"
                                required
                                disabled={isSubmitting}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="VD: Ăn sáng..."
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 dark:text-white focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black outline-none transition-all placeholder-gray-400 disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Danh mục</label>
                            <select
                                value={categoryId}
                                disabled={isSubmitting}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 dark:text-white focus:border-black dark:focus:border-white outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                            >
                                {filteredCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full font-bold text-white py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed ${type === 'expense' ? 'bg-expense hover:bg-red-700' : 'bg-income hover:bg-green-700'}`}
                    >
                        {isSubmitting ? 'Đang lưu...' : 'Lưu giao dịch'}
                    </button>

                </form>
            </div>
        </div>
    );
}