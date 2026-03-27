import { Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { useTransaction } from '../contexts/TransactionContext';
import { formatCurrency } from '../utils/format';

export default function TransactionsScreen() {
    // Lấy toàn bộ dữ liệu từ kho chung
    const { transactions } = useTransaction();

    return (
        <div className="max-w-5xl mx-auto p-5 md:p-8 animate-in fade-in duration-300">

            {/* Header của trang */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Lịch sử Giao dịch</h1>
                    <p className="text-gray-500 mt-1">Quản lý toàn bộ thu chi của bạn</p>
                </div>

                {/* Thanh tìm kiếm & Lọc (Giao diện UI) */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-black focus:ring-1 focus:ring-black outline-none w-full md:w-64 transition-all"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        <span>Lọc</span>
                    </button>
                </div>
            </div>

            {/* Bảng danh sách giao dịch (Table) */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                                <th className="px-6 py-4 font-medium">Giao dịch</th>
                                <th className="px-6 py-4 font-medium">Ngày</th>
                                <th className="px-6 py-4 font-medium">Phân loại</th>
                                <th className="px-6 py-4 font-medium text-right">Số tiền</th>
                                <th className="px-6 py-4 font-medium text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tx) => {
                                const Icon = tx.icon;
                                return (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                                        {/* Cột Tên & Icon */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-full ${tx.isIncome ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                                                    <Icon size={18} />
                                                </div>
                                                <span className="font-bold text-gray-900">{tx.title}</span>
                                            </div>
                                        </td>

                                        {/* Cột Ngày tháng */}
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {tx.date}
                                        </td>

                                        {/* Cột Loại (Thu/Chi) */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${tx.isIncome ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                                                {tx.isIncome ? 'Khoản thu' : 'Khoản chi'}
                                            </span>
                                        </td>

                                        {/* Cột Số tiền */}
                                        <td className={`px-6 py-4 text-right font-bold ${tx.isIncome ? 'text-income' : 'text-expense'}`}>
                                            {tx.isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </td>

                                        {/* Cột Nút Sửa / Xóa */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Trạng thái trống (Nếu không có giao dịch nào) */}
                    {transactions.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Chưa có giao dịch nào được ghi nhận.
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}