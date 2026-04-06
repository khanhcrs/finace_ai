package com.finance.tracker.controller;

import com.finance.tracker.model.User;
import com.finance.tracker.model.Transaction;
import com.finance.tracker.model.Category;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;

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
    public ResponseEntity<?> process(
            @RequestParam(value = "text") String text, 
            @RequestParam(value = "userId", defaultValue = "1") Long userId) {
        
        try {
            List<Transaction> transactions = geminiService.processTransaction(text);

            if (transactions != null && !transactions.isEmpty()) {
                
                if (transactions.size() == 1 && transactions.get(0).getNote() != null && transactions.get(0).getNote().startsWith("ERROR|")) {
                    return ResponseEntity.ok(Map.of("mustConfirm", false, "reply", transactions.get(0).getNote().split("\\|")[1]));
                }

                User user = userRepository.findById(userId).orElse(null);
                Transaction anomalyTx = null;
                String anomalyReasonForChat = ""; // 🔥 Biến để lưu riêng cái lý do cho Chatbot
                
                StringBuilder replyMsg = new StringBuilder("✅ **Đã ghi chép:**\n");
                boolean hasNormalTx = false;

                for (Transaction transaction : transactions) {
                    String[] parts = transaction.getNote().split("\\|");
                    String categoryName = parts[0];
                    String realNote = parts.length > 1 ? parts[1] : categoryName;
                    
                    // 🔥 BÓC TÁCH LÝ DO "[...]" RA KHỎI NOTE ĐỂ KHÔNG LƯU VÀO DB
                    String reason = "";
                    int idx = realNote.lastIndexOf(" [");
                    if (idx != -1 && realNote.endsWith("]")) {
                        reason = realNote.substring(idx); // Lấy đoạn " [Số tiền cho một bữa ăn quá lớn.]"
                        realNote = realNote.substring(0, idx).trim(); // Gọt sạch note: chỉ còn "dẫn em ghệ đi ăn nhà hàng"
                    }
                    
                    Category category = categoryRepository.findAll().stream()
                            .filter(c -> c.getName().equalsIgnoreCase(categoryName))
                            .findFirst()
                            .orElseGet(() -> categoryRepository.findById(1L).orElse(null));

                    transaction.setCategory(category);
                    transaction.setNote(realNote); // Gán Note đã được GỌT SẠCH vào giao dịch
                    transaction.setUser(user);

                    if (transaction.getIsAnomaly() != null && transaction.getIsAnomaly()) {
                        if (anomalyTx == null) {
                            anomalyTx = transaction;
                            anomalyReasonForChat = reason; // Cất cái lý do để tí nữa hiện ở Chatbot
                        }
                    } else {
                        Transaction saved = transactionRepository.save(transaction);
                        String loai = saved.getType().equals("INCOME") ? "Thu" : "Chi";
                        String formattedAmount = new java.text.DecimalFormat("#,###").format(saved.getAmount()).replace(",", ".");
                        replyMsg.append(String.format("- %s: %sđ (%s)\n", loai, formattedAmount, saved.getNote()));
                        hasNormalTx = true;
                    }
                }

                if (anomalyTx != null) {
                    // 🔥 Lắp ráp câu cảnh báo: Note sạch + Lý do
                    String warnText = (hasNormalTx ? replyMsg.toString() + "\n" : "") + 
                                      "⚠️ **Tuy nhiên, phát hiện khoản chi tiêu lớn:** " + anomalyTx.getNote() + anomalyReasonForChat;
                    
                    // transaction trả về cho Frontend lúc này đã bị gọt sạch lý do
                    return ResponseEntity.ok(Map.of(
                        "mustConfirm", true,
                        "transaction", anomalyTx,
                        "reply", warnText 
                    ));
                }

                return ResponseEntity.ok(Map.of(
                    "mustConfirm", false, 
                    "reply", replyMsg.toString()
                ));
            }
            return ResponseEntity.badRequest().body(Map.of("reply", "AI không tìm thấy giao dịch nào hợp lệ trong câu của bạn."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("reply", "Lỗi Server: " + e.getMessage()));
        }
    }

    @PostMapping("/save-confirmed")
    public ResponseEntity<?> saveConfirmed(
            @RequestBody Transaction transaction, 
            @RequestParam("userId") Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            transaction.setUser(user);
            
            if (transaction.getCategory() != null && transaction.getCategory().getId() != null) {
                Category cat = categoryRepository.findById(transaction.getCategory().getId()).orElse(null);
                transaction.setCategory(cat);
            }
            
            Transaction saved = transactionRepository.save(transaction);
            return ResponseEntity.ok(Map.of("reply", "✅ Đã lưu giao dịch vào hệ thống!", "transaction", saved));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("reply", "Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/analyze")
    public String analyzeSpending(@RequestParam(value = "userId", defaultValue = "1") Long userId) {
        List<Transaction> userTransactions = transactionRepository.findAll().stream()
                .filter(t -> t.getUser() != null && t.getUser().getId().equals(userId))
                .toList();
        return geminiService.analyzeSpending(userTransactions);
    }

    @GetMapping("/ask")
    public ResponseEntity<?> askQuestion(@RequestParam("text") String text, @RequestParam(value = "userId", defaultValue = "1") Long userId) {
        List<Transaction> userTransactions = transactionRepository.findAll().stream()
                .filter(t -> t.getUser() != null && t.getUser().getId().equals(userId))
                .toList();

        StringBuilder history = new StringBuilder();
        for (Transaction t : userTransactions) {
            String loai = "INCOME".equalsIgnoreCase(t.getType()) ? "Thu" : "Chi";
            // 🔥 THÊM: Gửi kèm Tên Danh Mục để AI phân loại chính xác
            String categoryName = t.getCategory() != null ? t.getCategory().getName() : "Khác";
            history.append(String.format("- Ngày %s: %s %sđ cho %s (Danh mục: %s)\n", 
                t.getTransactionDate(), loai, t.getAmount(), t.getNote(), categoryName));
        }
        
        return ResponseEntity.ok(Map.of("reply", geminiService.answerQuestion(text, history.toString())));
    }
}