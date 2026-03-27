// File: src/components/DashboardChart/DashboardChart.jsx
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Dữ liệu giả lập thống kê 7 ngày qua
const data = [
    { name: 'T2', thu: 1200000, chi: 450000 },
    { name: 'T3', thu: 0, chi: 150000 },
    { name: 'T4', thu: 5000000, chi: 1200000 },
    { name: 'T5', thu: 0, chi: 300000 },
    { name: 'T6', thu: 0, chi: 50000 },
    { name: 'T7', thu: 1500000, chi: 800000 },
    { name: 'CN', thu: 0, chi: 200000 },
];

export default function DashboardChart() {
    return (
        // Box chứa biểu đồ, dùng style giống các card khác để đồng bộ
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-80 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê 7 ngày qua</h3>

            {/* Khung vẽ biểu đồ - tự động co giãn theo màn hình */}
            <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                        {/* Lưới kẻ ngang mờ mờ */}
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />

                        {/* Trục X (Ngày) và Trục Y (Tiền) - Chỉnh font chữ màu xám cho sang */}
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />

                        {/* Cục Tooltip hiện ra khi rê chuột vào cột */}
                        <Tooltip
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />

                        <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />

                        {/* Vẽ 2 cột Thu (Xanh lá) và Chi (Đỏ) - Bo tròn góc trên (radius) */}
                        <Bar dataKey="thu" name="Tiền thu" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={14} />
                        <Bar dataKey="chi" name="Tiền chi" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={14} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}