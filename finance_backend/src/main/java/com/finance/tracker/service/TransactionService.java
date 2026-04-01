package com.finance.tracker.service;

import com.finance.tracker.model.Transaction;
import com.finance.tracker.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    public List<Transaction> getTransactionsByUser(Long userId) {
        return transactionRepository.findByUserId(userId);
    }

    public Transaction saveTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }
    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }

    public Transaction updateTransaction(Long id, Transaction newTransaction) {
        return transactionRepository.findById(id).map(transaction -> {
            transaction.setAmount(newTransaction.getAmount());
            transaction.setNote(newTransaction.getNote());
            transaction.setTransactionDate(newTransaction.getTransactionDate());
            transaction.setCategory(newTransaction.getCategory());
            return transactionRepository.save(transaction);
        }).orElse(null);
    }
    public Map<String, Double> getBalanceSummary(Long userId) {
        Double income = transactionRepository.sumAmountByUserIdAndType(userId, "INCOME");
        Double expense = transactionRepository.sumAmountByUserIdAndType(userId, "EXPENSE");
        
        income = (income != null) ? income : 0.0;
        expense = (expense != null) ? expense : 0.0;

        return Map.of(
            "totalIncome", income,
            "totalExpense", expense,
            "balance", income - expense
        );
    }

    public List<Map<String, Object>> getStatistics(Long userId) {
        return transactionRepository.sumAmountByCategory(userId);
    }
}