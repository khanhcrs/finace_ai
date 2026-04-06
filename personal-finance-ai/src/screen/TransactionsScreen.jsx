// File: src/screens/TransactionsScreen/TransactionsScreen.jsx
import { useState } from 'react';
// 1. ĐÃ THÊM DOLLAR SIGN VÀO ĐÂY ĐỂ LÀM ICON THẾ THÂN
import { Search, Filter, Edit2, Trash2, DollarSign } from 'lucide-react';
import { useTransaction } from '../contexts/TransactionContext';
import { formatCurrency } from '../utils/format';

export default function TransactionsScreen() {
    const { transactions } = useTransaction();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredTransactions = transactions.filter((tx) => {
        const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            filterType === 'all' ? true :
                filterType === 'income' ? tx.isIncome === true :
                    tx.isIncome === false;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="max-w-5xl mx-auto p-5 md:p-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">Lịch sử Giao dịch</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">Quản lý toàn bộ thu chi của bạn</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                        <input
                            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm giao dịch..."
                            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none w-full md:w-64 transition-all"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={16} />
                        <select
                            value={filterType} onChange={(e) => setFilterType(e.target.value)}
                            className="pl-9 pr-8 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 focus:border-black dark:focus:border-white outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">Tất cả</option>
                            <option value="income">Khoản thu</option>
                            <option value="expense">Khoản chi</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-sm transition-colors">
                                <th className="px-6 py-4 font-medium">Giao dịch</th>
                                <th className="px-6 py-4 font-medium">Ngày</th>
                                <th className="px-6 py-4 font-medium">Phân loại</th>
                                <th className="px-6 py-4 font-medium text-right">Số tiền</th>
                                <th className="px-6 py-4 font-medium text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredTransactions.map((tx) => {
                                // 2. BỌC THÉP TẠI ĐÂY: Nếu tx.icon bị rỗng, lập tức lấy DollarSign đắp vào!
                                const Icon = tx.icon || DollarSign;
                                
                                return (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-full ${tx.isIncome ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                                                    <Icon size={18} />
                                                </div>
                                                <span className="font-bold text-gray-900 dark:text-white">{tx.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{tx.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${tx.isIncome ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                                                {tx.isIncome ? 'Khoản thu' : 'Khoản chi'}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${tx.isIncome ? 'text-income' : 'text-expense'}`}>
                                            {tx.isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredTransactions.length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Không tìm thấy giao dịch nào phù hợp.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}