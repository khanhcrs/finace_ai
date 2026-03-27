import { useState } from 'react';
import { Plus } from 'lucide-react';

import BalanceCard from '../components/BalanceCard';
import SummaryCards from '../components/SummaryCards';
import TransactionList from '../components/TransactionList';
import AddTransactionModal from '../components/AddTransactionModal';
import { useTransaction } from '../contexts/TransactionContext'; // <-- Import Hook
import DashboardChart from '../components/DashboardChart';

export default function HomeScreen() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // MÓC DỮ LIỆU TỪ KHO RA (Thay vì tự khai báo như trước)
    const { transactions } = useTransaction();

    const totalIncome = transactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    return (
        <div className="min-h-screen bg-background text-gray-900 pb-20 font-sans font-medium">
            <div className="max-w-5xl mx-auto p-5 md:p-8">

                <header className="flex justify-between items-center mb-8">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Chào buổi sáng,</p>
                        <h1 className="text-3xl font-bold text-black">KT</h1>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-card border border-gray-200 flex items-center justify-center shadow-sm">
                        <span className="text-black font-bold text-2xl">K</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <BalanceCard balance={balance} />
                        <SummaryCards income={totalIncome} expense={totalExpense} />
                        <DashboardChart />
                    </div>
                    <div className="lg:col-span-1 bg-card border border-gray-100 rounded-2xl p-5 shadow-sm h-fit">
                        <TransactionList transactions={transactions} />
                    </div>
                </div>

            </div>

            {/* 3. Bắt sự kiện onClick đổi isModalOpen thành true */}
            <button
                onClick={() => setIsModalOpen(true)}
                // ĐÃ THÊM: lg:right-[352px] để né con Chatbot ra
                className="fixed bottom-8 right-8 lg:right-[352px] w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all z-40"
            >
                <Plus size={30} strokeWidth={2.5} />
            </button>

            {/* 4. Nhúng Modal vào dưới cùng. Truyền prop isOpen và hàm onClose */}
            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

        </div>
    );
}