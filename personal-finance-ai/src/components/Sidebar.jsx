import { Home, PieChart, List, Settings, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar() {
    const navigate = useNavigate(); // Khởi tạo "cỗ xe" chuyển trang

    const navLinkClass = ({ isActive }) => {
        return `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`;
    };

    // 3. Hàm xử lý khi bấm nút Đăng xuất
    const handleLogout = () => {
        // Chỗ này sau này ráp Back-end vào thì bạn viết code xóa Token, xóa Cookie...
        // Tạm thời Front-end chỉ cần điều hướng thẳng ra màn hình Login
        navigate('/login');
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
            <div className="p-6">
                <h2 className="text-2xl font-black tracking-tight">Finance<span className="text-black/50">AI</span></h2>
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

            {/* Khu vực cuối Sidebar */}
            <div className="p-4 border-t border-gray-100 space-y-1">
                <NavLink to="/settings" className={navLinkClass}>
                    <Settings size={20} />
                    <span>Cài đặt</span>
                </NavLink>

                {/* Nút Đăng xuất màu đỏ nổi bật */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-colors text-left"
                >
                    <LogOut size={20} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}