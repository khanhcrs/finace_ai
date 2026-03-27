import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../utils/format';

// Dữ liệu giả lập phân bổ chi tiêu (Sau này sẽ viết hàm tính toán từ dữ liệu thật)
const expenseData = [
    { name: 'Ăn uống', value: 1500000 },
    { name: 'Tiền trọ', value: 2500000 },
    { name: 'Di chuyển', value: 400000 },
    { name: 'Mua sắm', value: 800000 },
    { name: 'Giải trí', value: 500000 },
];

// Bảng màu cho các phần của biểu đồ tròn
const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export default function StatsScreen() {
    const totalExpense = expenseData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="max-w-5xl mx-auto p-5 md:p-8 animate-in fade-in duration-300">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
                <p className="text-gray-500 mt-1">Phân tích dòng tiền của bạn trong tháng này</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* CỘT TRÁI: Biểu đồ Tròn */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col h-[400px]">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Cơ cấu Chi tiêu</h3>
                    <div className="flex-1 w-full h-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expenseData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80} // Tạo lỗ ở giữa thành Donut Chart
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {expenseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Chữ Tổng chi nằm ngay giữa lỗ tròn */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[20px] text-center pointer-events-none">
                            <p className="text-xs text-gray-500 font-medium">Tổng chi</p>
                            <p className="text-lg font-black text-expense">-{formatCurrency(totalExpense)}</p>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: Danh sách diễn giải */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Chi tiết Danh mục</h3>
                    <div className="space-y-4">
                        {expenseData.map((item, index) => {
                            // Tính phần trăm
                            const percent = ((item.value / totalExpense) * 100).toFixed(1);

                            return (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {/* Chấm màu */}
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-400">{percent}%</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-sm text-gray-900">{formatCurrency(item.value)}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}