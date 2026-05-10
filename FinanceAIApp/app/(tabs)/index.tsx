import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTransaction } from '../../src/context/TransactionContext';
import { useSettings } from '../../src/context/SettingsContext';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/theme/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Import Components
import BalanceCard from '../../src/components/BalanceCard';
import SummaryCards from '../../src/components/SummaryCards';
import TransactionItem from '../../src/components/TransactionItem';

export default function HomeScreen() {
  const { transactions, isLoading } = useTransaction();
  const { darkMode } = useSettings();
  const { user } = useAuth();
  const theme = darkMode ? Colors.dark : Colors.light;
  const router = useRouter();

  const userName = user?.fullName || 'Khách';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "Chào buổi sáng,";
    if (hour >= 11 && hour < 14) return "Chào buổi trưa,";
    if (hour >= 14 && hour < 18) return "Chào buổi chiều,";
    return "Chào buổi tối,";
  };

  const totalIncome = transactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.secondaryText }]}>{getGreeting()}</Text>
            <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: theme.card, borderColor: theme.border, overflow: 'hidden' }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.text }]}>{userName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.tint} style={{ marginTop: 50 }} />
        ) : (
          <>
            <BalanceCard balance={balance} />
            <SummaryCards income={totalIncome} expense={totalExpense} />

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Giao dịch gần đây</Text>
              <TouchableOpacity onPress={() => router.push('/transactions')}>
                <Text style={{ color: theme.tint }}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            {transactions.slice(0, 5).map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onPress={() => { }} // Could navigate to edit
              />
            ))}

            {transactions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={{ color: theme.secondaryText }}>Chưa có giao dịch nào.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.tint === '#000' ? '#000' : '#fff' }]}
        onPress={() => router.push('/add-transaction')}
      >
        <Plus size={30} color={theme.tint === '#000' ? '#fff' : '#000'} strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row', gap: 12, marginBottom: 24,
  },
  summaryCard: {
    flex: 1, padding: 16, borderRadius: 20, borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 12, fontWeight: '500', marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16, fontWeight: 'bold',
  },
  transactionItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12,
  },
  txIconContainer: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 16, fontWeight: '600',
  },
  txCategory: {
    fontSize: 12,
  },
  txAmount: {
    fontSize: 16, fontWeight: 'bold',
  },
  fab: {
    position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  }
});

