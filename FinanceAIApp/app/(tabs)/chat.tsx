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

  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const textToProcess = input;
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: textToProcess };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const savedUserId = await AsyncStorage.getItem('finance_user_id') || '1';

      const response = await axios.get(`${API_BASE_URL}/ai/process`, {
        params: {
          text: textToProcess,
          userId: savedUserId
        }
      });

      const { reply, transaction } = response.data;

      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: reply || "Đã xử lý xong yêu cầu của bạn!" 
      };
      setMessages(prev => [...prev, aiMsg]);

      if (transaction) {
        fetchData();
        Alert.alert("Thành công", "Đã ghi chép giao dịch!");
      }
    } catch (error) {
      console.error(error);
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: "❌ Máy chủ AI đang bận hoặc có lỗi kết nối." 
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
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
    const userMsg: Message = { 
      id: Date.now().toString(), 
      sender: 'user', 
      text: "📷 [Đã gửi một ảnh hóa đơn]",
      image: uri
    };
    setMessages(prev => [...prev, userMsg]);
    setIsUploading(true);

    try {
      const savedUserId = await AsyncStorage.getItem('finance_user_id') || '1';
      
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      });
      formData.append('userId', savedUserId);

      const response = await axios.post(`${API_BASE_URL}/ai/process-receipt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const transaction = response.data;
      if (transaction) {
        const amountFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount);
        const aiMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          sender: 'ai', 
          text: `✅ Mình đã đọc xong hóa đơn!\n\n**Nội dung:** ${transaction.note}\n**Số tiền:** ${amountFormatted}\n**Danh mục:** ${transaction.category?.name || 'Khác'}\n\nĐã lưu vào lịch sử giao dịch của bạn.` 
        };
        setMessages(prev => [...prev, aiMsg]);
        fetchData();
      }
    } catch (error) {
      console.error(error);
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: "❌ Xin lỗi, mình không thể đọc được hóa đơn này. Bạn hãy thử chụp rõ hơn nhé!" 
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsUploading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageWrapper, item.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
      <View style={[
        styles.messageBubble, 
        item.sender === 'user' 
          ? [styles.userBubble, { backgroundColor: theme.tint === '#000' ? '#000' : '#fff' }] 
          : [styles.aiBubble, { backgroundColor: theme.card, borderColor: theme.border }]
      ]}>
        {item.image && <Image source={{ uri: item.image }} style={styles.messageImage} />}
        <Text style={[
          styles.messageText, 
          { color: item.sender === 'user' ? (theme.tint === '#000' ? '#fff' : '#000') : theme.text }
        ]}>
          {item.text.replace(/\*\*(.*?)\*\*/g, '$1')}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {(isTyping || isUploading) && (
          <View style={styles.typingContainer}>
            <View style={[styles.typingBubble, { backgroundColor: theme.card }]}>
              <ActivityIndicator size="small" color={theme.tint} />
              <Text style={[styles.typingText, { color: theme.secondaryText }]}>
                {isUploading ? "AI đang phân tích..." : "AI đang nghĩ..."}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.inputArea, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.card }]} 
            onPress={pickImage}
            disabled={isTyping || isUploading}
          >
            <ImageIcon size={22} color={theme.secondaryText} />
          </TouchableOpacity>
          
          <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Nhập nội dung..."
              placeholderTextColor={theme.secondaryText}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: theme.tint === '#000' ? '#000' : '#fff', opacity: !input.trim() ? 0.5 : 1 }]} 
              onPress={handleSend}
              disabled={!input.trim() || isTyping || isUploading}
            >
              <Send size={18} color={theme.tint === '#000' ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  aiWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  typingContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 12,
    marginLeft: 8,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 4,
    minHeight: 44,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  }
});
