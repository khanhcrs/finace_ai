package com.finance.tracker.repository;

import com.finance.tracker.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    List<Transaction> findByUserIdOrderByTransactionDateDescCreatedAtDesc(Long userId);

    List<Transaction> findByUserIdAndTransactionDate(Long userId, LocalDate date);

    // Tính tổng số tiền theo loại (INCOME hoặc EXPENSE)
    @Query("SELECT SUM(t.amount) FROM Transaction t JOIN t.category c WHERE t.user.id = :userId AND c.type = :type")
    Double sumAmountByUserIdAndType(@Param("userId") Long userId, @Param("type") String type);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.category.id = :categoryId AND t.type = 'EXPENSE'")
    Double sumExpenseByUserIdAndCategoryId(@Param("userId") Long userId, @Param("categoryId") Long categoryId);

    // Thống kê số tiền chi tiêu theo từng danh mục (Để vẽ biểu đồ tròn)
    @Query("SELECT t.category.name as category, SUM(t.amount) as total FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.category.type = 'EXPENSE' " +
           "GROUP BY t.category.name")
    List<Map<String, Object>> sumAmountByCategory(@Param("userId") Long userId);
}