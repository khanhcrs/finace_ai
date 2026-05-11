import { formatCurrency } from '../utils/format';
import { CircleDollarSign, AlertTriangle } from 'lucide-react'; 

export default function TransactionList({ transactions }) {
    if (!transactions) return null;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Giao dịch gần đây</h3>
                <button className="text-gray-500 dark:text-gray-400 font-medium text-sm hover:underline">Xem tất cả</button>
            </div>


            <div className="space-y-3">
                {transactions.map((tx) => {
                    const Icon = tx.icon || CircleDollarSign;

                    return (
                        <div key={tx.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-full ${tx.isIncome ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                                    
                                    <Icon size={22} />
                                </div>
                                <div>
                                    <p className="font-bold text-[15px] text-gray-900 dark:text-white">
                                        {tx.title}
                                        
                                        {tx.isAnomaly && <AlertTriangle size={14} className="inline ml-2 text-amber-500" />}
                                    </p>
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