package com.finance.tracker.service;

import com.finance.tracker.model.Transaction;
import com.finance.tracker.model.User;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Transaction> getTransactionsByUser(Long userId) {
        return transactionRepository.findByUserIdOrderByTransactionDateDescCreatedAtDesc(userId);
    }

    @Autowired
    private com.finance.tracker.repository.CategoryRepository categoryRepository;

    public Transaction saveTransaction(Transaction transaction) {
        User user = null;
        if (transaction.getUser() != null && transaction.getUser().getId() != null) {
            user = userRepository.findById(transaction.getUser().getId()).orElse(null);
            transaction.setUser(user);
        }

        // Tự động phát hiện chi tiêu bất thường dựa trên DANH MỤC và THIẾT LẬP NGƯỜI DÙNG
        if (transaction.getAmount() != null && "EXPENSE".equalsIgnoreCase(transaction.getType()) && user != null) {
            double amt = transaction.getAmount().doubleValue();
            String catName = "";
            
            // Lấy tên danh mục để kiểm tra
            if (transaction.getCategory() != null && transaction.getCategory().getId() != null) {
                catName = categoryRepository.findById(transaction.getCategory().getId())
                            .map(c -> c.getName()).orElse("");
            }

            boolean isAnomaly = false;
            
            // Lấy ngưỡng từ User (nếu null thì dùng mặc định)
            double tEating = user.getThresholdEating() != null ? user.getThresholdEating() : 500000.0;
            double tShopping = user.getThresholdShopping() != null ? user.getThresholdShopping() : 5000000.0;
            double tTransport = user.getThresholdTransport() != null ? user.getThresholdTransport() : 2000000.0;
            double tOthers = user.getThresholdOthers() != null ? user.getThresholdOthers() : 1000000.0;

            if (catName.contains("Ăn uống") && amt >= tEating) {
                isAnomaly = true;
            } else if (catName.contains("Mua sắm") && amt >= tShopping) {
                isAnomaly = true;
            } else if (catName.contains("Di chuyển") || catName.contains("Đi lại") && amt >= tTransport) {
                isAnomaly = true;
            } else if (amt >= tOthers) {
                isAnomaly = true;
            }
            
            transaction.setIsAnomaly(isAnomaly);
        }

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