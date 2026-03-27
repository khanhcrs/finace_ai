// File: src/components/AddTransactionModal.jsx
import { useState } from 'react';
import { X, Wallet, ShoppingBag } from 'lucide-react';
import { useTransaction } from '../contexts/TransactionContext'; // <-- Import Hook

export default function AddTransactionModal({ isOpen, onClose }) {
    const { addTransaction } = useTransaction(); // Lấy hàm thêm từ kho ra

    // Các State quản lý nội dung Form
    const [isIncome, setIsIncome] = useState(false); // Mặc định là chi tiền
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');

    if (!isOpen) return null;

    // Hàm chạy khi bấm nút Lưu
    const handleSubmit = () => {
        if (!amount || !title) {
            alert("Bạn chưa nhập đủ thông tin kìa!");
            return;
        }

        const newTx = {
            id: Date.now(), // Tạo ID ngẫu nhiên bằng thời gian
            title: title,
            date: "Vừa xong",
            amount: parseFloat(amount), // Chuyển chữ thành số
            isIncome: isIncome,
            icon: isIncome ? Wallet : ShoppingBag, // Tự chọn Icon
        };

        addTransaction(newTx); // Đẩy vào kho

        // Dọn dẹp form và đóng Popup
        setAmount('');
        setTitle('');
        setIsIncome(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Thêm giao dịch mới</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Nút chọn Thu / Chi */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setIsIncome(false)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isIncome ? 'bg-white shadow-sm text-expense' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Khoản chi
                        </button>
                        <button
                            onClick={() => setIsIncome(true)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isIncome ? 'bg-white shadow-sm text-income' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Khoản thu
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1.5">Số tiền</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)} // Bắt sự kiện gõ phím
                                placeholder="0"
                                className="w-full text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">VNĐ</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1.5">Tên giao dịch</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)} // Bắt sự kiện gõ phím
                            placeholder="VD: Ăn trưa, Đổ xăng..."
                            className="w-full text-gray-900 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        />
                    </div>

                    <button
                        onClick={handleSubmit} // Gắn hàm lưu vào nút
                        className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all mt-4"
                    >
                        Lưu giao dịch
                    </button>
                </div>
            </div>
        </div>
    );
}