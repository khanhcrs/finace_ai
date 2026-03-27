// File: src/layouts/MainLayout.jsx
import Sidebar from '../components/Sidebar.jsx';
import ChatbotPanel from '../components/ChatbotPanel.jsx'
export default function MainLayout({ children }) {
    return (
        <div className="flex h-screen bg-[#F9FAFB] text-gray-900 overflow-hidden font-sans">

            {/* Cột trái: Component Sidebar */}
            <Sidebar />

            {/* Cột giữa: Nội dung thay đổi (Trang chủ, Thống kê, v.v...) */}
            <main className="flex-1 overflow-y-auto relative">
                {children}
            </main>

            {/* Cột phải: Component Chatbot */}
            <ChatbotPanel />

        </div>
    );
}