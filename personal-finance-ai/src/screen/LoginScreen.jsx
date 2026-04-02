// File: src/screen/LoginScreen.jsx (Hoặc LoginScreen/LoginScreen.jsx tùy cấu trúc của bạn)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginScreen() {
    const navigate = useNavigate();

    // STATE CỐT LÕI: Biến này quyết định đang hiện form Đăng nhập (true) hay Đăng ký (false)
    const [isLogin, setIsLogin] = useState(true);

    // Các state lưu dữ liệu nhập vào
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Hàm xử lý chung cho cả Đăng nhập & Đăng ký
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Xóa lỗi cũ trước khi gửi request mới

        if (isLogin) {
            // ---------------- LUỒNG ĐĂNG NHẬP ----------------
            try {
                const response = await axios.post('http://localhost:8080/api/users/login', {
                    email: email,
                    password: password
                });

                const userData = response.data;
                localStorage.setItem('finance_user_id', userData.id);
                localStorage.setItem('finance_user_name', userData.fullName);
                window.location.href = '/';

            } catch (err) {
                setError("Sai email hoặc mật khẩu. Vui lòng thử lại!");
            }
        } else {
            // ---------------- LUỒNG ĐĂNG KÝ ----------------
            try {
                await axios.post('http://localhost:8080/api/users/register', {
                    fullName: fullName,
                    email: email,
                    passwordHash: password
                });

                alert("Đăng ký thành công! Hãy đăng nhập để tiếp tục.");
                // Chuyển form về lại trạng thái Đăng nhập, giữ nguyên email, chỉ xóa mật khẩu
                setIsLogin(true);
                setPassword('');

            } catch (err) {
                setError(err.response?.data || "Có lỗi xảy ra khi đăng ký!");
            }
        }
    };

    // Hàm tiện ích để chuyển đổi giữa 2 chế độ
    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(''); // Chuyển form thì xóa thông báo lỗi đi cho sạch
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 transition-colors duration-500">
            <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl p-8 sm:p-10 border border-gray-100 animate-in fade-in zoom-in duration-300">

                {/* Logo & Tiêu đề linh hoạt */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black text-white font-bold text-3xl mb-4 shadow-lg transition-transform hover:scale-105">F</div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {isLogin ? (
                            <>Finance<span className="text-black/50">AI</span></>
                        ) : (
                            "Tạo tài khoản"
                        )}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 font-medium">
                        {isLogin ? "Đăng nhập để quản lý tài chính thông minh" : "Bắt đầu hành trình quản lý tài chính của bạn"}
                    </p>
                </div>

                {/* Thông báo lỗi */}
                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl text-center animate-in fade-in slide-in-from-top-2">{error}</div>}

                {/* Form chung */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Ô Họ tên: CHỈ HIỆN KHI Ở CHẾ ĐỘ ĐĂNG KÝ */}
                    {!isLogin && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên</label>
                            <input
                                type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                                placeholder="VD: Khánh Trần"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-sm focus:bg-white focus:border-black outline-none transition-all"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email của bạn</label>
                        <input
                            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="khanhtran@example.com"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-sm focus:bg-white focus:border-black outline-none transition-all"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700">Mật khẩu</label>
                            {isLogin && <a href="#" className="text-sm font-bold text-gray-400 hover:text-black transition-colors">Quên mật khẩu?</a>}
                        </div>
                        <input
                            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-sm focus:bg-white focus:border-black outline-none transition-all"
                        />
                    </div>

                    <button type="submit" className="w-full bg-black text-white font-bold text-[15px] py-4 rounded-xl hover:bg-gray-800 transition-all shadow-md mt-2">
                        {isLogin ? "Đăng nhập vào hệ thống" : "Tạo tài khoản ngay"}
                    </button>
                </form>

                {/* Nút lật mặt form */}
                <p className="text-center text-sm text-gray-500 font-medium mt-8">
                    {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                    <button onClick={toggleMode} className="text-black font-bold hover:underline cursor-pointer">
                        {isLogin ? "Đăng ký ngay" : "Đăng nhập luôn"}
                    </button>
                </p>
            </div>
        </div>
    );
}