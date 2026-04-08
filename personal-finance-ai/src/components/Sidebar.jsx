// File: src/components/Sidebar/Sidebar.jsx
import { Home, PieChart, List, Settings, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar() {
    const navigate = useNavigate();

    const navLinkClass = ({ isActive }) => {
        return `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive
            ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm' // Active: Nền đen chữ trắng (Light) -> Nền trắng chữ đen (Dark)
            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white' // Inactive
            }`;
    };

    const handleLogout = () => {
        localStorage.removeItem('finance_user_id');
        localStorage.removeItem('finance_user_name');
        navigate('/login');
    };

    return (
        // Đã thêm dark:bg-gray-900 và dark:border-gray-800
        <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col hidden md:flex transition-colors duration-300">
            <div className="p-6">
                <h2 className="text-2xl font-black tracking-tight text-black dark:text-white transition-colors duration-300">
                    Finance<span className="text-black/50 dark:text-white/50">AI</span>
                </h2>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                <NavLink to="/" className={navLinkClass} end>
                    <Home size={20} />
                    <span>Tổng quan</span>
                </NavLink>
                <NavLink to="/transactions" className={navLinkClass}>
                    <List size={20} />
                    <span>Giao dịch</span>
                </NavLink>
                <NavLink to="/stats" className={navLinkClass}>
                    <PieChart size={20} />
                    <span>Thống kê</span>
                </NavLink>
            </nav>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300 space-y-1">
                <NavLink to="/settings" className={navLinkClass}>
                    <Settings size={20} />
                    <span>Cài đặt</span>
                </NavLink>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 rounded-xl font-medium transition-colors text-left"
                >
                    <LogOut size={20} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}