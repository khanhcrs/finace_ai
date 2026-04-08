import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Switch, Alert } from 'react-native';
import { useTransaction } from '../src/context/TransactionContext';
import { useSettings } from '../src/context/SettingsContext';
import { Colors } from '../src/theme/Colors';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';

export default function AddTransactionScreen() {
  const { addTransaction, categories } = useTransaction();
  const { darkMode } = useSettings();
  const theme = darkMode ? Colors.dark : Colors.light;
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isIncome, setIsIncome] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!title || !amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await addTransaction({
        title,
        amount: parseFloat(amount),
        isIncome,
        categoryId: selectedCategoryId
      });

      if (success) {
        Alert.alert("Thành công", "Đã lưu giao dịch thành công!", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("Lỗi", "Không thể lưu giao dịch. Vui lòng thử lại!");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi lưu giao dịch!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === (isIncome ? 'INCOME' : 'EXPENSE'));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Thêm giao dịch</Text>
        <TouchableOpacity onPress={handleSave} disabled={!title || !amount}>
          <Check size={24} color={(!title || !amount) ? theme.secondaryText : theme.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.secondaryText }]}>SỐ TIỀN</Text>
          <TextInput
            style={[styles.amountInput, { color: isIncome ? theme.success : theme.error }]}
            placeholder="0"
            placeholderTextColor={theme.secondaryText}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.secondaryText }]}>GHI CHÚ</Text>
          <TextInput
            style={[styles.titleInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
            placeholder="Ăn trưa, Mua sắm..."
            placeholderTextColor={theme.secondaryText}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={[styles.switchSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>Khoản thu nhập</Text>
          <Switch
            value={isIncome}
            onValueChange={(val) => {
                setIsIncome(val);
                setSelectedCategoryId(null);
            }}
            trackColor={{ false: '#767577', true: theme.success }}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.secondaryText }]}>DANH MỤC</Text>
          <View style={styles.categoryGrid}>
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategoryId(cat.id)}
                style={[
                  styles.categoryItem,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  selectedCategoryId === cat.id && { borderColor: theme.tint, borderWidth: 2 }
                ]}
              >
                <Text style={[styles.categoryName, { color: theme.text }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 10,
  },
  titleInput: {
    fontSize: 18,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  switchSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  }
});
