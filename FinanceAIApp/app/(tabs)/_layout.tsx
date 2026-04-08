import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useSettings } from '../../src/context/SettingsContext';
import { Colors } from '../../src/theme/Colors';
import { House, List, ChartBar, Settings, MessageSquare } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { API_BASE_URL } from '../../src/api/config';
import axios from 'axios';
import { Alert } from 'react-native';


export default function TabLayout() {
  const { darkMode } = useSettings();
  const { user } = useAuth();
  const theme = darkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    if (!user?.id) return;

    const checkNotifications = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/notifications/user/${user.id}/unread`);
            const notifications = response.data;

            notifications.forEach(async (notif: any) => {
                Alert.alert(notif.title, notif.message);
                // Đánh dấu đã đọc
                await axios.put(`${API_BASE_URL}/notifications/${notif.id}/read`);
            });
        } catch (error) {
            console.error("Lỗi lấy thông báo:", error);
        }
    };

    const interval = setInterval(checkNotifications, 30000);
    checkNotifications();

    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <House color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color }) => <List color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Thống kê',
          tabBarIcon: ({ color }) => <ChartBar color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ color }) => <MessageSquare color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
