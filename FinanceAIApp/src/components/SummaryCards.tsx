import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { Colors } from '../theme/Colors';

interface SummaryCardsProps {
  income: number;
  expense: number;
}

export default function SummaryCards({ income, expense }: SummaryCardsProps) {
  const { darkMode } = useSettings();
  const theme = darkMode ? Colors.dark : Colors.light;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.secondaryText }]}>Thu nhập</Text>
        <Text style={[styles.amount, { color: theme.success }]}>+{formatCurrency(income)}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.secondaryText }]}>Chi tiêu</Text>
        <Text style={[styles.amount, { color: theme.error }]}>-{formatCurrency(expense)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
