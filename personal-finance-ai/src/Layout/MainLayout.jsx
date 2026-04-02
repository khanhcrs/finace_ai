// File: src/layouts/MainLayout.jsx
import Sidebar from '../components/Sidebar';
import ChatbotPanel from '../components/ChatbotPanel';

export default function MainLayout({ children }) {
    return (
        // Đã thêm: dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300
        <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-300">

            <Sidebar />

            <main className="flex-1 overflow-y-auto relative">
                {children}
            </main>

            <ChatbotPanel />

        </div>
    );
}