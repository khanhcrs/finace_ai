// File: src/components/DashboardChart.jsx (Hoặc tương tự)
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTransaction } from '../contexts/TransactionContext'; // <-- Gọi kho data
import { useSettings } from '../contexts/SettingsContext'; // <-- Lấy Dark Mode

export default function DashboardChart() {
    const { transactions } = useTransaction();
    const { darkMode } = useSettings();

    // --- THUẬT TOÁN TẠO DỮ LIỆU 7 NGÀY GẦN NHẤT ---
    const chartData = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Chuyển ngày thành chuỗi YYYY-MM-DD để so sánh với Database
        const dateString = d.toISOString().split('T')[0];

        // Lọc tất cả giao dịch diễn ra trong cái ngày 'dateString' này
        const dayTransactions = transactions.filter(tx => tx.date === dateString);

        // Cộng tổng Thu / Chi của ngày đó
        const income = dayTransactions.filter(tx => tx.isIncome).reduce((sum, tx) => sum + tx.amount, 0);
        const expense = dayTransactions.filter(tx => !tx.isIncome).reduce((sum, tx) => sum + tx.amount, 0);

        // Lấy tên ngày (Nếu là hôm nay thì ghi 'Hôm nay', còn lại ghi T2, T3...)
        const name = i === 0 ? 'Hôm nay' : dayNames[d.getDay()];

        chartData.push({
            name: name,
            "Tiền thu": income,
            "Tiền chi": expense
        });
    }

    // Hàm format tiền tệ cho Tooltip
    const formatVND = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Thống kê 7 ngày qua</h3>

            {/* Thêm div bọc ngoài có fix cứng chiều cao để sửa cái lỗi vàng khè trong F12 của Recharts */}
            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={12}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f3f4f6'} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />

                        <Tooltip
                            formatter={(value) => formatVND(value)}
                            cursor={{ fill: darkMode ? '#1f2937' : '#f9fafb' }}
                            contentStyle={{
                                backgroundColor: darkMode ? '#111827' : '#fff',
                                borderColor: darkMode ? '#374151' : '#f3f4f6',
                                borderRadius: '12px',
                                color: darkMode ? '#fff' : '#000'
                            }}
                        />

                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Tiền chi" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Tiền thu" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}