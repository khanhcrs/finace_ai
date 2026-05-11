import { useState, useEffect } from 'react';
import { User, Palette, PieChart, Wallet, Save, Loader2, Plus, Edit2, Check, X, Trash2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTransaction } from '../contexts/TransactionContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function SettingsScreen() {
    const { darkMode, setDarkMode, chartType, setChartType, reportRange, setReportRange } = useSettings();
    const { categories, fetchData } = useTransaction();
    
    const [isLoading, setIsLoading] = useState(false);

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', type: 'EXPENSE', icon: 'HelpCircle', limitAmount: '' });
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editCategoryData, setEditCategoryData] = useState({ name: '', limitAmount: '', icon: '' });

    const AVAILABLE_ICONS = [
        'Coffee', 'Utensils', 'Car', 'Bus', 'ShoppingBag', 'DollarSign', 
        'Home', 'Tv', 'Film', 'Zap', 'Heart', 'Briefcase', 'BookOpen', 
        'GraduationCap', 'HelpCircle', 'Plane', 'Gift', 'Stethoscope', 'PawPrint'
    ];

    const userId = localStorage.getItem('finance_user_id') || 1;

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            toast.error("Vui lòng nhập tên danh mục");
            return;
        }
        try {
            await axios.post(`http://localhost:8080/api/categories`, {
                ...newCategory,
                limitAmount: newCategory.limitAmount ? parseFloat(newCategory.limitAmount) : null,
                user: { id: userId }
            });
            toast.success("Đã thêm danh mục mới!");
            setIsAddingCategory(false);
            setNewCategory({ name: '', type: 'EXPENSE', icon: 'HelpCircle', limitAmount: '' });
            fetchData();
        } catch (e) {
            toast.error("Lỗi khi thêm danh mục");
        }
    };

    const handleUpdateCategory = async (cat) => {
        try {
            await axios.post(`http://localhost:8080/api/categories`, {
                ...cat,
                name: editCategoryData.name,
                icon: editCategoryData.icon,
                limitAmount: editCategoryData.limitAmount ? parseFloat(editCategoryData.limitAmount) : null,
                user: { id: userId }
            });
            toast.success("Đã cập nhật danh mục!");
            setEditingCategoryId(null);
            fetchData();
        } catch (e) {
            toast.error("Lỗi khi cập nhật danh mục");
        }
    };

    const startEditing = (cat) => {
        setEditingCategoryId(cat.id);
        setEditCategoryData({ 
            name: cat.name, 
            limitAmount: cat.limitAmount?.toString() || '',
            icon: cat.icon || 'HelpCircle'
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-5 md:p-8 animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Cài đặt hệ thống</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">Quản lý tài khoản và tuỳ chỉnh trải nghiệm của bạn</p>
            </div>

            <div className="space-y-6">

                
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                    <div className="flex items-center space-x-3 mb-6">
                        <User className="text-gray-400 dark:text-gray-500" size={24} />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hồ sơ cá nhân</h3>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-3xl font-bold shadow-md transition-colors duration-300">
                            {localStorage.getItem('finance_user_name')?.charAt(0) || 'K'}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Tên hiển thị</label>
                                <input type="text" defaultValue={localStorage.getItem('finance_user_name') || "Khánh Trần"} className="w-full max-w-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl py-2 px-4 text-sm font-medium focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Email</label>
                                <input type="email" defaultValue={localStorage.getItem('finance_user_email') || "user@example.com"} disabled className="w-full max-w-sm bg-gray-100 dark:bg-gray-800/50 border border-transparent rounded-xl py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-500 cursor-not-allowed transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <Wallet className="text-gray-400 dark:text-gray-500" size={24} />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quản lý Danh mục & Hạn mức</h3>
                        </div>
                        <button 
                            onClick={() => setIsAddingCategory(!isAddingCategory)}
                            className="flex items-center space-x-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {isAddingCategory ? <X size={16} /> : <Plus size={16} />}
                            <span>{isAddingCategory ? 'Hủy' : 'Thêm mới'}</span>
                        </button>
                    </div>

                    {isAddingCategory && (
                        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Tên danh mục</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ví dụ: Du lịch"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-lg py-2 px-3 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Loại</label>
                                    <select 
                                        value={newCategory.type}
                                        onChange={(e) => setNewCategory({...newCategory, type: e.target.value})}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-lg py-2 px-3 text-sm"
                                    >
                                        <option value="EXPENSE">Chi tiêu</option>
                                        <option value="INCOME">Thu nhập</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Biểu tượng</label>
                                    <select 
                                        value={newCategory.icon}
                                        onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-lg py-2 px-3 text-sm"
                                    >
                                        {AVAILABLE_ICONS.map(icon => (
                                            <option key={icon} value={icon}>{icon}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Hạn mức (VNĐ)</label>
                                    <input 
                                        type="number" 
                                        placeholder="Không giới hạn"
                                        value={newCategory.limitAmount}
                                        onChange={(e) => setNewCategory({...newCategory, limitAmount: e.target.value})}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-lg py-2 px-3 text-sm"
                                    />
                                </div>
                                <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                                    <button 
                                        onClick={handleAddCategory}
                                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2"
                                    >
                                        <Check size={16} />
                                        <span>Lưu danh mục</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase">Danh mục</th>
                                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase">Loại</th>
                                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase text-right">Hạn mức hàng tháng</th>
                                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {categories.map((cat) => (
                                    <tr key={cat.id} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                        <td className="py-4 font-medium text-gray-900 dark:text-gray-100">
                                            {editingCategoryId === cat.id ? (
                                                <div className="space-y-2">
                                                    <input 
                                                        type="text" 
                                                        value={editCategoryData.name}
                                                        onChange={(e) => setEditCategoryData({...editCategoryData, name: e.target.value})}
                                                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm w-32 block"
                                                    />
                                                    <select 
                                                        value={editCategoryData.icon}
                                                        onChange={(e) => setEditCategoryData({...editCategoryData, icon: e.target.value})}
                                                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm w-32 block"
                                                    >
                                                        {AVAILABLE_ICONS.map(icon => (
                                                            <option key={icon} value={icon}>{icon}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-400 text-xs w-20 truncate">[{cat.icon}]</span>
                                                    <span>{cat.name}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.type === 'INCOME' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {cat.type === 'INCOME' ? 'THU NHẬP' : 'CHI TIÊU'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right font-bold text-gray-700 dark:text-gray-300">
                                            {editingCategoryId === cat.id ? (
                                                <input 
                                                    type="number" 
                                                    value={editCategoryData.limitAmount}
                                                    onChange={(e) => setEditCategoryData({...editCategoryData, limitAmount: e.target.value})}
                                                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm w-32 text-right"
                                                />
                                            ) : (
                                                cat.limitAmount ? Number(cat.limitAmount).toLocaleString() + ' đ' : '∞'
                                            )}
                                        </td>
                                        <td className="py-4 text-right">
                                            {editingCategoryId === cat.id ? (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => handleUpdateCategory(cat)} className="text-green-600 p-1 hover:bg-green-50 rounded"><Check size={18} /></button>
                                                    <button onClick={() => setEditingCategoryId(null)} className="text-gray-400 p-1 hover:bg-gray-50 rounded"><X size={18} /></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEditing(cat)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                    <div className="flex items-center space-x-3 mb-6">
                        <Palette className="text-gray-400 dark:text-gray-500" size={24} />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tuỳ chỉnh Giao diện</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 transition-colors">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Chế độ tối (Dark Mode)</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Giảm chói mắt khi sử dụng vào ban đêm</p>
                            </div>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${darkMode ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                    <div className="flex items-center space-x-3 mb-6">
                        <PieChart className="text-gray-400 dark:text-gray-500" size={24} />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sở thích Báo cáo</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 transition-colors">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Kỳ báo cáo mặc định</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Thời gian hiển thị biểu đồ khi vừa mở app</p>
                            </div>
                            <select
                                value={reportRange}
                                onChange={(e) => setReportRange(e.target.value)}
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-lg py-2 px-3 text-sm font-medium outline-none transition-colors"
                            >
                                <option value="week">7 ngày qua</option>
                                <option value="month">Tháng này</option>
                                <option value="year">Năm nay</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Loại biểu đồ yêu thích</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cách thể hiện dữ liệu Thống kê</p>
                            </div>
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg transition-colors">
                                <button
                                    onClick={() => setChartType('bar')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${chartType === 'bar' ? 'bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    Cột
                                </button>
                                <button
                                    onClick={() => setChartType('pie')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${chartType === 'pie' ? 'bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    Tròn
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}