import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, ShoppingBag, Coffee, Car } from 'lucide-react';
import { useTransaction } from '../contexts/TransactionContext'; // 1. Móc cái kho dữ liệu ra

export default function ChatbotPanel() {
    const { addTransaction } = useTransaction(); // 2. Lấy hàm addTransaction để AI có quyền thêm dữ liệu

    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: 'Chào KT! Gõ nhanh giao dịch vào đây để mình ghi chép giúp bạn nhé (VD: Ăn sáng 45k).' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const newUserMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages((prev) => [...prev, newUserMsg]);
        setInput('');
        setIsTyping(true);

        // 3. Giả lập Backend xử lý trong 1.5 giây
        setTimeout(() => {
            let aiReply = "Mình chưa hiểu rõ ý bạn lắm. Bạn có thể nói rõ số tiền (VD: 50k) và mục đích chi tiêu không?";
            const lowerText = newUserMsg.text.toLowerCase();

            // --- MOCK NLP BÓC TÁCH DỮ LIỆU CẢI TIẾN ---
            // Dùng Regex tìm số tiền (hỗ trợ chữ 'k', vd: 50k)
            const amountMatch = lowerText.match(/(\d+)\s*(k|ngàn|nghìn)?/);

            if (amountMatch) {
                let amount = parseInt(amountMatch[1]);
                if (amountMatch[2] || amount < 1000) {
                    amount = amount * 1000;
                }

                let title = "Chi tiêu khác";
                let icon = ShoppingBag;

                // Chuyển chuỗi về không dấu để check cho dễ (vd: "đổ xăng" -> "do xang")
                const textWithoutAccent = lowerText.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                // KIỂM TRA NHÓM DI CHUYỂN TRƯỚC (Để tránh vụ chữ "xăng" chứa chữ "ăn")
                if (/(xang|xe|grab|taxi|do xang)/i.test(textWithoutAccent)) {
                    title = "Di chuyển";
                    icon = Car;
                }
                // Sau đó mới kiểm tra nhóm Ăn uống
                else if (/(an|pho|com|cafe|nuoc|uong)/i.test(textWithoutAccent)) {
                    title = "Ăn uống";
                    icon = Coffee;
                }

                const newTx = {
                    id: Date.now(),
                    title: title + " (Ghi qua AI)",
                    date: "Vừa xong",
                    amount: amount,
                    isIncome: false,
                    icon: icon,
                };

                addTransaction(newTx);

                const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);
                aiReply = `Đã ghi nhận khoản chi **${title}** với số tiền **${formattedAmount} đ**. Số dư đã được cập nhật!`;
            }
            else if (lowerText.includes("thống kê")) {
                aiReply = "Bạn hãy chuyển sang tab Thống Kê ở menu bên trái để xem biểu đồ chi tiết nhé!";
            }
            setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiReply }]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col hidden lg:flex shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10">
            <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-gray-50/50">
                <div className="bg-black p-2 rounded-lg text-white">
                    <MessageSquare size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Trợ lý Tài chính AI</h3>
                    <p className="text-xs text-green-600 font-medium flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                        Đang hoạt động
                    </p>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/30">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 text-sm leading-relaxed ${msg.sender === 'user'
                            ? 'bg-black text-white rounded-2xl rounded-tr-sm'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm'
                            }`}>
                            {/* Render chữ in đậm cho số tiền/tên */}
                            <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></span>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-sm flex space-x-1.5 items-center shadow-sm">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Nhập: Đổ xăng 50k..."
                        className="w-full bg-gray-100 border-transparent rounded-xl py-3 pl-4 pr-12 text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}