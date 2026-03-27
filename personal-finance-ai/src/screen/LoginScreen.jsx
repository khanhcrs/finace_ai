// File: src/screens/LoginScreen/LoginScreen.jsx
import { useNavigate } from 'react-router-dom';

export default function LoginScreen() {
    const navigate = useNavigate();

    // Hàm xử lý khi người dùng bấm nút Đăng nhập
    const handleLogin = (e) => {
        e.preventDefault(); // Ngăn form tự động reload trang
        // Tạm thời giả lập đăng nhập thành công là cho vào luôn Trang chủ
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">

            {/* Khung Form Đăng nhập */}
            <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl p-8 sm:p-10 border border-gray-100 animate-in fade-in zoom-in duration-500">

                {/* Logo & Tiêu đề */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black text-white font-bold text-3xl mb-4 shadow-lg">
                        F
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Finance<span className="text-black/50">AI</span></h2>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Đăng nhập để quản lý tài chính thông minh</p>
                </div>

                {/* Form nhập liệu */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email của bạn</label>
                        <input
                            type="email"
                            required
                            placeholder="khanhtran@example.com"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700">Mật khẩu</label>
                            <a href="#" className="text-sm font-bold text-gray-400 hover:text-black transition-colors">Quên mật khẩu?</a>
                        </div>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-black text-white font-bold text-[15px] py-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-md mt-2"
                    >
                        Đăng nhập vào hệ thống
                    </button>
                </form>

                {/* Nút Đăng ký */}
                <p className="text-center text-sm text-gray-500 font-medium mt-8">
                    Chưa có tài khoản? <a href="#" className="text-black font-bold hover:underline">Đăng ký ngay</a>
                </p>
            </div>

        </div>
    );
}