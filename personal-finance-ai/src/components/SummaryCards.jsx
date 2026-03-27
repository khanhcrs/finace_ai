import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function SummaryCards({ income, expense }) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center space-x-2 text-gray-500 mb-3">
                    <div className="bg-income/10 p-1.5 rounded-full">
                        <ArrowDownCircle size={18} className="text-income" />
                    </div>
                    <span className="text-sm font-medium">Tổng thu</span>
                </div>
                <p className="text-xl font-bold text-gray-900">+{formatCurrency(income)}</p>
            </div>
            <div className="bg-card border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center space-x-2 text-gray-500 mb-3">
                    <div className="bg-expense/10 p-1.5 rounded-full">
                        <ArrowUpCircle size={18} className="text-expense" />
                    </div>
                    <span className="text-sm font-medium">Tổng chi</span>
                </div>
                <p className="text-xl font-bold text-gray-900">-{formatCurrency(expense)}</p>
            </div>
        </div>
    );
}