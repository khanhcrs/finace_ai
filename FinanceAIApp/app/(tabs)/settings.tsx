import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TextInput, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { useSettings } from '../../src/context/SettingsContext';
import { useAuth } from '../../src/context/AuthContext';
import { useTransaction } from '../../src/context/TransactionContext';
import { Colors } from '../../src/theme/Colors';
import * as LucideIcons from 'lucide-react-native';
import axios from 'axios';
import { API_BASE_URL } from '../../src/api/config';
import * as ImagePicker from 'expo-image-picker';

export default function SettingsScreen() {
  const { darkMode, setDarkMode, chartType, setChartType, reportRange, setReportRange } = useSettings();
  const { user, logout, updateUser } = useAuth();
  const { categories, fetchData } = useTransaction();
  const theme = darkMode ? Colors.dark : Colors.light;

  const [isLoading, setIsLoading] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');

  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setProfileAvatar(user.avatar || '');
    }
  }, [user]);

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setProfileAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const payload: any = {};
      if (profileName.trim() !== user.fullName) payload.fullName = profileName.trim();
      
      if (oldPassword || newPassword || confirmPassword) {
        if (!oldPassword) {
          Alert.alert("Lỗi", "Vui lòng nhập mật khẩu cũ.");
          return;
        }
        if (!newPassword) {
          Alert.alert("Lỗi", "Vui lòng nhập mật khẩu mới.");
          return;
        }
        if (newPassword !== confirmPassword) {
          Alert.alert("Lỗi", "Mật khẩu mới và Nhập lại mật khẩu không khớp.");
          return;
        }
        payload.oldPassword = oldPassword;
        payload.password = newPassword;
      }
      
      if (profileAvatar !== user.avatar) payload.avatar = profileAvatar;

      if (Object.keys(payload).length > 0) {
        setIsLoading(true);
        await axios.put(`${API_BASE_URL}/users/${user.id}/profile`, payload);

        const updateData: any = {};
        if (payload.fullName) updateData.fullName = payload.fullName;
        if (payload.avatar) updateData.avatar = payload.avatar;
        if (Object.keys(updateData).length > 0) {
          await updateUser(updateData);
        }
        Alert.alert("Thành công", "Cập nhật hồ sơ thành công!");
        setIsEditingProfile(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setIsEditingProfile(false);
      }
    } catch (e: any) {
      if (e.response && e.response.data && e.response.data.error) {
        Alert.alert("Lỗi", e.response.data.error);
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật hồ sơ");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Category management state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [newCatType, setNewCatType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [newCatIcon, setNewCatIcon] = useState('HelpCircle');
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editIcon, setEditIcon] = useState('HelpCircle');

  const AVAILABLE_ICONS = [
    'Coffee', 'Utensils', 'Car', 'Bus', 'ShoppingBag', 'DollarSign',
    'Home', 'Tv', 'Film', 'Zap', 'Heart', 'Briefcase', 'BookOpen',
    'GraduationCap', 'HelpCircle', 'Plane', 'Gift', 'Stethoscope', 'PawPrint'
  ];

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên danh mục");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/categories`, {
        name: newCatName,
        type: newCatType,
        icon: newCatIcon,
        limitAmount: newCatLimit ? parseFloat(newCatLimit) : null,
        user: { id: user?.id }
      });
      setIsAddingCategory(false);
      setNewCatName('');
      setNewCatLimit('');
      setNewCatIcon('HelpCircle');
      await fetchData();
      Alert.alert("Thành công", "Đã thêm danh mục mới");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể thêm danh mục");
    }
  };

  const handleUpdateCategory = async (cat: any) => {
    try {
      await axios.post(`${API_BASE_URL}/categories`, {
        ...cat,
        name: editName,
        icon: editIcon,
        limitAmount: editLimit ? parseFloat(editLimit) : null,
        user: { id: user?.id }
      });
      setEditingCatId(null);
      await fetchData();
      Alert.alert("Thành công", "Đã cập nhật danh mục");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể cập nhật danh mục");
    }
  };

  const handleDeleteCategory = (id: number) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn xóa danh mục này?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/categories/${id}`);
              setEditingCatId(null);
              await fetchData();
              Alert.alert("Thành công", "Đã xóa danh mục");
            } catch (e: any) {
              if (e.response && e.response.data && e.response.data.error) {
                Alert.alert("Lỗi", e.response.data.error);
              } else {
                Alert.alert("Lỗi", "Không thể xóa danh mục này");
              }
            }
          }
        }
      ]
    );
  };

  const startEditing = (cat: any) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditLimit(cat.limitAmount?.toString() || '');
    setEditIcon(cat.icon || 'HelpCircle');
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>TÀI KHOẢN</Text>
          <TouchableOpacity onPress={() => setIsEditingProfile(true)}>
            <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.settingLabelContainer}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                ) : (
                  <LucideIcons.User size={40} color={theme.text} style={styles.icon} />
                )}
                <View>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>{user?.fullName || 'Người dùng'}</Text>
                  <Text style={[styles.settingSubLabel, { color: theme.secondaryText }]}>{user?.email}</Text>
                </View>
              </View>
              <LucideIcons.ChevronRight size={20} color={theme.secondaryText} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { color: theme.secondaryText, marginBottom: 0 }]}>DANH MỤC & HẠN MỨC HÀNG THÁNG</Text>
            <TouchableOpacity onPress={() => setIsAddingCategory(!isAddingCategory)}>
              {isAddingCategory ? <LucideIcons.X size={20} color={theme.error} /> : <LucideIcons.Plus size={20} color={theme.tint} />}
            </TouchableOpacity>
          </View>

          {isAddingCategory && (
            <View style={[styles.thresholdCard, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 12 }]}>
              <TextInput
                style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Tên danh mục"
                placeholderTextColor={theme.secondaryText}
                value={newCatName}
                onChangeText={setNewCatName}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setNewCatType('EXPENSE')}
                  style={[styles.typeButton, newCatType === 'EXPENSE' && { backgroundColor: theme.tint }]}
                >
                  <Text style={{ color: newCatType === 'EXPENSE' ? theme.background : theme.text, fontSize: 12, fontWeight: 'bold' }}>CHI TIÊU</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setNewCatType('INCOME')}
                  style={[styles.typeButton, newCatType === 'INCOME' && { backgroundColor: theme.tint }]}
                >
                  <Text style={{ color: newCatType === 'INCOME' ? theme.background : theme.text, fontSize: 12, fontWeight: 'bold' }}>THU NHẬP</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.secondaryText, marginTop: 4 }}>BIỂU TƯỢNG: {newCatIcon}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {AVAILABLE_ICONS.map(icon => (
                    <TouchableOpacity
                      key={icon}
                      onPress={() => setNewCatIcon(icon)}
                      style={[
                        { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border },
                        newCatIcon === icon && { borderColor: theme.tint, backgroundColor: theme.tint + '20' }
                      ]}
                    >
                      <Text style={{ color: theme.text, fontSize: 12 }}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TextInput
                style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Hạn mức (VNĐ)"
                placeholderTextColor={theme.secondaryText}
                keyboardType="numeric"
                value={newCatLimit}
                onChangeText={setNewCatLimit}
              />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.tint }]}
                onPress={handleAddCategory}
              >
                <LucideIcons.Check size={18} color={theme.background} style={{ marginRight: 8 }} />
                <Text style={[styles.saveButtonText, { color: theme.background }]}>Thêm danh mục</Text>
              </TouchableOpacity>
            </View>
          )}

          {categories.map((cat) => (
            <View key={cat.id} style={[styles.catItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {editingCatId === cat.id ? (
                <View style={{ flex: 1, gap: 8 }}>
                  <TextInput
                    style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                    value={editName}
                    onChangeText={setEditName}
                  />

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {AVAILABLE_ICONS.map(icon => (
                        <TouchableOpacity
                          key={icon}
                          onPress={() => setEditIcon(icon)}
                          style={[
                            { padding: 6, borderRadius: 6, borderWidth: 1, borderColor: theme.border },
                            editIcon === icon && { borderColor: theme.tint, backgroundColor: theme.tint + '20' }
                          ]}
                        >
                          <Text style={{ color: theme.text, fontSize: 10 }}>{icon}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <TextInput
                    style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                    value={editLimit}
                    keyboardType="numeric"
                    onChangeText={setEditLimit}
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 14, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => handleDeleteCategory(cat.id)}><LucideIcons.Trash2 size={20} color={theme.error} /></TouchableOpacity>
                    <View style={{ width: 1, height: 20, backgroundColor: theme.border }} />
                    <TouchableOpacity onPress={() => handleUpdateCategory(cat)}><LucideIcons.Check size={20} color={theme.tint} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingCatId(null)}><LucideIcons.X size={20} color={theme.secondaryText} /></TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 10, color: theme.secondaryText }}>[{cat.icon}]</Text>
                      <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
                    </View>
                    <Text style={[styles.catLimit, { color: theme.secondaryText }]}>
                      {cat.limitAmount ? `Hạn mức: ${cat.limitAmount.toLocaleString()} đ` : 'Không giới hạn'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: cat.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                      {cat.type === 'INCOME' ? 'THU NHẬP' : 'CHI TIÊU'}
                    </Text>
                    <TouchableOpacity onPress={() => startEditing(cat)}>
                      <LucideIcons.Edit2 size={16} color={theme.secondaryText} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>GIAO DIỆN & THÔNG BÁO</Text>
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingLabelContainer}>
              <LucideIcons.Moon size={20} color={theme.text} style={styles.icon} />
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
              <LucideIcons.Bell size={20} color={theme.text} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Thông báo</Text>
            </View>
            <Switch value={true} trackColor={{ false: '#767577', true: theme.tint }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>SỞ THÍCH BÁO CÁO</Text>
          <View style={[styles.thresholdCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Loại biểu đồ mặc định</Text>
              <View style={{ flexDirection: 'row', backgroundColor: theme.background, borderRadius: 8, padding: 2 }}>
                <TouchableOpacity
                  onPress={() => setChartType('bar')}
                  style={[styles.smallTypeButton, chartType === 'bar' && { backgroundColor: theme.tint }]}
                >
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: chartType === 'bar' ? theme.background : theme.text }}>CỘT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setChartType('pie')}
                  style={[styles.smallTypeButton, chartType === 'pie' && { backgroundColor: theme.tint }]}
                >
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: chartType === 'pie' ? theme.background : theme.text }}>TRÒN</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Kỳ báo cáo mặc định</Text>
              <View style={{ flexDirection: 'row', backgroundColor: theme.background, borderRadius: 8, padding: 2 }}>
                {['week', 'month', 'year'].map(range => (
                  <TouchableOpacity
                    key={range}
                    onPress={() => setReportRange(range)}
                    style={[styles.smallTypeButton, reportRange === range && { backgroundColor: theme.tint }]}
                  >
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: reportRange === range ? theme.background : theme.text }}>
                      {range === 'week' ? 'TUẦN' : range === 'month' ? 'THÁNG' : 'NĂM'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>HỖ TRỢ</Text>
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingLabelContainer}>
              <LucideIcons.Shield size={20} color={theme.text} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Quyền riêng tư</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingLabelContainer}>
              <LucideIcons.CircleHelp size={20} color={theme.text} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Trợ giúp</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: theme.error }]}
          onPress={handleLogout}
        >
          <LucideIcons.LogOut size={20} color={theme.error} style={styles.icon} />
          <Text style={[styles.logoutText, { color: theme.error }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PROFILE EDIT MODAL */}
      <Modal animationType="slide" transparent={true} visible={isEditingProfile} onRequestClose={() => setIsEditingProfile(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Chỉnh sửa hồ sơ</Text>
              <TouchableOpacity onPress={() => setIsEditingProfile(false)} style={styles.closeBtn}>
                <LucideIcons.X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity onPress={handlePickAvatar} style={{ position: 'relative' }}>
                  {profileAvatar ? (
                    <Image source={{ uri: profileAvatar }} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: theme.tint }} />
                  ) : (
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' }}>
                      <LucideIcons.User size={50} color={theme.secondaryText} />
                    </View>
                  )}
                  <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.tint, borderRadius: 15, padding: 6 }}>
                    <LucideIcons.Camera size={16} color={theme.background} />
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: theme.text, marginBottom: 8 }]}>Tên hiển thị</Text>
              <TextInput
                style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, marginBottom: 16 }]}
                value={profileName}
                onChangeText={setProfileName}
                placeholder="Nhập tên mới"
                placeholderTextColor={theme.secondaryText}
              />

              <Text style={[styles.inputLabel, { color: theme.text, marginBottom: 8, marginTop: 8 }]}>Đổi mật khẩu (bỏ trống nếu không đổi)</Text>
              <TextInput
                style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, marginBottom: 12 }]}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Mật khẩu cũ"
                placeholderTextColor={theme.secondaryText}
                secureTextEntry
              />
              <TextInput
                style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, marginBottom: 12 }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Mật khẩu mới"
                placeholderTextColor={theme.secondaryText}
                secureTextEntry
              />
              <TextInput
                style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, marginBottom: 24 }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={theme.secondaryText}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.tint, marginBottom: 40 }]}
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <>
                    <LucideIcons.Save size={20} color={theme.background} style={{ marginRight: 8 }} />
                    <Text style={[styles.saveButtonText, { color: theme.background }]}>Lưu thay đổi</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  catName: {
    fontSize: 15,
    fontWeight: '600',
  },
  catLimit: {
    fontSize: 12,
    marginTop: 2,
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
  inputField: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  typeButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  smallTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  modalContent: {
    height: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(150,150,150,0.15)',
    borderRadius: 20,
  }
});
