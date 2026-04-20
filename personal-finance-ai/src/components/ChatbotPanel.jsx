import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useTransaction } from '../contexts/TransactionContext';
import { toast } from 'react-hot-toast';

export default function ChatbotPanel() {
    const { fetchData } = useTransaction();
    const userName = localStorage.getItem('finance_user_name') || 'bạn';

    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: `Chào ${userName}! Mình là Trợ lý AI. Bạn muốn ghi chép hay tâm sự gì với mình hôm nay?` }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [pendingTransaction, setPendingTransaction] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping, isUploading]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const textToProcess = input.trim();
        const lowerInput = textToProcess.toLowerCase();
        const savedUserId = localStorage.getItem('finance_user_id') || 1;

        setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'user', text: textToProcess }]);
        setInput('');
        setIsTyping(true);

        try {
            // 1. XỬ LÝ XÁC NHẬN LƯU GIAO DỊCH BẤT THƯỜNG
            if (pendingTransaction && (
                lowerInput.includes('rồi') || 
                lowerInput.includes('ok') || 
                lowerInput.includes('lưu') || 
                lowerInput.includes('đúng') ||
                lowerInput.includes('có')
            )) {
                const confirmRes = await axios.post(`http://localhost:8080/api/ai/save-confirmed?userId=${savedUserId}`, pendingTransaction);
                setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'ai', text: confirmRes.data.reply }]);
                setPendingTransaction(null);
                if (fetchData) fetchData(true);
                toast.success("Đã lưu giao dịch!");
                return;
            }

            // 2. THỬ XỬ LÝ NHƯ MỘT GIAO DỊCH MỚI
            try {
                const response = await axios.get(`http://localhost:8080/api/ai/process`, {
                    params: { text: textToProcess, userId: savedUserId }
                });

                const { reply, transaction, mustConfirm, saved } = response.data;

                if (saved) {
                    if (fetchData) fetchData(true);
                }

                if (mustConfirm) {
                    setPendingTransaction(transaction);
                } else {
                    setPendingTransaction(null);
                }

                setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'ai', text: reply }]);
                
                if (transaction && !mustConfirm && fetchData) {
                    fetchData(true);
                    toast.success("Đã ghi chép!");
                } else if (saved) {
                    toast.success("Đã ghi chép!");
                }
            } catch (err) {
                // 3. NẾU KHÔNG PHẢI GIAO DỊCH (LỖI 400), CHUYỂN SANG HỎI ĐÁP/TÂM SỰ
                if (err.response && err.response.status === 400) {
                    const askRes = await axios.get(`http://localhost:8080/api/ai/ask`, {
                        params: { text: textToProcess, userId: savedUserId }
                    });
                    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'ai', text: askRes.data.reply }]);
                    setPendingTransaction(null);
                } else {
                    throw err;
                }
            }

        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.reply || "❌ Máy chủ AI đang bận hoặc có lỗi kết nối.";
            setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'ai', text: errorMsg }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Giới hạn kích thước file (ví dụ: 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
            return;
        }

        setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'user', text: "📷 [Đã gửi một ảnh hóa đơn]" }]);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        const savedUserId = localStorage.getItem('finance_user_id') || 1;
        formData.append('userId', savedUserId);

        try {
            const response = await axios.post(`http://localhost:8080/api/ai/process-receipt`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const transaction = response.data;
            if (transaction) {
                const amountFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount);
                setMessages((prev) => [...prev, { 
                    id: Date.now() + Math.random(), 
                    sender: 'ai', 
                    text: `✅ Mình đã đọc xong hóa đơn!\n\n**Nội dung:** ${transaction.note}\n**Số tiền:** ${amountFormatted}\n**Danh mục:** ${transaction.category?.name || 'Khác'}\n\nĐã lưu vào lịch sử giao dịch của bạn.` 
                }]);
                
                if (fetchData) fetchData(true);
                toast.success("Phân tích hóa đơn thành công!");
            }
        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'ai', text: "❌ Xin lỗi, mình không thể đọc được hóa đơn này. Bạn hãy thử chụp rõ hơn nhé!" }]);
            toast.error("Lỗi khi xử lý hóa đơn.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <aside className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col hidden lg:flex shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 transition-colors duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center space-x-3 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                <div className="bg-black dark:bg-white p-2 rounded-lg text-white dark:text-black transition-colors">
                    <MessageSquare size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">Trợ lý Tài chính AI</h3>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                        Đang hoạt động
                    </p>
                </div>
            </div>

            {/* Vùng Chat */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/30 dark:bg-gray-900/50 transition-colors">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 text-sm leading-relaxed transition-colors whitespace-pre-wrap ${msg.sender === 'user'
                            ? 'bg-black dark:bg-white text-white dark:text-black rounded-2xl rounded-tr-sm'
                            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm shadow-sm'
                            }`}>
                            <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></span>
                        </div>
                    </div>
                ))}
                {(isTyping || isUploading) && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm text-gray-400 text-xs flex items-center">
                            <Loader2 size={14} className="animate-spin mr-2" />
                            {isUploading ? "AI đang phân tích ảnh..." : "AI đang nghĩ..."}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors">
                <div className="flex items-center space-x-2">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isTyping || isUploading}
                        className="p-2.5 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all disabled:opacity-50"
                        title="Tải lên hóa đơn"
                    >
                        <ImageIcon size={20} />
                    </button>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Nhập nội dung..."
                            className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl py-3 pl-4 pr-10 text-sm text-gray-900 dark:text-white outline-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping || isUploading}
                            className="absolute right-2 top-1.5 p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg disabled:opacity-50"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}