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

    @Autowired
    private NotificationService notificationService;

    public Transaction saveTransaction(Transaction transaction) {
        User user = null;
        if (transaction.getUser() != null && transaction.getUser().getId() != null) {
            user = userRepository.findById(transaction.getUser().getId()).orElse(null);
            transaction.setUser(user);
        }

        if (transaction.getAmount() != null && "EXPENSE".equalsIgnoreCase(transaction.getType()) && user != null) {
            double amt = transaction.getAmount().doubleValue();
            String catName = "";
            Double catLimit = null;

            if (transaction.getCategory() != null && transaction.getCategory().getId() != null) {
                com.finance.tracker.model.Category dbCategory = categoryRepository
                        .findById(transaction.getCategory().getId()).orElse(null);
                if (dbCategory != null) {
                    catName = dbCategory.getName();
                    catLimit = dbCategory.getLimitAmount();
                }
            }

            boolean isAnomaly = false;
            String reason = "";

            if (catLimit != null && transaction.getCategory() != null && transaction.getCategory().getId() != null) {
                Double currentSpent = transactionRepository.sumExpenseByUserIdAndCategoryId(user.getId(),
                        transaction.getCategory().getId());
                double totalSpent = (currentSpent != null ? currentSpent : 0.0) + amt;

                if (totalSpent > catLimit) {
                    isAnomaly = true;
                    reason = "Danh mục " + catName + " đã vượt hạn mức " + String.format("%,.0f", catLimit) + "đ";
                }
            }

            transaction.setIsAnomaly(isAnomaly);

            if (isAnomaly) {
                String title = "Cảnh báo chi tiêu!";
                String body = "Bạn vừa ghi nhận khoản chi " + String.format("%,.0f", amt) + "đ. " + reason;
                notificationService.createNotification(user, title, body);
            }
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
            transaction.setType(newTransaction.getType());
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
                "balance", income - expense);
    }

    public List<Map<String, Object>> getStatistics(Long userId) {
        return transactionRepository.sumAmountByCategory(userId);
    }
}