import { useState } from 'react';
import { Plus } from 'lucide-react';

import BalanceCard from '../components/BalanceCard';
import SummaryCards from '../components/SummaryCards';
import TransactionList from '../components/TransactionList';
import AddTransactionModal from '../components/AddTransactionModal';
import { useTransaction } from '../contexts/TransactionContext';
import DashboardChart from '../components/DashboardChart';

export default function HomeScreen() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const userName = localStorage.getItem('finance_user_name') || 'Khách';
    const firstLetter = userName.charAt(0).toUpperCase();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return "Chào buổi sáng,";
        if (hour >= 11 && hour < 14) return "Chào buổi trưa,";
        if (hour >= 14 && hour < 18) return "Chào buổi chiều,";
        return "Chào buổi tối,";
    };

    const { transactions } = useTransaction();

    const totalIncome = transactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    return (
        <div className="min-h-screen text-gray-900 dark:text-gray-100 pb-20 font-sans font-medium transition-colors duration-300">
            <div className="max-w-5xl mx-auto p-5 md:p-8">

                <header className="flex justify-between items-center mb-8">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium transition-colors">{getGreeting()}</p>
                        <h1 className="text-3xl font-bold text-black dark:text-white transition-colors">{userName}</h1>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm transition-colors duration-300">
                        <span className="text-black dark:text-white font-bold text-2xl">{firstLetter}</span>
                    </div>
                </header>

                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <BalanceCard balance={balance} />
                        <SummaryCards income={totalIncome} expense={totalExpense} />
                        <DashboardChart />
                    </div>
                    <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm h-fit transition-colors duration-300">
                        <TransactionList transactions={transactions.slice(0, 5)} />
                    </div>
                </div>

            </div>

            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-8 right-8 lg:right-[352px] w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all z-40"
            >
                <Plus size={30} strokeWidth={2.5} />
            </button>

            <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}