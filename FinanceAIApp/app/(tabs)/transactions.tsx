import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useTransaction, Transaction } from '../../src/context/TransactionContext';
import { useSettings } from '../../src/context/SettingsContext';
import { Colors } from '../../src/theme/Colors';
import { Search, X } from 'lucide-react-native';

// Import Component
import TransactionItem from '../../src/components/TransactionItem';

export default function TransactionsScreen() {
  const { transactions, deleteTransaction, updateTransaction } = useTransaction();
  const { darkMode } = useSettings();
  const theme = darkMode ? Colors.dark : Colors.light;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  
  // State for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editTitle, setEditTitle] = useState('');

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'ALL' || 
                          (filter === 'INCOME' && tx.isIncome) || 
                          (filter === 'EXPENSE' && !tx.isIncome);
    return matchesSearch && matchesFilter;
  });

  const handleLongPress = (transaction: Transaction) => {
    Alert.alert(
      "Quản lý giao dịch",
      `Bạn muốn làm gì với "${transaction.title}"?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Sửa", 
          onPress: () => {
            setSelectedTx(transaction);
            setEditAmount(transaction.amount.toString());
            setEditTitle(transaction.title);
            setIsEditModalOpen(true);
          }
        },
        { 
          text: "Xóa", 
          style: "destructive", 
          onPress: () => confirmDelete(transaction.id) 
        }
      ]
    );
  };

  const confirmDelete = (id: number) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa giao dịch này không?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive", 
          onPress: async () => {
            const success = await deleteTransaction(id);
            if (!success) {
              Alert.alert("Lỗi", "Không thể xóa giao dịch này.");
            }
          }
        }
      ]
    );
  };

  const handleUpdate = async () => {
    if (!selectedTx || !editAmount || !editTitle) return;

    const success = await updateTransaction(selectedTx.id, {
      amount: parseInt(editAmount),
      title: editTitle,
      isIncome: selectedTx.isIncome,
      categoryId: selectedTx.categoryId,
      date: selectedTx.date
    });

    if (success) {
      setIsEditModalOpen(false);
      setSelectedTx(null);
    } else {
      Alert.alert("Lỗi", "Không thể cập nhật giao dịch.");
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TransactionItem 
      transaction={item} 
      onPress={() => {}} 
      onLongPress={() => handleLongPress(item)}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Search size={20} color={theme.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Tìm kiếm giao dịch..."
            placeholderTextColor={theme.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterContainer}>
          {(['ALL', 'INCOME', 'EXPENSE'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterBadge,
                { backgroundColor: filter === f ? theme.tint : theme.card, borderColor: theme.border },
                filter === f && { backgroundColor: theme.tint }
              ]}
            >
              <Text style={[
                styles.filterText,
                { color: filter === f ? theme.background : theme.secondaryText }
              ]}>
                {f === 'ALL' ? 'Tất cả' : f === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Không tìm thấy giao dịch nào</Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Sửa giao dịch</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: theme.secondaryText }]}>DIỄN GIẢI</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <Text style={[styles.label, { color: theme.secondaryText }]}>SỐ TIỀN</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
              />

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.tint }]}
                onPress={handleUpdate}
              >
                <Text style={[styles.saveButtonText, { color: theme.background }]}>Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    height: 50,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: -8,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  saveButton: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
