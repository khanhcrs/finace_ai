import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { Colors } from '../theme/Colors';

interface TransactionItemProps {
  transaction: any;
  onPress?: () => void;
  onLongPress?: () => void;
}

export default function TransactionItem({ transaction, onPress, onLongPress }: TransactionItemProps) {
  const { darkMode } = useSettings();
  const theme = darkMode ? Colors.dark : Colors.light;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const IconComponent = transaction.icon;

  return (
    <TouchableOpacity 
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <IconComponent size={24} color={theme.text} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]}>{transaction.title}</Text>
        <Text style={[styles.category, { color: theme.secondaryText }]}>
          {transaction.categoryName} {transaction.date ? `• ${transaction.date}` : ''}
        </Text>
      </View>
      <Text style={[styles.amount, { color: transaction.isIncome ? theme.success : theme.error }]}>
        {transaction.isIncome ? '+' : '-'}{transaction.amount.toLocaleString('vi-VN')} đ
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  category: {
    fontSize: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
