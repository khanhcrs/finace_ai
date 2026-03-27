// File: src/components/ChatbotPanel/ChatbotPanel.jsx
import { MessageSquare, Send } from 'lucide-react';

export default function ChatbotPanel() {
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
                <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-sm w-[85%]">
                    Chào Khánh! Mình có thể giúp gì cho tình hình tài chính của bạn hôm nay?
                </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Nhập giao dịch nhanh..."
                        className="w-full bg-gray-100 border-transparent rounded-xl py-3 pl-4 pr-12 text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    />
                    <button className="absolute right-2 top-2 p-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}