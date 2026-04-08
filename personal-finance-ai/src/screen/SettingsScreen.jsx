import { useState, useEffect } from 'react';
import { User, Palette, PieChart, Wallet, Save, Loader2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function SettingsScreen() {
    const { darkMode, setDarkMode, chartType, setChartType, reportRange, setReportRange } = useSettings();
    
    const [thresholds, setThresholds] = useState({
        thresholdEating: '500000',
        thresholdShopping: '5000000',
        thresholdTransport: '2000000',
        thresholdOthers: '1000000'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSubmitting] = useState(false);

    const userId = localStorage.getItem('finance_user_id') || 1;

    useEffect(() => {
        fetchThresholds();
    }, [userId]);

    const fetchThresholds = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(`http://localhost:8080/api/users/${userId}`);
            const userData = res.data;
            setThresholds({
                thresholdEating: userData.thresholdEating?.toString() || '500000',
                thresholdShopping: userData.thresholdShopping?.toString() || '5000000',
                thresholdTransport: userData.thresholdTransport?.toString() || '2000000',
                thresholdOthers: userData.thresholdOthers?.toString() || '1000000',
            });
        } catch (e) {
            console.error("Lỗi khi tải hạn mức:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveThresholds = async () => {
        try {
            setIsSubmitting(true);
            await axios.put(`http://localhost:8080/api/users/${userId}/thresholds`, {
                thresholdEating: parseFloat(thresholds.thresholdEating),
                thresholdShopping: parseFloat(thresholds.thresholdShopping),
                thresholdTransport: parseFloat(thresholds.thresholdTransport),
                thresholdOthers: parseFloat(thresholds.thresholdOthers)
            });
            toast.success("Đã cập nhật hạn mức chi tiêu!");
        } catch (e) {
            toast.error("Không thể lưu cài đặt.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-5 md:p-8 animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Cài đặt hệ thống</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">Quản lý tài khoản và tuỳ chỉnh trải nghiệm của bạn</p>
            </div>

            <div className="space-y-6">

                {/* 1. THÔNG TIN TÀI KHOẢN */}
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

                {/* 2. CÀI ĐẶT HẠN MỨC CHI TIÊU (MỚI) */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                    <div className="flex items-center space-x-3 mb-6">
                        <Wallet className="text-gray-400 dark:text-gray-500" size={24} />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hạn mức Chi tiêu Bất thường (VNĐ)</h3>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-gray-400" size={32} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Ăn uống</label>
                                    <input 
                                        type="number" 
                                        value={thresholds.thresholdEating}
                                        onChange={(e) => setThresholds({...thresholds, thresholdEating: e.target.value})}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl py-2.5 px-4 text-sm font-bold focus:border-black dark:focus:border-white outline-none transition-all" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Mua sắm</label>
                                    <input 
                                        type="number" 
                                        value={thresholds.thresholdShopping}
                                        onChange={(e) => setThresholds({...thresholds, thresholdShopping: e.target.value})}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl py-2.5 px-4 text-sm font-bold focus:border-black dark:focus:border-white outline-none transition-all" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Di chuyển</label>
                                    <input 
                                        type="number" 
                                        value={thresholds.thresholdTransport}
                                        onChange={(e) => setThresholds({...thresholds, thresholdTransport: e.target.value})}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl py-2.5 px-4 text-sm font-bold focus:border-black dark:focus:border-white outline-none transition-all" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Danh mục khác</label>
                                    <input 
                                        type="number" 
                                        value={thresholds.thresholdOthers}
                                        onChange={(e) => setThresholds({...thresholds, thresholdOthers: e.target.value})}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl py-2.5 px-4 text-sm font-bold focus:border-black dark:focus:border-white outline-none transition-all" 
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 pt-2">
                                <button
                                    onClick={handleSaveThresholds}
                                    disabled={isSaving}
                                    className="w-full md:w-auto flex items-center justify-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold hover:opacity-80 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    <span>Lưu cài đặt hạn mức</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. TUỲ CHỈNH GIAO DIỆN */}
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

                {/* 4. TUỲ CHỈNH BÁO CÁO */}
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