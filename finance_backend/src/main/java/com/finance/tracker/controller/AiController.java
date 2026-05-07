package com.finance.tracker.controller;

import org.springframework.web.multipart.MultipartFile;
import com.finance.tracker.model.User;
import com.finance.tracker.model.Transaction;
import com.finance.tracker.model.Category;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.service.GeminiService;
import com.finance.tracker.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*") // Đã mở cho mọi frontend
public class AiController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    // ==========================================
    // 1. XỬ LÝ CHAT TỔNG HỢP (THÊM GIAO DỊCH & HỎI ĐÁP)
    // ==========================================
    @GetMapping("/process")
    public ResponseEntity<?> process(
            @RequestParam(value = "text") String text,
            @RequestParam(value = "userId", defaultValue = "1") Long userId) {

        try {
            // Lấy lịch sử giao dịch cung cấp cho AI
            List<Transaction> userHistory = transactionRepository.findAll().stream()
                    .filter(t -> t.getUser() != null && t.getUser().getId().equals(userId))
                    .toList();

            List<Transaction> transactions = geminiService.processChat(text, userHistory);

            if (transactions != null && !transactions.isEmpty()) {

                // Xử lý Lỗi API (hết hạn mức, quá tải)
                if (transactions.size() == 1 && transactions.get(0).getNote() != null && transactions.get(0).getNote().startsWith("ERROR|")) {
                    return ResponseEntity.ok(Map.of("mustConfirm", false, "reply", transactions.get(0).getNote().split("\\|")[1]));
                }

                // 🌟 BẮT LUỒNG TÂM SỰ / PHÂN TÍCH (Không lưu vào DB)
                if (transactions.size() == 1 && "CHAT".equals(transactions.get(0).getType())) {
                    String noteContent = transactions.get(0).getNote();
                    String aiReply = noteContent.startsWith("CHAT|") ? noteContent.substring(5).trim() : noteContent;
                    return ResponseEntity.ok(Map.of("mustConfirm", false, "saved", false, "reply", aiReply));
                }

                // 🌟 BẮT LUỒNG GHI CHÉP GIAO DỊCH
                User user = userRepository.findById(userId).orElse(null);
                Transaction anomalyTx = null;
                String anomalyReasonForChat = "";
                StringBuilder replyMsg = new StringBuilder("✅ **Đã ghi chép:**\n");
                boolean hasNormalTx = false;

                for (Transaction transaction : transactions) {
                    if (transaction.getAmount() == null || transaction.getAmount().compareTo(BigDecimal.ZERO) == 0) continue;

                    String[] parts = transaction.getNote().split("\\|");
                    String categoryName = parts[0].trim();
                    String realNote = parts.length > 1 ? parts[1].trim() : categoryName;
                    String botMessage = "";
                    int botIdx = realNote.indexOf(" _BOTMSG_");
                    if (botIdx != -1) {
                        botMessage = realNote.substring(botIdx + 9).trim();
                        realNote = realNote.substring(0, botIdx).trim();
                    }
                    // Bóc lý do bất thường
                    String reason = "";
                    int idx = realNote.indexOf(" _REASON_");
                    if (idx != -1) {
                        reason = realNote.substring(idx + 9).trim(); 
                        realNote = realNote.substring(0, idx).trim();
                    }

                    // Tìm hoặc Tạo mới danh mục
                    Category category = null;
                    if (user != null) {
                        List<Category> userCategories = categoryRepository.findByUserId(userId);
                        category = userCategories.stream().filter(c -> c.getName().equalsIgnoreCase(categoryName)).findFirst().orElse(null);
                        if (category == null && !categoryName.isEmpty()) {
                            category = new Category();
                            category.setName(categoryName);
                            category.setType(transaction.getType() != null ? transaction.getType() : "EXPENSE");
                            category.setUser(user);
                            category.setIcon("ShoppingBag");
                            category = categoryRepository.save(category);
                        }
                    }
                    if (category == null) {
                        category = categoryRepository.findByName(categoryName).orElseGet(() -> categoryRepository.findById(1L).orElse(null));
                    }

                    transaction.setCategory(category);
                    transaction.setNote(realNote);
                    transaction.setUser(user);

                    // Xử lý báo cáo bất thường
                    if (transaction.getIsAnomaly() != null && transaction.getIsAnomaly()) {
                        if (anomalyTx == null) {
                            anomalyTx = transaction;
                            anomalyReasonForChat = reason;
                        }
                   } else {
                        Transaction saved = transactionRepository.save(transaction);
                        String loai = saved.getType().equals("INCOME") ? "Thu" : "Chi";
                        String formattedAmount = new java.text.DecimalFormat("#,###").format(saved.getAmount()).replace(",", ".");
                        
                        if (!botMessage.isEmpty() && !replyMsg.toString().contains(botMessage)) {
                            replyMsg.insert(0, "💬 " + botMessage + "\n\n");
                        }
                        
                        replyMsg.append(String.format("- %s: %sđ (%s)\n", loai, formattedAmount, saved.getNote()));
                        hasNormalTx = true;
                    }
                }

                if (anomalyTx != null) {
                    String warnText = (anomalyReasonForChat != null && !anomalyReasonForChat.isEmpty()) 
                                      ? "🤔 " + anomalyReasonForChat 
                                      : "⚠️ Khoản chi này có vẻ hơi lớn. Bạn có gõ nhầm số không?";
                                      
                    return ResponseEntity.ok(Map.of("mustConfirm", true, "transaction", anomalyTx, "reply", warnText));
                }

                if (!hasNormalTx) {
                    return ResponseEntity.ok(Map.of("mustConfirm", false, "reply", "Đã hiểu ý bạn nhưng không có khoản tiền hợp lệ nào để lưu."));
                }

                return ResponseEntity.ok(Map.of("mustConfirm", false, "saved", true, "reply", replyMsg.toString()));
            }
            return ResponseEntity.badRequest().body(Map.of("reply", "AI không tìm thấy thông tin hợp lệ. Bạn hãy thử nói rõ hơn nhé."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("reply", "Lỗi Server: " + e.getMessage()));
        }
    }

    // ==========================================
    // 2. LƯU GIAO DỊCH ĐÃ XÁC NHẬN (CẢNH BÁO AI)
    // ==========================================
    @PostMapping("/save-confirmed")
    public ResponseEntity<?> saveConfirmed(@RequestBody Transaction transaction, @RequestParam("userId") Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            transaction.setUser(user);

            if (transaction.getCategory() != null && transaction.getCategory().getId() != null) {
                Category cat = categoryRepository.findById(transaction.getCategory().getId()).orElse(null);
                transaction.setCategory(cat);
            }

            Transaction saved = transactionRepository.save(transaction);

            if (Boolean.TRUE.equals(saved.getIsAnomaly()) && saved.getUser() != null) {
                notificationService.createNotification(
                        saved.getUser(),
                        "Cảnh báo chi tiêu (AI)!",
                        "Khoản chi '" + saved.getNote() + "' trị giá " + saved.getAmount() + "đ của bạn có vẻ cao bất thường!");
            }

            return ResponseEntity.ok(Map.of("reply", "✅ Đã lưu giao dịch vào hệ thống!", "transaction", saved));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("reply", "Lỗi: " + e.getMessage()));
        }
    }

    // ==========================================
    // 3. XỬ LÝ HÓA ĐƠN BẰNG HÌNH ẢNH
    // ==========================================
    @PostMapping(value = "/process-receipt", consumes = { "multipart/form-data" })
    public ResponseEntity<?> processReceipt(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false, defaultValue = "1") Long userId) {

        try {
            Transaction transaction = geminiService.processReceiptImage(file);
            if (transaction != null) {
                String[] parts = transaction.getNote().split("\\|");
                String categoryName = parts[0].trim();
                String realNote = parts.length > 1 ? parts[1].trim() : "Hóa đơn từ ảnh";

                User user = userRepository.findById(userId).orElse(null);
                transaction.setUser(user);

                Category category = null;
                if (user != null) {
                    List<Category> userCategories = categoryRepository.findByUserId(userId);
                    category = userCategories.stream().filter(c -> c.getName().equalsIgnoreCase(categoryName)).findFirst().orElse(null);
                    if (category == null && !categoryName.isEmpty()) {
                        category = new Category();
                        category.setName(categoryName);
                        category.setType(transaction.getType() != null ? transaction.getType() : "EXPENSE");
                        category.setUser(user);
                        category.setIcon("ShoppingBag");
                        category = categoryRepository.save(category);
                    }
                }
                if (category == null) {
                    category = categoryRepository.findByName(categoryName).orElseGet(() -> categoryRepository.findById(1L).orElse(null));
                }

                transaction.setCategory(category);
                transaction.setNote(realNote);

                Transaction savedTx = transactionRepository.save(transaction);
                return ResponseEntity.ok(savedTx);
            }
            return ResponseEntity.badRequest().body("Không thể đọc được thông tin từ ảnh.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Lỗi hệ thống: " + e.getMessage());
        }
    }
}