// File: src/components/Sidebar/Sidebar.jsx
import { Home, PieChart, List, Settings } from 'lucide-react';

export default function Sidebar() {
    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
            <div className="p-6">
                <h2 className="text-2xl font-black tracking-tight">Finance<span className="text-black/50">AI</span></h2>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-black text-white rounded-xl font-medium shadow-sm">
                    <Home size={20} />
                    <span>Tổng quan</span>
                </a>
                <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                    <List size={20} />
                    <span>Giao dịch</span>
                </a>
                <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                    <PieChart size={20} />
                    <span>Thống kê</span>
                </a>
            </nav>

            <div className="p-4 border-t border-gray-100">
                <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
                    <Settings size={20} />
                    <span>Cài đặt</span>
                </a>
            </div>
        </aside>
    );
}