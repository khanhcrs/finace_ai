// File: src/layouts/MainLayout.jsx
import { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatbotPanel from '../components/ChatbotPanel';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function MainLayout({ children }) {
    const userId = localStorage.getItem('finance_user_id');

    useEffect(() => {
        if (!userId) return;

        // Polling thông báo mỗi 30 giây
        const checkNotifications = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/api/notifications/user/${userId}/unread`);
                const notifications = response.data;

                notifications.forEach(async (notif) => {
                    toast.success(notif.message, {
                        duration: 5000,
                        position: 'top-right',
                    });
                    // Đánh dấu đã đọc ngay sau khi hiện toast
                    await axios.put(`http://localhost:8080/api/notifications/${notif.id}/read`);
                });
            } catch (error) {
                console.error("Lỗi khi lấy thông báo:", error);
            }
        };

        const interval = setInterval(checkNotifications, 30000); // 30 giây
        checkNotifications(); // Kiểm tra ngay lần đầu

        return () => clearInterval(interval);
    }, [userId]);

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