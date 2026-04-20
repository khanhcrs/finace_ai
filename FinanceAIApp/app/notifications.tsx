import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSettings } from '../src/context/SettingsContext';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/theme/Colors';
import { Bell, BellOff, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react-native';
import axios from 'axios';
import { API_BASE_URL } from '../src/api/config';

type Notification = {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export default function NotificationsScreen() {
  const { darkMode } = useSettings();
  const { user } = useAuth();
  const theme = darkMode ? Colors.dark : Colors.light;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/notifications/user/${user.id}`);
      setNotifications(res.data.sort((a: any, b: any) => b.id - a.id));
    } catch (e) {
      console.error("Lỗi khi tải thông báo:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isWarning = item.title.toLowerCase().includes('cảnh báo');
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          { backgroundColor: theme.card, borderColor: theme.border },
          !item.read && { borderLeftWidth: 4, borderLeftColor: theme.tint }
        ]}
        onPress={() => !item.read && markAsRead(item.id)}
      >
        <View style={[styles.iconBox, { backgroundColor: isWarning ? '#FEF2F2' : '#F0FDF4' }]}>
          {isWarning ? (
            <AlertTriangle size={20} color="#EF4444" />
          ) : (
            <CheckCircle2 size={20} color="#10B981" />
          )}
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }, !item.read && { fontWeight: 'bold' }]}>{item.title}</Text>
          <Text style={[styles.message, { color: theme.secondaryText }]}>{item.message}</Text>
          <View style={styles.footer}>
            <Calendar size={12} color={theme.secondaryText} />
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Thông báo</Text>
        <View style={[styles.badge, { backgroundColor: theme.tint }]}>
          <Text style={styles.badgeText}>{notifications.filter(n => !n.read).length}</Text>
        </View>
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchNotifications(); }} />
          }
        />
      ) : (
        <View style={styles.emptyBox}>
          <BellOff size={48} color={theme.secondaryText} />
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Bạn không có thông báo nào</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 11,
    color: '#94a3b8',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  }
});
