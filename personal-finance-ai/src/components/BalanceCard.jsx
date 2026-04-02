import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function BalanceCard({ balance }) {
    return (
        <div className="bg-black dark:bg-white rounded-[24px] p-6 shadow-xl text-white dark:text-black relative overflow-hidden transition-colors duration-300">
            <p className="text-sm font-medium opacity-80">Tổng số dư hiện tại</p>
            <h2 className="text-4xl font-black mt-2 tracking-tight">{formatCurrency(balance)}</h2>
            <div className="mt-5 inline-flex items-center bg-white/20 dark:bg-black/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                <TrendingUp size={16} className="mr-2" strokeWidth={3} />
                <span className="text-xs font-bold">Tài chính đang ổn định</span>
            </div>
        </div>
    );
}