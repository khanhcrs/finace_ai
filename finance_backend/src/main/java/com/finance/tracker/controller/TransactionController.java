package com.finance.tracker.controller;

import com.finance.tracker.model.Transaction;
import com.finance.tracker.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:5173")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @GetMapping("/user/{userId}")
    public List<Transaction> getByUser(@PathVariable Long userId) {
        return transactionService.getTransactionsByUser(userId);
    }

    @PostMapping
    public Transaction create(@RequestBody Transaction transaction) {
        return transactionService.saveTransaction(transaction);
    }

    @PutMapping("/{id}")
    public Transaction update(@PathVariable Long id, @RequestBody Transaction transaction) {
        return transactionService.updateTransaction(id, transaction);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
    }

    @GetMapping("/user/{userId}/summary")
    public Map<String, Double> getSummary(@PathVariable Long userId) {
        return transactionService.getBalanceSummary(userId);
    }

    @GetMapping("/user/{userId}/stats")
    public List<Map<String, Object>> getStats(@PathVariable Long userId) {
        return transactionService.getStatistics(userId);
    }
}