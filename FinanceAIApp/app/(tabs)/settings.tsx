import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSettings } from '../../src/context/SettingsContext';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/theme/Colors';
import { User, Moon, Bell, Shield, CircleHelp, LogOut, Wallet, Check } from 'lucide-react-native';
import axios from 'axios';
import { API_BASE_URL } from '../../src/api/config';

export default function SettingsScreen() {
  const { darkMode, setDarkMode } = useSettings();
  const { user, logout } = useAuth();
  const theme = darkMode ? Colors.dark : Colors.light;

  const [thresholds, setThresholds] = useState({
    thresholdEating: '500000',
    thresholdShopping: '5000000',
    thresholdTransport: '2000000',
    thresholdOthers: '1000000'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchThresholds();
    }
  }, [user?.id]);

  const fetchThresholds = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE_URL}/users/${user?.id}`);
      const userData = res.data;
      setThresholds({
        thresholdEating: userData.thresholdEating?.toString() || '500000',
        thresholdShopping: userData.thresholdShopping?.toString() || '5000000',
        thresholdTransport: userData.thresholdTransport?.toString() || '2000000',
        thresholdOthers: userData.thresholdOthers?.toString() || '1000000',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveThresholds = async () => {
    try {
      setIsSubmitting(true);
      await axios.put(`${API_BASE_URL}/users/${user?.id}/thresholds`, {
        thresholdEating: parseFloat(thresholds.thresholdEating),
        thresholdShopping: parseFloat(thresholds.thresholdShopping),
        thresholdTransport: parseFloat(thresholds.thresholdTransport),
        thresholdOthers: parseFloat(thresholds.thresholdOthers)
      });
      Alert.alert("Thành công", "Đã cập nhật hạn mức chi tiêu!");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lưu cài đặt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>TÀI KHOẢN</Text>
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingLabelContainer}>
              <User size={20} color={theme.text} style={styles.icon} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>{user?.fullName || 'Người dùng'}</Text>
                <Text style={[styles.settingSubLabel, { color: theme.secondaryText }]}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>HẠN MỨC CHI TIÊU BẤT THƯỜNG (VNĐ)</Text>
          <View style={[styles.thresholdCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Ăn uống</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={thresholds.thresholdEating}
                onChangeText={(val) => setThresholds({...thresholds, thresholdEating: val})}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Mua sắm</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={thresholds.thresholdShopping}
                onChangeText={(val) => setThresholds({...thresholds, thresholdShopping: val})}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Di chuyển</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={thresholds.thresholdTransport}
                onChangeText={(val) => setThresholds({...thresholds, thresholdTransport: val})}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Khác</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={thresholds.thresholdOthers}
                onChangeText={(val) => setThresholds({...thresholds, thresholdOthers: val})}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: theme.tint }]}
              onPress={handleSaveThresholds}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color={theme.background} /> : (
                <>
                  <Check size={18} color={theme.background} style={{marginRight: 8}} />
                  <Text style={[styles.saveButtonText, { color: theme.background }]}>Lưu cài đặt</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>GIAO DIỆN & THÔNG BÁO</Text>
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingLabelContainer}>
              <Moon size={20} color={theme.text} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Chế độ tối</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: theme.tint }}
            />
          </View>
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingLabelContainer}>
              <Bell size={20} color={theme.text} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Thông báo</Text>
            </View>
            <Switch value={true} trackColor={{ false: '#767577', true: theme.tint }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>HỖ TRỢ</Text>
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingLabelContainer}>
              <Shield size={20} color={theme.text} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Quyền riêng tư</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingLabelContainer}>
              <CircleHelp size={20} color={theme.text} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Trợ giúp</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: theme.error }]}
          onPress={handleLogout}
        >
          <LogOut size={20} color={theme.error} style={styles.icon} />
          <Text style={[styles.logoutText, { color: theme.error }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  thresholdCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  input: {
    flex: 1.5,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    textAlign: 'right',
  },
  saveButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubLabel: {
    fontSize: 12,
    fontWeight: '400',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
