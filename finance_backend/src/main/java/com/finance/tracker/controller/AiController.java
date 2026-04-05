package com.finance.tracker.controller;

import com.finance.tracker.model.Transaction;
import com.finance.tracker.model.Category;
import com.finance.tracker.model.User;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class AiController {

    @Autowired
    private GeminiService geminiService;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/process")
    public ResponseEntity<?> process(@RequestParam String text, @RequestParam Long userId) {
        try {
            Map<String, Object> aiResult = geminiService.processTransaction(text);

            if (aiResult == null) {
                // Trả về thẳng câu chat báo lỗi thay vì sập server
                return ResponseEntity.status(500).body(Map.of("reply", "Lỗi: AI đang bận hoặc key hết hạn."));
            }

            Transaction transaction = (Transaction) aiResult.get("transaction");

            if (transaction != null) {
                // 1. KIỂM TRA USER CÓ TỒN TẠI KHÔNG (Chống lỗi 500)
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isEmpty()) {
                    return ResponseEntity.status(400).body(Map.of("reply",
                            "⚠️ Lỗi: Tài khoản không tồn tại trong DB. Bạn hãy Đăng xuất và Đăng nhập lại nhé!"));
                }
                User user = userOpt.get();
                transaction.setUser(user);

                // 2. An toàn phân tách chữ
                String[] parts = transaction.getNote().split("\\|");
                String categoryName = parts[0];
                String realNote = parts.length > 1 ? parts[1] : "Ghi chú từ AI";

                // 3. Tìm danh mục an toàn (chống lỗi NullPointerException)
                List<Category> userCategories = categoryRepository.findAll().stream()
                        .filter(c -> c.getUser() != null
                                && c.getUser().getId().equals(userId)
                                && c.getName().equalsIgnoreCase(categoryName))
                        .toList();

                Category category = userCategories.isEmpty() ? null : userCategories.get(0);
                transaction.setCategory(category);
                transaction.setNote(realNote);

                Transaction savedTx = transactionRepository.save(transaction);
                aiResult.put("transaction", savedTx);
            }

            return ResponseEntity.ok(aiResult);

        } catch (Exception e) {
            e.printStackTrace(); // In lỗi đỏ ra màn hình Terminal của Spring Boot
            return ResponseEntity.status(500).body(Map.of("reply", "❌ Lỗi Backend: " + e.getMessage()));
        }
    }
}