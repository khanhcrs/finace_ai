import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Check, X } from 'lucide-react';
import axios from 'axios';
import { useTransaction } from '../contexts/TransactionContext';

export default function ChatbotPanel() {
    const { fetchData } = useTransaction();
    const userName = localStorage.getItem('finance_user_name') || 'bạn';
    const savedUserId = localStorage.getItem('finance_user_id') || 1;

    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: `Chào ${userName}! Mình là Trợ lý AI (Gemini 2.5). Bạn ghi chép hoặc hỏi mình nhé!` }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [pendingTx, setPendingTx] = useState(null);

    const messagesEndRef = useRef(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || pendingTx) return;

        const textToProcess = input;
        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: textToProcess }]);
        setInput('');
        setIsTyping(true);

        try {
            const textLower = textToProcess.toLowerCase();
            
            // 🧠 Dạy AI nhận diện thêm nhiều từ khóa thông minh hơn
            const isAnalyzeMode = textLower.includes("phân tích") || textLower.includes("dự đoán");
            
            // Thêm các từ: liệt kê, chi tiết, những gì, tại sao...
            const isAskMode = textLower.includes("?") || 
                              textLower.includes("bao nhiêu") || 
                              textLower.includes("tổng") ||
                              textLower.includes("liệt kê") ||
                              textLower.includes("chi tiết") ||
                              textLower.includes("gì") ||
                              textLower.includes("nào");

            if (isAnalyzeMode) {
                const res = await axios.get(`http://localhost:8080/api/ai/analyze`, { params: { userId: savedUserId } });
                let aiReply = "";
                try {
                    let cleanData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
                    if (cleanData && cleanData.analysis) {
                        const adviceList = Array.isArray(cleanData.advice) ? cleanData.advice : [cleanData.advice];
                        aiReply = `**📊 Phân tích:**\n${cleanData.analysis}\n\n**🔮 Dự đoán:**\n${cleanData.prediction}\n\n**💡 Lời khuyên:**\n- ${adviceList.join('\n- ')}`;
                    } else {
                        aiReply = typeof res.data === 'string' ? res.data : "Đã phân tích xong nhưng dữ liệu bị thiếu.";
                    }
                } catch (e) { aiReply = typeof res.data === 'string' ? res.data : "Lỗi đọc dữ liệu phân tích."; }
                setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: aiReply }]);

          } else if (isAskMode) {
                // 🔥 CẤP TRÍ NHỚ NGẮN HẠN (Rất quan trọng)
                // Lấy 2 tin nhắn gần nhất (ví dụ: Bạn hỏi "tổng ăn uống" -> Bot đáp "116 triệu")
                const recentMsgs = messages.slice(-2);
                let contextStr = "";
                if (recentMsgs.length > 0) {
                    contextStr = "[Ngữ cảnh cuộc trò chuyện trước đó: " + 
                        recentMsgs.map(m => m.sender === 'user' ? `Khách: ${m.text}` : `Bot: ${m.text}`).join(" | ") + 
                        "]. Dựa vào ngữ cảnh này, hãy trả lời câu hỏi: ";
                }
                
                // Nối ngữ cảnh vào câu hỏi hiện tại của người dùng
                const finalQuestion = contextStr + textToProcess;

                // Gửi nguyên cục câu hỏi dài này lên API /ask
                const res = await axios.get(`http://localhost:8080/api/ai/ask`, { 
                    params: { text: finalQuestion, userId: savedUserId } 
                });
                
                setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: String(res.data.reply || "Mình đã tìm thấy dữ liệu.") }]);

            } else {
                const res = await axios.get(`http://localhost:8080/api/ai/process`, { 
                    params: { text: textToProcess, userId: savedUserId } 
                });
                const { reply, transaction, mustConfirm } = res.data;

                if (mustConfirm) {
                    setPendingTx(transaction);
                    setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: String(reply), isConfirmMsg: true }]);
                } else {
                    setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: String(reply) }]);
                    if (fetchData) fetchData();
                }
            }
        } catch (error) {
            // 🔥 FIX: Thay vì báo máy chủ bận chung chung, lấy luôn câu chửi của Backend lên (nếu có)
            const errorMsg = error.response?.data?.reply || "❌ Máy chủ đang bận hoặc hết hạn mức API, vui lòng thử lại sau!";
            setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: errorMsg }]);
        } finally {
            setIsTyping(false);
        }
    };

    const confirmAction = async (choice) => {
        if (choice === 'yes' && pendingTx) {
            setIsTyping(true);
            try {
                const res = await axios.post(`http://localhost:8080/api/ai/save-confirmed?userId=${savedUserId}`, pendingTx);
                setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: String(res.data.reply) }]);
                if (fetchData) fetchData();
            } catch (e) {
                setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: "❌ Lỗi khi lưu giao dịch." }]);
            }
        } else {
            setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: "Đã hủy bỏ giao dịch." }]);
        }
        setPendingTx(null);
        setIsTyping(false);
    };

    return (
        <aside className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 flex flex-col hidden lg:flex shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center space-x-3">
                <div className="bg-black p-2 rounded-lg text-white">
                    <MessageSquare size={18} />
                </div>
                <h3 className="font-bold text-sm">Trợ lý AI</h3>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] p-3 text-sm rounded-2xl shadow-sm ${
                            msg.sender === 'user' ? 'bg-black text-white rounded-tr-sm' : 
                            msg.isConfirmMsg ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-sm' :
                            'bg-white text-gray-800 rounded-tl-sm'
                        }`}>
                            {/* 🔥 SỬA LỖI ĐỎ REPLACE TẠI ĐÂY (ÉP KIỂU STRING) */}
                            <span dangerouslySetInnerHTML={{ __html: String(msg.text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></span>
                            
                            {msg.isConfirmMsg && pendingTx && (
                                <div className="mt-4 flex gap-2 border-t border-amber-200 pt-3">
                                    <button onClick={() => confirmAction('yes')} className="flex-1 bg-amber-600 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-amber-700">
                                        <Check size={14} /> Xác nhận
                                    </button>
                                    <button onClick={() => confirmAction('no')} className="flex-1 bg-white text-amber-700 border border-amber-300 py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-amber-50">
                                        <X size={14} /> Hủy bỏ
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && <div className="text-gray-400 text-xs italic">AI đang xử lý...</div>}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <div className="relative">
                    <input
                        type="text" value={input} disabled={pendingTx || isTyping}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Nhập thu chi..."
                        className="w-full bg-gray-100 rounded-xl py-3 pl-4 pr-12 text-sm outline-none"
                    />
                    <button onClick={handleSend} disabled={!input.trim() || isTyping || pendingTx} className="absolute right-2 top-2 p-1.5 bg-black text-white rounded-lg disabled:opacity-30">
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}