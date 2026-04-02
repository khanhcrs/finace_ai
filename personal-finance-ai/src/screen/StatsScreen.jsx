// File: src/screens/StatsScreen/StatsScreen.jsx (hoặc đường dẫn tương ứng của bạn)
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/format';
import { useSettings } from '../contexts/SettingsContext';
import { useTransaction } from '../contexts/TransactionContext'; // <-- Kéo dữ liệu thật vào đây

// Bảng từ điển dịch từ Icon sang tên Danh mục hiển thị
const CATEGORY_NAMES = {
    'Coffee': 'Ăn uống',
    'Car': 'Di chuyển',
    'ShoppingBag': 'Mua sắm',
    'DollarSign': 'Thu nhập'
};

// Bảng màu cho biểu đồ (thêm vài màu phòng hờ nhiều danh mục)
const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4'];

export default function StatsScreen() {
    const { chartType, darkMode } = useSettings();
    const { transactions } = useTransaction(); // Móc toàn bộ giao dịch từ DB lên

    // --- THUẬT TOÁN XỬ LÝ DỮ LIỆU THỐNG KÊ ---

    // 1. Chỉ lấy các khoản CHI (Expense) để vẽ biểu đồ Cơ cấu chi tiêu
    const expenseTransactions = transactions.filter(tx => !tx.isIncome);

    // 2. Gom nhóm và cộng dồn tiền theo Danh mục (VD: 2 ly cafe thì gộp chung lại)
    const groupedData = expenseTransactions.reduce((acc, tx) => {
        const catName = tx.categoryName || 'Khác'; // Móc thẳng tên DB ra xài

        if (!acc[catName]) acc[catName] = 0;
        acc[catName] += tx.amount;
        return acc;
    }, {});

    // 3. Biến đổi Object thành Mảng (Array) để thằng Recharts nó hiểu được
    const expenseData = Object.keys(groupedData).map(name => ({
        name,
        value: groupedData[name]
    })).sort((a, b) => b.value - a.value); // Sắp xếp thằng nào chi nhiều nhất lên đầu

    // 4. Tính tổng tiền chi
    const totalExpense = expenseData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="max-w-5xl mx-auto p-5 md:p-8 animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">Báo cáo & Thống kê</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">Phân tích dòng tiền của bạn trong tháng này</p>
            </div>

            {expenseData.length === 0 ? (
                // Nếu người dùng chưa có giao dịch chi tiêu nào
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-10 text-center shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Chưa có dữ liệu chi tiêu để thống kê.</p>
                    <p className="text-sm text-gray-400 mt-2">Hãy thêm một vài giao dịch khoản chi để xem biểu đồ nhé!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* BỘ BIỂU ĐỒ */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col h-[400px] transition-colors duration-300">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cơ cấu Chi tiêu</h3>
                        <div className="flex-1 w-full h-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'pie' ? (
                                    <PieChart>
                                        <Pie data={expenseData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" stroke="none">
                                            {expenseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000', borderColor: darkMode ? '#374151' : '#f3f4f6', borderRadius: '12px' }} />
                                        <Legend iconType="circle" verticalAlign="bottom" />
                                    </PieChart>
                                ) : (
                                    <BarChart data={expenseData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f3f4f6'} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <YAxis hide />
                                        <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: darkMode ? '#1f2937' : '#f9fafb' }} contentStyle={{ backgroundColor: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000', borderColor: darkMode ? '#374151' : '#f3f4f6', borderRadius: '12px' }} />
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

                    {/* DANH SÁCH CHI TIẾT */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Chi tiết Danh mục</h3>
                        <div className="space-y-4">
                            {expenseData.map((item, index) => {
                                const percent = ((item.value / totalExpense) * 100).toFixed(1);
                                return (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 dark:text-white transition-colors">{item.name}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{percent}%</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white transition-colors">{formatCurrency(item.value)}</p>
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