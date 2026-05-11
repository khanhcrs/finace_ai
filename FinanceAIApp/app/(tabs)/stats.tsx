import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions,
  TouchableOpacity, Modal
} from 'react-native';
import { useTransaction } from '../../src/context/TransactionContext';
import { useSettings } from '../../src/context/SettingsContext';
import { Colors } from '../../src/theme/Colors';
import { PieChart } from 'react-native-chart-kit';
import { ArrowUpCircle, ArrowDownCircle, Wallet, X, Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react-native';

const CATEGORY_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#F77825', '#55CB70', '#C45850', '#8e5ea2',
  '#00A86B', '#D2386C', '#FADA5E', '#1D3557', '#E63946'
];

export default function StatsScreen() {
  const { transactions } = useTransaction();
  const { darkMode, reportRange } = useSettings();
  const theme = darkMode ? Colors.dark : Colors.light;
  const screenWidth = Dimensions.get('window').width;

  const [range, setRange] = useState(reportRange || 'month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [tempRange, setTempRange] = useState(range);
  const [tempDate, setTempDate] = useState(new Date());

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsType, setDetailsType] = useState('expense');

  useEffect(() => {
    if (reportRange) {
      setRange(reportRange);
      setCurrentDate(new Date());
    }
  }, [reportRange]);

  const openTimePicker = () => {
    setTempRange(range);
    setTempDate(new Date(currentDate));
    setTimePickerVisible(true);
  };

  const applyTimeFilter = () => {
    setRange(tempRange);
    setCurrentDate(new Date(tempDate));
    setTimePickerVisible(false);
  };

  const clearTimeFilter = () => {
    setRange('month');
    setCurrentDate(new Date());
    setTimePickerVisible(false);
  };

  const getWeekBoundaries = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(current.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
  };

  const filterByRange = (txs: any[]) => {
    return txs.filter(tx => {
      if (!tx.date) return false;
      const txDate = new Date(tx.date);

      if (range === 'year') {
        return txDate.getFullYear() === currentDate.getFullYear();
      }
      if (range === 'month') {
        return txDate.getMonth() === currentDate.getMonth() &&
          txDate.getFullYear() === currentDate.getFullYear();
      }
      if (range === 'week') {
        const { startOfWeek, endOfWeek } = getWeekBoundaries(currentDate);
        return txDate >= startOfWeek && txDate <= endOfWeek;
      }
      return true;
    });
  };

  const filteredTransactions = filterByRange(transactions);
  const totalIncome = filteredTransactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const getCategoryDetails = (isIncome: boolean) => {
    const details = filteredTransactions
      .filter(t => t.isIncome === isIncome)
      .reduce((acc: any, t) => {
        const name = t.categoryName || 'Khác';
        acc[name] = (acc[name] || 0) + t.amount;
        return acc;
      }, {});
    return Object.keys(details)
      .map((key, index) => ({
        name: key,
        amount: details[key],
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const currentDetails = getCategoryDetails(detailsType === 'income');

  const detailsPieData = currentDetails.map(item => ({
    name: item.name,
    amount: item.amount,
    color: item.color,
    legendFontColor: theme.text,
    legendFontSize: 13
  }));

  const pieData = [
    { name: 'Chi tiêu', amount: totalExpense, color: '#EF4444', legendFontColor: theme.text, legendFontSize: 13 },
    { name: 'Thu nhập', amount: totalIncome, color: '#10B981', legendFontColor: theme.text, legendFontSize: 13 },
  ].filter(d => d.amount > 0);

  const getDateDisplayString = () => {
    const now = new Date();
    if (range === 'month') {
      if (currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear()) return 'Tháng này';
      return `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;
    }
    if (range === 'year') {
      if (currentDate.getFullYear() === now.getFullYear()) return 'Năm nay';
      return `Năm ${currentDate.getFullYear()}`;
    }
    if (range === 'week') {
      const { startOfWeek, endOfWeek } = getWeekBoundaries(currentDate);
      return `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`;
    }
    return 'Tất cả';
  };

  const generateWeeksForMonth = (year: number, month: number) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
    let currentStart = new Date(year, month, 1 - dayOfWeek + 1);
    currentStart.setHours(0, 0, 0, 0);

    const now = new Date();
    let weekNum = 1;

    while (currentStart.getMonth() === month || currentStart < new Date(year, month + 1, 1)) {
      const start = new Date(currentStart);
      const end = new Date(currentStart);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const isCurrentWeek = now >= start && now <= end;

      const sDay = start.getDate();
      const sMonth = start.getMonth() + 1;
      const eDay = end.getDate();
      const eMonth = end.getMonth() + 1;

      let rangeString = '';
      if (sMonth === eMonth) {
        rangeString = `Ngày ${sDay} - ${eDay}`;
      } else {
        if (sMonth - 1 !== month && sMonth !== 12) {
          rangeString = `Ngày ${sDay}/${sMonth} - ${eDay}`;
        } else {
          rangeString = `Ngày ${sDay} - ${eDay}/${eMonth}`;
        }
      }

      weeks.push({
        id: weekNum,
        start,
        end,
        isCurrentWeek,
        rangeString
      });

      currentStart.setDate(currentStart.getDate() + 7);
      weekNum++;

      if (currentStart.getMonth() !== month && currentStart.getDate() > 1) {
        break;
      }
    }
    return weeks;
  };

  const renderTimeGrid = () => {
    if (tempRange === 'week') {
      const weeks = generateWeeksForMonth(tempDate.getFullYear(), tempDate.getMonth());

      return (
        <View style={{ flex: 1 }}>
          <View style={styles.modalSubHeader}>
            <TouchableOpacity onPress={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() - 1, 1))}>
              <ChevronLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalSubHeaderText, { color: theme.text }]}>
              Tháng {tempDate.getMonth() + 1}/{tempDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 1))}>
              <ChevronRight size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.weekListContainer} showsVerticalScrollIndicator={false}>
            {weeks.map((w, index) => {
              const isSelected = tempDate >= w.start && tempDate <= w.end;
              const isFuture = w.start > new Date();

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.weekRow,
                    isSelected && { backgroundColor: theme.tint + '15', borderRadius: 12 }
                  ]}
                  onPress={() => setTempDate(w.start)}
                >
                  <Text style={[
                    styles.weekLabelText,
                    { color: isSelected ? theme.tint : (isFuture ? theme.secondaryText : theme.text) }
                  ]}>
                    {w.isCurrentWeek ? 'Tuần này:' : `Tuần ${w.id}:`}
                  </Text>
                  <Text style={[
                    styles.weekRangeText,
                    { color: isSelected ? theme.tint : theme.secondaryText }
                  ]}>
                    {w.rangeString}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    if (tempRange === 'month') {
      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      return (
        <View>
          <View style={styles.modalSubHeader}>
            <TouchableOpacity onPress={() => setTempDate(new Date(tempDate.getFullYear() - 1, tempDate.getMonth(), 1))}>
              <ChevronLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalSubHeaderText, { color: theme.text }]}>Năm {tempDate.getFullYear()}</Text>
            <TouchableOpacity onPress={() => setTempDate(new Date(tempDate.getFullYear() + 1, tempDate.getMonth(), 1))}>
              <ChevronRight size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.gridContainer}>
            {months.map(m => {
              const isSelected = tempDate.getMonth() + 1 === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.gridItem, isSelected && { backgroundColor: theme.tint, borderColor: theme.tint }]}
                  onPress={() => setTempDate(new Date(tempDate.getFullYear(), m - 1, 1))}
                >
                  <Text style={[styles.gridItemText, { color: isSelected ? '#fff' : theme.secondaryText }]}>Tháng {m}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    if (tempRange === 'year') {
      const currentY = tempDate.getFullYear();
      const years = [currentY - 4, currentY - 3, currentY - 2, currentY - 1, currentY, currentY + 1, currentY + 2, currentY + 3, currentY + 4];
      return (
        <View>
          <View style={styles.modalSubHeader}>
            <TouchableOpacity onPress={() => setTempDate(new Date(currentY - 9, 0, 1))}><ChevronLeft size={24} color={theme.text} /></TouchableOpacity>
            <Text style={[styles.modalSubHeaderText, { color: theme.text }]}>{currentY - 4} - {currentY + 4}</Text>
            <TouchableOpacity onPress={() => setTempDate(new Date(currentY + 9, 0, 1))}><ChevronRight size={24} color={theme.text} /></TouchableOpacity>
          </View>
          <View style={styles.gridContainer}>
            {years.map(y => {
              const isSelected = tempDate.getFullYear() === y;
              return (
                <TouchableOpacity
                  key={y}
                  style={[styles.gridItem, isSelected && { backgroundColor: theme.tint, borderColor: theme.tint }]}
                  onPress={() => setTempDate(new Date(y, 0, 1))}
                >
                  <Text style={[styles.gridItemText, { color: isSelected ? '#fff' : theme.secondaryText }]}>{y}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

      <View style={styles.topSelectorContainer}>
        <TouchableOpacity style={[styles.datePill, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={openTimePicker}>
          <Calendar size={18} color={theme.text} />
          <Text style={[styles.datePillText, { color: theme.text }]}>{getDateDisplayString()}</Text>
          <ChevronDown size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={[styles.balanceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View>
            <Text style={[styles.balanceLabel, { color: theme.secondaryText }]}>Số dư trong kỳ</Text>
            <Text style={[styles.balanceValue, { color: theme.text }]}>{balance.toLocaleString()}đ</Text>
          </View>
          <Wallet size={36} color={theme.tint} opacity={0.8} />
        </View>

        <View style={styles.summaryGrid}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => { setDetailsType('expense'); setDetailsVisible(true); }}
            style={[styles.summaryItem, { backgroundColor: theme.card, borderColor: '#EF4444' }]}
          >
            <View style={styles.iconTitleRow}>
              <ArrowDownCircle size={18} color="#EF4444" />
              <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Chi tiêu</Text>
            </View>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{totalExpense.toLocaleString()}đ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => { setDetailsType('income'); setDetailsVisible(true); }}
            style={[styles.summaryItem, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.iconTitleRow}>
              <ArrowUpCircle size={18} color="#10B981" />
              <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Thu nhập</Text>
            </View>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{totalIncome.toLocaleString()}đ</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Tình hình thu chi</Text>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth - 40}
              height={180}
              chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[0, 0]}
              absolute={false}
            />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={[styles.emptyText, { color: theme.text }]}>Chưa có giao dịch nào</Text>
              <Text style={{ color: theme.secondaryText, fontSize: 13, marginTop: 4 }}>Dữ liệu biểu đồ sẽ xuất hiện ở đây</Text>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      
      <Modal animationType="slide" transparent={true} visible={timePickerVisible} onRequestClose={() => setTimePickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.timeModalContent, { backgroundColor: theme.card }]}>

            <View style={styles.timeModalHeader}>
              <View style={{ width: 24 }} />
              <Text style={[styles.timeModalTitle, { color: theme.text }]}>Chọn thời gian hiển thị</Text>
              <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeTabsContainer}>
              {['week', 'month', 'year'].map(tabId => {
                const isSelected = tempRange === tabId;
                const labels: any = { week: 'Tuần', month: 'Tháng', year: 'Năm' };
                return (
                  <TouchableOpacity
                    key={tabId}
                    style={[styles.timeTabBtn, isSelected && { borderBottomColor: theme.tint, borderBottomWidth: 2 }]}
                    onPress={() => setTempRange(tabId)}
                  >
                    <Text style={[styles.timeTabText, { color: isSelected ? theme.tint : theme.secondaryText }]}>
                      {labels[tabId]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.timeGridWrapper}>
              {renderTimeGrid()}
            </View>

            <View style={styles.timeModalFooter}>
              <TouchableOpacity style={[styles.footerBtn, { backgroundColor: theme.background }]} onPress={clearTimeFilter}>
                <Text style={[styles.footerBtnText, { color: theme.secondaryText }]}>Xoá bộ lọc</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footerBtn, { backgroundColor: theme.tint }]} onPress={applyTimeFilter}>
                <Text style={[styles.footerBtnText, { color: '#fff' }]}>Áp dụng</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      
      <Modal animationType="slide" transparent={true} visible={detailsVisible} onRequestClose={() => setDetailsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {detailsType === 'income' ? 'Chi tiết Thu nhập' : 'Chi tiết Chi tiêu'}
              </Text>
              <TouchableOpacity onPress={() => setDetailsVisible(false)} style={styles.closeBtn}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {currentDetails.length > 0 ? (
                <>
                  
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <PieChart
                      data={detailsPieData}
                      width={screenWidth - 48}
                      height={160}
                      chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                      accessor="amount"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      center={[0, 0]}
                      absolute={false}
                    />
                  </View>

                  
                  {currentDetails.map((item, index) => (
                    <View key={index} style={[styles.detailRow, { borderBottomColor: theme.border }]}>

                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginRight: 10 }} />
                        <Text style={[styles.detailName, { color: theme.text }]}>{item.name}</Text>
                      </View>

                      <Text style={[styles.detailAmount, { color: detailsType === 'income' ? '#10B981' : '#EF4444' }]}>
                        {item.amount.toLocaleString()}đ
                      </Text>

                    </View>
                  ))}
                </>
              ) : (
                <View style={styles.emptyModalBox}>
                  <Text style={{ color: theme.secondaryText, fontSize: 15, textAlign: 'center' }}>
                    {detailsType === 'income' ? 'Bạn chưa có khoản thu nào.' : 'Bạn chưa có khoản chi nào.'}
                  </Text>
                </View>
              )}
            </ScrollView>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },

  topSelectorContainer: { alignItems: 'center', paddingVertical: 12 },
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 24, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05
  },
  datePillText: { fontSize: 15, fontWeight: 'bold' },

  balanceCard: {
    padding: 20, borderRadius: 20, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  balanceLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  balanceValue: { fontSize: 24, fontWeight: '800' },

  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryItem: {
    flex: 1, padding: 16, borderRadius: 20, borderWidth: 1.5,
  },
  iconTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryValue: { fontSize: 18, fontWeight: 'bold' },

  card: { padding: 20, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 10 },

  emptyBox: { height: 140, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  timeModalContent: { height: '65%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  timeModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  timeModalTitle: { fontSize: 18, fontWeight: 'bold' },

  timeTabsContainer: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 20 },
  timeTabBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  timeTabText: { fontSize: 16, fontWeight: '600' },

  timeGridWrapper: { flex: 1 },
  modalSubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
  modalSubHeaderText: { fontSize: 16, fontWeight: 'bold' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  gridItem: { width: '30%', paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  gridItemText: { fontSize: 14, fontWeight: '500' },

  weekListContainer: { paddingHorizontal: 10 },
  weekRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10 },
  weekLabelText: { fontSize: 15, fontWeight: '700', width: 90 },
  weekRangeText: { fontSize: 15 },

  timeModalFooter: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  footerBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  footerBtnText: { fontSize: 16, fontWeight: 'bold' },

  modalContent: { height: '70%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 8, backgroundColor: 'rgba(150,150,150,0.15)', borderRadius: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
  detailName: { fontSize: 16, fontWeight: '500' },
  detailAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyModalBox: { paddingVertical: 50, alignItems: 'center' },
});