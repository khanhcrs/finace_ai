import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import axios from 'axios';
import { useTransaction } from '../contexts/TransactionContext';

export default function ChatbotPanel() {
    const { fetchData } = useTransaction();
    const userName = localStorage.getItem('finance_user_name') || 'bạn';

    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: `Chào ${userName}! Mình là Trợ lý AI. Bạn muốn ghi chép hay tâm sự gì với mình hôm nay?` }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const textToProcess = input;
        setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'user', text: textToProcess }]);
        setInput('');
        setIsTyping(true);

        try {
            const savedUserId = localStorage.getItem('finance_user_id') || 1;

            const response = await axios.get(`http://localhost:8080/api/ai/process`, {
                params: {
                    text: textToProcess,
                    userId: savedUserId
                }
            });

            // Lấy kết quả từ Backend
            const { reply, transaction } = response.data;

            // In câu trả lời tự nhiên của AI
            if (reply) {
                setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'ai', text: reply }]);
            } else {
                setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'ai', text: "Đã xử lý xong yêu cầu của bạn!" }]);
            }

            // Cập nhật lại biểu đồ
            if (transaction && fetchData) {
                fetchData();
            }

        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.reply || "❌ Máy chủ AI đang bận hoặc có lỗi kết nối.";
            setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: 'ai', text: errorMsg }]);
        } finally {
            setIsTyping(false);
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
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm text-gray-400 text-xs">AI đang nghĩ...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Thử gõ: Mới đi cà phê hết 50k..."
                        className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl py-3 pl-4 pr-12 text-sm text-gray-900 dark:text-white outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-2 p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg disabled:opacity-50"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}