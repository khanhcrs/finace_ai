import { formatCurrency } from '../utils/format';

export default function TransactionList({ transactions }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Giao dịch gần đây</h3>
                <button className="text-primary font-medium text-sm hover:underline">Xem tất cả</button>
            </div>

            <div className="space-y-3">
                {transactions.map((tx) => {
                    const Icon = tx.icon;
                    return (
                        <div key={tx.id} className="bg-card border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-full ${tx.isIncome ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                                    <Icon size={22} />
                                </div>
                                <div>
                                    <p className="font-bold text-[15px] text-gray-900">{tx.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">{tx.date}</p>
                                </div>
                            </div>
                            <p className={`font-bold text-[15px] ${tx.isIncome ? 'text-income' : 'text-expense'}`}>
                                {tx.isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}