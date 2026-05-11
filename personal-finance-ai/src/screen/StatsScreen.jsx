import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/format';
import { useSettings } from '../contexts/SettingsContext';
import { useTransaction } from '../contexts/TransactionContext';
import { Calendar, Filter } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#0ea5e9'];

export default function StatsScreen() {
    const { chartType, darkMode } = useSettings();
    const { transactions } = useTransaction();
    const [range, setRange] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (startDate || endDate) {
            setRange('custom');
        }
    }, [startDate, endDate]);

    const handlePresetClick = (r) => {
        setRange(r);
        if (r !== 'custom') {
            setStartDate('');
            setEndDate('');
        }
    };

    const filterByRange = (txs) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return txs.filter(tx => {
            if (!tx.date) return false;
            const txDate = new Date(tx.date);

            if (range === 'custom') {
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                if (start) start.setHours(0, 0, 0, 0);
                if (end) end.setHours(23, 59, 59, 999);

                if (start && end) return txDate >= start && txDate <= end;
                if (start) return txDate >= start;
                if (end) return txDate <= end;
                return true;
            }

            if (range === '7days') {
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);
                return txDate >= sevenDaysAgo;
            }
            if (range === 'month') {
                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            }
            if (range === 'year') {
                return txDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    };

    const filteredTransactions = filterByRange(transactions);
    const expenseTransactions = filteredTransactions.filter(tx => !tx.isIncome);

    const groupedData = expenseTransactions.reduce((acc, tx) => {
        const catName = tx.categoryName || 'Khác';
        if (!acc[catName]) acc[catName] = 0;
        acc[catName] += Number(tx.amount);
        return acc;
    }, {});

    const expenseData = Object.keys(groupedData).map(name => ({
        name,
        value: groupedData[name]
    })).sort((a, b) => b.value - a.value);

    const totalExpense = expenseData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="max-w-5xl mx-auto p-5 md:p-8 animate-in fade-in duration-300">
            <div className="flex flex-col space-y-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">Báo cáo & Thống kê</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">Phân tích dòng tiền của bạn</p>
                </div>

                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center space-x-2 mb-3 text-gray-400">
                            <Filter size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Lọc nhanh</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all', label: 'Tất cả' },
                                { id: '7days', label: '7 ngày' },
                                { id: 'month', label: 'Tháng này' },
                                { id: 'year', label: 'Năm nay' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handlePresetClick(item.id)}
                                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${range === item.id 
                                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center space-x-2 mb-3 text-gray-400">
                            <Calendar size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Tùy chỉnh ngày</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={`flex-1 bg-gray-50 dark:bg-gray-800 text-xs font-bold py-2 px-3 rounded-xl outline-none border ${range === 'custom' ? 'border-black dark:border-white' : 'border-transparent'}`}
                            />
                            <span className="text-gray-400 text-xs font-bold">-</span>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={`flex-1 bg-gray-50 dark:bg-gray-800 text-xs font-bold py-2 px-3 rounded-xl outline-none border ${range === 'custom' ? 'border-black dark:border-white' : 'border-transparent'}`}
                            />
                        </div>
                    </div>

                </div>
            </div>

            {expenseData.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-10 text-center shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Không có dữ liệu trong khoảng thời gian này.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col h-[400px]">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cơ cấu Chi tiêu</h3>
                        <div className="flex-1 w-full h-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'pie' ? (
                                    <PieChart>
                                        <Pie data={expenseData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" stroke="none">
                                            {expenseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000', borderRadius: '12px' }} />
                                        <Legend iconType="circle" verticalAlign="bottom" />
                                    </PieChart>
                                ) : (
                                    <BarChart data={expenseData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f3f4f6'} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <YAxis hide />
                                        <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000', borderRadius: '12px' }} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {expenseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                        </Bar>
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                            {chartType === 'pie' && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[20px] text-center pointer-events-none">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tổng chi</p>
                                    <p className="text-lg font-black text-expense">-{formatCurrency(totalExpense)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm overflow-y-auto max-h-[400px]">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Chi tiết Danh mục</h3>
                        <div className="space-y-4">
                            {expenseData.map((item, index) => {
                                const percent = ((item.value / totalExpense) * 100).toFixed(1);
                                return (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-gray-400">{percent}%</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(item.value)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}