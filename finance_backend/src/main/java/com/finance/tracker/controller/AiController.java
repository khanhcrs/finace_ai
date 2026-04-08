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

    @Autowired
    private NotificationService notificationService;

    // ==========================================
    // 1. XỬ LÝ TEXT CHAT (Gộp logic Bản 2 + Tự tạo danh mục Bản 1)
    // ==========================================
    @GetMapping("/process")
    public ResponseEntity<?> process(
            @RequestParam(value = "text") String text,
            @RequestParam(value = "userId", defaultValue = "1") Long userId) {

        try {
            List<Transaction> transactions = geminiService.processTransaction(text);

            if (transactions != null && !transactions.isEmpty()) {

                if (transactions.size() == 1 && transactions.get(0).getNote() != null
                        && transactions.get(0).getNote().startsWith("ERROR|")) {
                    return ResponseEntity
                            .ok(Map.of("mustConfirm", false, "reply", transactions.get(0).getNote().split("\\|")[1]));
                }

                User user = userRepository.findById(userId).orElse(null);
                Transaction anomalyTx = null;
                String anomalyReasonForChat = "";

                StringBuilder replyMsg = new StringBuilder("✅ **Đã ghi chép:**\n");
                boolean hasNormalTx = false;

                for (Transaction transaction : transactions) {
                    String[] parts = transaction.getNote().split("\\|");
                    String categoryName = parts[0].trim();
                    String realNote = parts.length > 1 ? parts[1].trim() : categoryName;

                    // BÓC TÁCH LÝ DO BẤT THƯỜNG (Từ Bản 2)
                    String reason = "";
                    int idx = realNote.lastIndexOf(" [");
                    if (idx != -1 && realNote.endsWith("]")) {
                        reason = realNote.substring(idx);
                        realNote = realNote.substring(0, idx).trim();
                    }

                    // 🔥 TỰ ĐỘNG TẠO DANH MỤC NẾU CHƯA CÓ (Từ Bản 1)
                    Category category = null;
                    if (user != null) {
                        List<Category> userCategories = categoryRepository.findByUserId(userId);
                        category = userCategories.stream()
                                .filter(c -> c.getName().equalsIgnoreCase(categoryName))
                                .findFirst()
                                .orElse(null);

                        if (category == null && !categoryName.isEmpty()) {
                            category = new Category();
                            category.setName(categoryName);
                            category.setType(transaction.getType() != null ? transaction.getType() : "EXPENSE");
                            category.setUser(user);
                            category.setIcon("ShoppingBag");
                            category = categoryRepository.save(category);
                        }
                    }

                    // Fallback an toàn
                    if (category == null) {
                        category = categoryRepository.findByName(categoryName)
                                .orElseGet(() -> categoryRepository.findById(1L).orElse(null));
                    }

                    transaction.setCategory(category);
                    transaction.setNote(realNote);
                    transaction.setUser(user);

                    if (transaction.getIsAnomaly() != null && transaction.getIsAnomaly()) {
                        if (anomalyTx == null) {
                            anomalyTx = transaction;
                            anomalyReasonForChat = reason;
                        }
                    } else {
                        // Bỏ qua nếu số tiền = 0 (Từ Bản 1)
                        if (transaction.getAmount() == null
                                || transaction.getAmount().compareTo(BigDecimal.ZERO) == 0) {
                            continue;
                        }

                        Transaction saved = transactionRepository.save(transaction);
                        String loai = saved.getType().equals("INCOME") ? "Thu" : "Chi";
                        String formattedAmount = new java.text.DecimalFormat("#,###").format(saved.getAmount())
                                .replace(",", ".");
                        replyMsg.append(String.format("- %s: %sđ (%s)\n", loai, formattedAmount, saved.getNote()));
                        hasNormalTx = true;
                    }
                }

                if (anomalyTx != null) {
                    String warnText = (hasNormalTx ? replyMsg.toString() + "\n" : "") +
                            "⚠️ **Tuy nhiên, phát hiện khoản chi tiêu lớn:** " + anomalyTx.getNote()
                            + anomalyReasonForChat;

                    return ResponseEntity.ok(Map.of(
                            "mustConfirm", true,
                            "transaction", anomalyTx,
                            "reply", warnText));
                }

                if (!hasNormalTx) {
                    return ResponseEntity.ok(Map.of("mustConfirm", false, "reply",
                            "Đã nhận thông tin, nhưng không có khoản tiền hợp lệ nào để lưu."));
                }

                return ResponseEntity.ok(Map.of(
                        "mustConfirm", false,
                        "reply", replyMsg.toString()));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("reply", "AI không tìm thấy giao dịch nào hợp lệ trong câu của bạn."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("reply", "Lỗi Server: " + e.getMessage()));
        }
    }

    // ==========================================
    // 2. LƯU GIAO DỊCH BẤT THƯỜNG ĐÃ XÁC NHẬN (Từ Bản 2)
    // ==========================================
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

            // Bổ sung: Tạo thông báo khi lưu giao dịch bất thường từ AI
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
    // 3. XỬ LÝ HÓA ĐƠN BẰNG HÌNH ẢNH (Từ Bản 1, trả về dạng ResponseEntity cho đồng
    // nhất)
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
                    category = userCategories.stream()
                            .filter(c -> c.getName().equalsIgnoreCase(categoryName))
                            .findFirst()
                            .orElse(null);

                    // 🔥 TỰ TẠO DANH MỤC TỪ HÓA ĐƠN
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
                    category = categoryRepository.findByName(categoryName)
                            .orElseGet(() -> categoryRepository.findById(1L).orElse(null));
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

    // ==========================================
    // 4. PHÂN TÍCH CHI TIÊU & HỎI ĐÁP (Từ Bản 2)
    // ==========================================
    @GetMapping("/analyze")
    public String analyzeSpending(@RequestParam(value = "userId", defaultValue = "1") Long userId) {
        List<Transaction> userTransactions = transactionRepository.findAll().stream()
                .filter(t -> t.getUser() != null && t.getUser().getId().equals(userId))
                .toList();
        return geminiService.analyzeSpending(userTransactions);
    }

    @GetMapping("/ask")
    public ResponseEntity<?> askQuestion(@RequestParam("text") String text,
            @RequestParam(value = "userId", defaultValue = "1") Long userId) {
        List<Transaction> userTransactions = transactionRepository.findAll().stream()
                .filter(t -> t.getUser() != null && t.getUser().getId().equals(userId))
                .toList();

        StringBuilder history = new StringBuilder();
        for (Transaction t : userTransactions) {
            String loai = "INCOME".equalsIgnoreCase(t.getType()) ? "Thu" : "Chi";
            String categoryName = t.getCategory() != null ? t.getCategory().getName() : "Khác";
            history.append(String.format("- Ngày %s: %s %sđ cho %s (Danh mục: %s)\n",
                    t.getTransactionDate(), loai, t.getAmount(), t.getNote(), categoryName));
        }

        return ResponseEntity.ok(Map.of("reply", geminiService.answerQuestion(text, history.toString())));
    }
}
