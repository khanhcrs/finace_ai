package com.finance.tracker.controller;

import com.finance.tracker.model.Transaction;
import com.finance.tracker.model.Category;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping("/process")
    public Transaction process(@RequestParam String text) {
        Transaction transaction = geminiService.processTransaction(text);
        
        if (transaction != null) {
            String[] parts = transaction.getNote().split("\\|");
            String categoryName = parts[0];
            String realNote = parts[1];
            
            // Khớp Category từ Database
            Category category = categoryRepository.findByName(categoryName)
                    .orElseGet(() -> categoryRepository.findById(1L).orElse(null));
            
            transaction.setCategory(category);
            transaction.setNote(realNote);
            
          
            return transactionRepository.save(transaction);
        }
        return null;
    }
}