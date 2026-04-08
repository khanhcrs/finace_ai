import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { Colors } from '../theme/Colors';

interface BalanceCardProps {
  balance: number;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  const { darkMode } = useSettings();
  const theme = darkMode ? Colors.dark : Colors.light;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.tint === '#000' ? '#111' : '#fff' }]}>
      <Text style={[styles.label, { color: theme.tint === '#000' ? '#aaa' : '#666' }]}>Tổng số dư</Text>
      <Text style={[styles.amount, { color: theme.tint === '#000' ? '#fff' : '#000' }]}>{formatCurrency(balance)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});
