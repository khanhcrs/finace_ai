import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { useTransaction } from '../../src/context/TransactionContext';
import { useSettings } from '../../src/context/SettingsContext';
import { Colors } from '../../src/theme/Colors';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react-native';

export default function StatsScreen() {
  const { transactions } = useTransaction();
  const { darkMode } = useSettings();
  const theme = darkMode ? Colors.dark : Colors.light;
  const screenWidth = Dimensions.get('window').width;
  
  const [range, setRange] = useState('month'); 

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handlePresetClick = (r: string) => {
    setRange(r);
  };

  // --- FILTER LOGIC ---
  const filterByRange = (txs: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return txs.filter(tx => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);

        if (range === '7days') {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            return txDate >= sevenDaysAgo;
        }
        if (range === 'month') {
            return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        }
        if (range === 'year') {
            return txDate.getFullYear() === now.getFullYear();
        }
        return true; // all
    });
  };

  const filteredTransactions = filterByRange(transactions);
  const totalIncome = filteredTransactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const expenseByCategory = filteredTransactions
    .filter(t => !t.isIncome)
    .reduce((acc: any, t) => {
      const name = t.categoryName || 'Khác';
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {});

  const barDataLabels = Object.keys(expenseByCategory).slice(0, 4);
  const barDataValues = barDataLabels.length > 0 
    ? barDataLabels.map(label => Math.round(expenseByCategory[label] / 1000))
    : [];

  const pieData = [
    { name: 'Thu nhập', amount: totalIncome, color: '#10B981', legendFontColor: theme.text, legendFontSize: 12 },
    { name: 'Chi tiêu', amount: totalExpense, color: '#EF4444', legendFontColor: theme.text, legendFontSize: 12 },
  ].filter(d => d.amount > 0);

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => darkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => theme.secondaryText,
    barPercentage: 0.7,
    decimalPlaces: 0,
    propsForLabels: {
        fontSize: 10,
        fontWeight: 'bold'
    }
  };

  const ranges = [
    { id: 'all', label: 'Tất cả' },
    { id: '7days', label: '7 ngày' },
    { id: 'month', label: 'Tháng' },
    { id: 'year', label: 'Năm' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.filterArea, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeScroll}>
          {ranges.map(r => (
            <TouchableOpacity 
              key={r.id} 
              onPress={() => handlePresetClick(r.id)}
              style={[
                  styles.rangeButton, 
                  { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 },
                  range === r.id && { backgroundColor: theme.tint, borderColor: theme.tint }
              ]}
            >
              <Text style={[
                  styles.rangeText, 
                  { color: theme.secondaryText },
                  range === r.id && { color: theme.background, fontWeight: 'bold' }
              ]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* SUMMARY SECTION */}
        <View style={styles.summaryGrid}>
            <View style={[styles.summaryItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ArrowUpCircle size={20} color="#10B981" />
                <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Tổng thu</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>{totalIncome.toLocaleString()}đ</Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ArrowDownCircle size={20} color="#EF4444" />
                <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Tổng chi</Text>
                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{totalExpense.toLocaleString()}đ</Text>
            </View>
        </View>

        <View style={[styles.balanceCard, { backgroundColor: theme.tint }]}>
            <View>
                <Text style={[styles.balanceLabel, { color: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)' }]}>Số dư trong kỳ</Text>
                <Text style={[styles.balanceValue, { color: darkMode ? '#000' : '#fff' }]}>{balance.toLocaleString()} VNĐ</Text>
            </View>
            <Wallet size={32} color={darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)'} />
        </View>

        {/* CHART 1: PIE */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Tỷ lệ Thu - Chi</Text>
          {pieData.length > 0 ? (
            <PieChart
                data={pieData}
                width={screenWidth - 40}
                height={180}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="0"
                center={[10, 0]}
                absolute
            />
          ) : (
            <View style={styles.noDataBox}>
                <Text style={{ color: theme.secondaryText }}>Không có dữ liệu</Text>
            </View>
          )}
        </View>

        {/* CHART 2: BAR */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Chi tiêu nhiều nhất (k VNĐ)</Text>
          {barDataValues.length > 0 ? (
            <BarChart
              data={{
                labels: barDataLabels,
                datasets: [{ data: barDataValues }]
              }}
              width={screenWidth - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{ 
                  ...chartConfig, 
                  color: (opacity = 1) => theme.tint,
                  labelColor: (opacity = 1) => theme.text,
              }}
              verticalLabelRotation={0}
              fromZero
              showValuesOnTopOfBars
              style={{ borderRadius: 16, marginTop: 16, marginLeft: -25 }}
            />
          ) : (
            <View style={styles.noDataBox}>
                <Text style={{ color: theme.secondaryText }}>Chưa có dữ liệu chi tiêu</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  filterArea: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rangeScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  rangeButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  balanceCard: {
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataBox: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
