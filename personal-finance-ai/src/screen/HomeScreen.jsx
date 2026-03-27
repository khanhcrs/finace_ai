import { useState } from 'react';
import { Plus, Coffee, Wallet, Car } from 'lucide-react';

import BalanceCard from '../components/BalanceCard';
import SummaryCards from '../components/SummaryCards';
import TransactionList from '../components/TransactionList';

export default function HomeScreen() {
    const [transactions] = useState([
        { id: 1, title: "Ăn sáng - Phở", date: "Hôm nay, 08:30", amount: 45000, isIncome: false, icon: Coffee },
        { id: 2, title: "Nhận lương tháng 3", date: "Hôm qua, 15:00", amount: 5000000, isIncome: true, icon: Wallet },
        { id: 3, title: "Đổ xăng", date: "24/03/2026", amount: 60000, isIncome: false, icon: Car },
        { id: 4, title: "Đóng tiền trọ", date: "22/03/2026", amount: 2500000, isIncome: false, icon: Wallet },
        { id: 5, title: "Bán đồ cũ", date: "20/03/2026", amount: 300000, isIncome: true, icon: Car },
    ]);

    const totalIncome = transactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    return (
        <div className="min-h-screen bg-background text-gray-900 pb-20 font-sans font-medium">
            <div className="max-w-7xl mx-auto p-5 md:p-8">

                <header className="flex justify-between items-center mb-8">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Chào buổi sáng,</p>
                        <h1 className="text-3xl font-bold text-black">Khánh Trần</h1>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-card border border-gray-200 flex items-center justify-center shadow-sm">
                        <span className="text-black font-bold text-2xl">K</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <BalanceCard balance={balance} />
                        <SummaryCards income={totalIncome} expense={totalExpense} />
                        <div className="bg-card border border-gray-100 rounded-2xl p-6 h-64 flex items-center justify-center shadow-sm">
                            <p className="text-gray-400 font-medium">Khu vực Biểu đồ (Sắp ra mắt...)</p>
                        </div>
                    </div>
                    <div className="lg:col-span-1 bg-card border border-gray-100 rounded-2xl p-5 shadow-sm h-fit">
                        <TransactionList transactions={transactions} />
                    </div>
                </div>

            </div>

            {/* Nút Cộng màu đen ngầu */}
            <button className="fixed bottom-8 right-8 w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all">
                <Plus size={30} strokeWidth={2.5} />
            </button>
        </div>
    );
}