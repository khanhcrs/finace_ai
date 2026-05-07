import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { useTransaction } from '../../src/context/TransactionContext';
import { useSettings } from '../../src/context/SettingsContext';
import { Colors } from '../../src/theme/Colors';
import { Send, Image as ImageIcon, Loader2, MessageSquare } from 'lucide-react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../src/api/config';

type Message = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  image?: string;
};

export default function ChatScreen() {
  const { fetchData } = useTransaction();
  const { darkMode } = useSettings();
  const theme = darkMode ? Colors.dark : Colors.light;

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Chào bạn! Mình là Trợ lý AI. Bạn muốn ghi chép hay tâm sự gì với mình hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingTx, setPendingTx] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const textToProcess = input;
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: textToProcess };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setPendingTx(null);

    try {
      const savedUserId = await AsyncStorage.getItem('finance_user_id') || '1';

      const response = await axios.get(`${API_BASE_URL}/ai/process`, {
        params: {
          text: textToProcess,
          userId: savedUserId
        }
      });

      const { reply, transaction } = response.data;

      if (transaction) {
        if (transaction.isAnomaly) {
          const aiText = reply || "Khoản chi này có vẻ bất thường. Bạn có muốn lưu không?";
          
          const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiText };
          setMessages(prev => [...prev, aiMsg]);
          setPendingTx(transaction);
        } else {
          const aiText = transaction.botMessage || reply || "Đã ghi chép giao dịch thành công!";
          const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiText };
          setMessages(prev => [...prev, aiMsg]);
          fetchData(); 
        }
      } else {
        const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: reply || "Đã xử lý xong!" };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: "❌ Máy chủ AI đang bận hoặc lỗi kết nối." };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // HÀM SOÁT LỖI GÓI HÀNG Ở ĐÂY
  const handleConfirmSave = async () => {
    if (!pendingTx) return;
    try {
      const savedUserId = await AsyncStorage.getItem('finance_user_id') || '1';
      
      const dataToSend = { ...pendingTx, isAnomaly: false, userId: savedUserId };
      
      console.log("==== GÓI HÀNG CHUẨN BỊ GỬI LÊN BACKEND ====");
      console.log(JSON.stringify(dataToSend, null, 2));
      console.log("============================================");

      await axios.post(`${API_BASE_URL}/transactions`, dataToSend);
      
      const aiMsg: Message = { id: Date.now().toString(), sender: 'ai', text: "✅ Đã lưu khoản chi đặc biệt này vào sổ!" };
      setMessages(prev => [...prev, aiMsg]);
      
      setPendingTx(null);
      fetchData();
    } catch (error) {
      console.log("==== LÝ DO BACKEND TỪ CHỐI ====");
      if (axios.isAxiosError(error)) {
        console.log(error.response?.data);
      } else {
        console.log(error);
      }
      Alert.alert("Lỗi 400", "Bạn hãy xem log ở màn hình máy tính nhé!");
    }
  };

  const handleCancelSave = () => {
    setPendingTx(null);
    const aiMsg: Message = { id: Date.now().toString(), sender: 'ai', text: "❌ Đã hủy bỏ giao dịch." };
    setMessages(prev => [...prev, aiMsg]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: "📷 [Đã gửi ảnh]", image: uri };
    setMessages(prev => [...prev, userMsg]);
    setIsUploading(true);

    try {
      const savedUserId = await AsyncStorage.getItem('finance_user_id') || '1';
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', { uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri, type: 'image/jpeg', name: 'receipt.jpg' });
      formData.append('userId', savedUserId);

      const response = await axios.post(`${API_BASE_URL}/ai/process-receipt`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (response.data) {
        const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: `✅ Đã quét hóa đơn và lưu thành công!` };
        setMessages(prev => [...prev, aiMsg]);
        fetchData();
      }
    } catch (error) {
      const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: "❌ Lỗi đọc ảnh." };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsUploading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageWrapper, item.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
      <View style={[styles.messageBubble, item.sender === 'user' ? [styles.userBubble, { backgroundColor: theme.tint === '#000' ? '#000' : '#fff' }] : [styles.aiBubble, { backgroundColor: theme.card, borderColor: theme.border }]]}>
        {item.image && <Image source={{ uri: item.image }} style={styles.messageImage} />}
        <Text style={[styles.messageText, { color: item.sender === 'user' ? (theme.tint === '#000' ? '#fff' : '#000') : theme.text }]}>
          {item.text.replace(/\*\*(.*?)\*\*/g, '$1')}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList ref={flatListRef} data={messages} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={styles.listContent} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} />

        {(isTyping || isUploading) && (
          <View style={styles.typingContainer}>
            <View style={[styles.typingBubble, { backgroundColor: theme.card }]}>
              <ActivityIndicator size="small" color={theme.tint} />
              <Text style={[styles.typingText, { color: theme.secondaryText }]}>{isUploading ? "AI đang phân tích..." : "AI đang nghĩ..."}</Text>
            </View>
          </View>
        )}

        {pendingTx && (
          <View style={[styles.confirmBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>⚠️ Đang chờ xác nhận khoản chi</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelSave}><Text style={styles.btnText}>Hủy bỏ</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmSave}><Text style={styles.btnText}>Vẫn Lưu</Text></TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.inputArea, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.card }]} onPress={pickImage} disabled={isTyping || isUploading || pendingTx !== null}><ImageIcon size={22} color={theme.secondaryText} /></TouchableOpacity>
          <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
            <TextInput style={[styles.input, { color: theme.text }]} placeholder="Nhập nội dung..." placeholderTextColor={theme.secondaryText} value={input} onChangeText={setInput} multiline editable={pendingTx === null} />
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.tint === '#000' ? '#000' : '#fff', opacity: (!input.trim() || pendingTx !== null) ? 0.5 : 1 }]} onPress={handleSend} disabled={!input.trim() || isTyping || isUploading || pendingTx !== null}><Send size={18} color={theme.tint === '#000' ? '#fff' : '#000'} /></TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 20 },
  messageWrapper: { marginBottom: 16, flexDirection: 'row' },
  userWrapper: { justifyContent: 'flex-end' },
  aiWrapper: { justifyContent: 'flex-start' },
  messageBubble: { padding: 12, borderRadius: 20, maxWidth: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderWidth: 1, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 8 },
  typingContainer: { paddingHorizontal: 16, marginBottom: 8 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 12, borderRadius: 16, alignSelf: 'flex-start' },
  typingText: { fontSize: 12, marginLeft: 8 },
  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 22, paddingHorizontal: 4, minHeight: 44 },
  input: { flex: 1, paddingHorizontal: 12, fontSize: 15, maxHeight: 100 },
  sendButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', margin: 4 },
  confirmBox: { padding: 16, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  confirmTitle: { marginBottom: 12, textAlign: 'center', fontWeight: '700', fontSize: 14 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  confirmBtn: { backgroundColor: '#10B981', paddingVertical: 10, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#EF4444', paddingVertical: 10, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});