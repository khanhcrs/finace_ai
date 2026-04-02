import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, ShoppingBag, Coffee, Car } from 'lucide-react';
import { useTransaction } from '../contexts/TransactionContext';

export default function ChatbotPanel() {
    const { addTransaction } = useTransaction();

    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: 'Chào Khánh! Gõ nhanh giao dịch vào đây để mình ghi chép giúp bạn nhé (VD: Ăn sáng 45k).' }
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

        setTimeout(() => {
            let aiReply = "Mình chưa hiểu rõ ý bạn lắm. Bạn có thể nói rõ số tiền (VD: 50k) và mục đích chi tiêu không?";
            const lowerText = newUserMsg.text.toLowerCase();
            const amountMatch = lowerText.match(/(\d+)\s*(k|ngàn|nghìn)?/);

            if (amountMatch) {
                let amount = parseInt(amountMatch[1]);
                if (amountMatch[2] || amount < 1000) {
                    amount = amount * 1000;
                }

                let title = "Chi tiêu khác";
                let icon = ShoppingBag;
                const textWithoutAccent = lowerText.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                if (/(xang|xe|grab|taxi|do xang)/i.test(textWithoutAccent)) {
                    title = "Di chuyển";
                    icon = Car;
                } else if (/(an|pho|com|cafe|nuoc|uong)/i.test(textWithoutAccent)) {
                    title = "Ăn uống";
                    icon = Coffee;
                }

                const newTx = {
                    id: Date.now(), title: title + " (Ghi qua AI)", date: "Vừa xong", amount: amount, isIncome: false, icon: icon,
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
        // Đã thêm dark:bg-gray-900, dark:border-gray-800
        <aside className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col hidden lg:flex shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 transition-colors duration-300">

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

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/30 dark:bg-gray-900/50 transition-colors">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 text-sm leading-relaxed transition-colors ${msg.sender === 'user'
                                ? 'bg-black dark:bg-white text-white dark:text-black rounded-2xl rounded-tr-sm'
                                : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm shadow-sm'
                            }`}>
                            <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></span>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-2xl rounded-tl-sm flex space-x-1.5 items-center shadow-sm transition-colors">
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Nhập: Đổ xăng 50k..."
                        className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-xl py-3 pl-4 pr-12 text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}