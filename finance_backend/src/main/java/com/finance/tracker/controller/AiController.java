package com.finance.tracker.controller;
import org.springframework.web.multipart.MultipartFile;
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
 
    @GetMapping("/analyze")
    public String analyzeSpending() {
       
        java.util.List<Transaction> allTransactions = transactionRepository.findAll();
        
       
        return geminiService.analyzeSpending(allTransactions);
    }
    @PostMapping(value = "/process-receipt", consumes = {"multipart/form-data"})
    public Transaction processReceipt(@RequestParam("file") MultipartFile file) {
        // 1. Chuyền file ảnh cho AI xử lý
        Transaction transaction = geminiService.processReceiptImage(file);
        
        if (transaction != null) {
            // 2. Tách tên Category AI tìm được
            String[] parts = transaction.getNote().split("\\|");
            String categoryName = parts[0];
            String realNote = parts.length > 1 ? parts[1] : "Hóa đơn từ ảnh";
            
            // 3. Khớp vào Database của bạn
            Category category = categoryRepository.findByName(categoryName)
                    .orElseGet(() -> categoryRepository.findById(1L).orElse(null));
            
            transaction.setCategory(category);
            transaction.setNote(realNote);
            
            // 4. Lưu xuống DB và trả về kết quả
            return transactionRepository.save(transaction);
        }
        return null;
    }
}