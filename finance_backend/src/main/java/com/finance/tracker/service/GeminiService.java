package com.finance.tracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.tracker.model.Transaction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.multipart.MultipartFile;
import java.util.Base64;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.List;
import java.util.Locale;
import java.util.ArrayList;
import java.util.Locale;
import java.util.HashMap;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final WebClient webClient;

    @Autowired
    private ObjectMapper objectMapper;

    public GeminiService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    private String extractJson(String rawText) {
        if (rawText == null)
            return "{}";
        String clean = rawText.trim();
        if (clean.contains("{") && clean.contains("}")) {
            return clean.substring(clean.indexOf("{"), clean.lastIndexOf("}") + 1);
        }
        return clean;
    }

    private String extractJsonArray(String rawText) {
        if (rawText == null)
            return "[]";
        String clean = rawText.trim();
        if (clean.contains("[") && clean.contains("]")) {
            return clean.substring(clean.indexOf("["), clean.lastIndexOf("]") + 1);
        }
        if (clean.contains("{") && clean.contains("}")) {
            return "[" + clean.substring(clean.indexOf("{"), clean.lastIndexOf("}") + 1) + "]";
        }
        return "[]";
    }

    private String findCategoryLimitExceededReason(List<Transaction> history, String categoryName, BigDecimal newAmount,
            String type) {
        if (history == null || history.isEmpty() || categoryName == null || categoryName.isBlank())
            return null;
        if (!"EXPENSE".equalsIgnoreCase(type) || newAmount == null || newAmount.compareTo(BigDecimal.ZERO) <= 0)
            return null;

        BigDecimal currentSpent = BigDecimal.ZERO;
        Double categoryLimit = null;
        String normalizedName = categoryName.trim().toLowerCase(Locale.ROOT);

        for (Transaction tx : history) {
            if (tx.getCategory() == null || tx.getAmount() == null || tx.getType() == null)
                continue;
            String txCategoryName = tx.getCategory().getName();
            if (txCategoryName == null || !normalizedName.equals(txCategoryName.trim().toLowerCase(Locale.ROOT)))
                continue;
            if (!"EXPENSE".equalsIgnoreCase(tx.getType()))
                continue;

            currentSpent = currentSpent.add(tx.getAmount());
            if (categoryLimit == null) {
                categoryLimit = tx.getCategory().getLimitAmount();
            }
        }

        if (categoryLimit == null || categoryLimit <= 0)
            return null;

        BigDecimal totalSpent = currentSpent.add(newAmount);
        BigDecimal limit = BigDecimal.valueOf(categoryLimit);

        if (totalSpent.compareTo(limit) > 0) {
            String limitStr = String.format("%,.0f", categoryLimit).replace(",", ".");
            String totalStr = String.format("%,.0f", totalSpent.doubleValue()).replace(",", ".");
            return "Danh mục " + categoryName + " đã vượt hạn mức " + limitStr + "đ (tổng hiện tại: " + totalStr
                    + "đ). Bạn có muốn tiếp tục lưu không?";
        }
        return null;
    }

    public List<Transaction> processChat(String userInput, List<Transaction> history) {
        String today = LocalDate.now().toString();
        String currentMonth = today.substring(0, 7);
        java.text.DecimalFormat df = new java.text.DecimalFormat("#,###");

        Map<String, Double> categoryLimits = new java.util.HashMap<>();
        Map<String, Double> categorySpent = new java.util.HashMap<>();
        StringBuilder historyStr = new StringBuilder();

        if (history != null && !history.isEmpty()) {
            historyStr.append("LỊCH SỬ GIAO DỊCH CỦA NGƯỜI DÙNG:\n");
            for (Transaction t : history) {
                String loai = "INCOME".equalsIgnoreCase(t.getType()) ? "Thu" : "Chi";
                String cat = t.getCategory() != null ? t.getCategory().getName() : "Khác";
                String formattedAmount = df.format(t.getAmount()).replace(",", ".");

                historyStr.append(String.format("- Ngày %s: %s %sđ (%s) - Ghi chú: %s\n",
                        t.getTransactionDate(), loai, formattedAmount, cat, t.getNote()));

                if (t.getTransactionDate() != null && t.getTransactionDate().toString().startsWith(currentMonth)) {
                    if ("EXPENSE".equalsIgnoreCase(t.getType()) && t.getCategory() != null) {
                        double amount = t.getAmount() != null ? t.getAmount().doubleValue() : 0.0;
                        categorySpent.put(cat, categorySpent.getOrDefault(cat, 0.0) + amount);

                        Double limit = t.getCategory().getLimitAmount();
                        if (limit != null && limit > 0) {
                            categoryLimits.put(cat, limit);
                        }
                    }
                }
            }
        } else {
            historyStr.append("Người dùng chưa có giao dịch nào.\n");
        }

        StringBuilder budgetStr = new StringBuilder();
        budgetStr.append("THÔNG TIN HẠN MỨC (BUDGET) TRONG THÁNG ").append(currentMonth).append(":\n");
        if (categoryLimits.isEmpty()) {
            budgetStr.append("- Người dùng chưa thiết lập hạn mức nào.\n");
        } else {
            for (String cat : categoryLimits.keySet()) {
                double limit = categoryLimits.get(cat);
                double spent = categorySpent.getOrDefault(cat, 0.0);
                double remain = limit - spent;
                budgetStr.append(String.format("- Danh mục '%s': Hạn mức %sđ, Đã chi %sđ, Còn lại %sđ.\n",
                        cat, df.format(limit).replace(",", "."), df.format(spent).replace(",", "."),
                        df.format(remain).replace(",", ".")));
            }
        }

        String promptText = "Bạn là chuyên gia tài chính kiêm một người bạn thân thiết. Bạn PHẢI CHỈ TRẢ VỀ JSON ARRAY `[]`.\n\n"
                + "👉 TRƯỜNG HỢP 1: Ghi chép chi tiêu/thu nhập/SỰ CỐ MẤT TIỀN (VD: 'ăn phở 50k', 'nhận lương', 'rớt 500k', 'bị lừa')\n"
                + "Trả về JSON: [{\"amount\": số_tiền, \"date\": \"YYYY-MM-DD\", \"note\": \"nội dung\", \"type\": \"INCOME\" hoặc \"EXPENSE\", \"categoryName\": \"Danh mục\", \"isAnomaly\": true/false, \"anomalyReason\": \"lời trêu chọc/cảnh báo\", \"botMessage\": \"lời nhắn gửi\"}]\n"
                + "- Luật: '50k' tự hiểu là 50000. \n"
                + "- NẾU KHOẢN CHI LÀM VƯỢT HẠN MỨC HOẶC GẦN HẾT HẠN MỨC (Dựa vào THÔNG TIN HẠN MỨC bên dưới): BẮT BUỘC isAnomaly = true. Hãy phân tích toán học và viết lời cảnh báo sắc bén vào `anomalyReason`.\n"
                + "- NẾU MẤT TIỀN, RỚT TIỀN: isAnomaly = false để lưu luôn. Viết lời an ủi sâu sắc vào `botMessage`.\n"
                + "- NẾU CHI TIÊU VÔ LÝ (ăn phở 500k): isAnomaly = true. Viết câu trêu chọc vào `anomalyReason`.\n\n"
                + "👉 TRƯỜNG HỢP 2: Hỏi đáp, nhờ phân tích, báo cáo hoặc tâm sự...\n"
                + "Trả về JSON Array ĐẶC BIỆT: [{\"amount\": 0, \"date\": \"" + today
                + "\", \"note\": \"<VIẾT CÂU TRẢ LỜI>. Tuyệt đối không dùng phần thập phân khi viết số tiền (VD: 600.000đ).\", \"type\": \"CHAT\", \"categoryName\": \"CHAT\", \"isAnomaly\": false, \"botMessage\": \"\"}]\n\n"
                + budgetStr.toString() + "\n\n"
                + historyStr.toString() + "\n\n"
                + "Hôm nay là: " + today + "\nCâu của người dùng: '" + userInput + "'";

        Map<String, Object> body = Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", promptText)))));

        try {
            String response = webClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-2.5-flash:generateContent")
                            .queryParam("key", apiKey).build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve().bodyToMono(String.class).block();

            JsonNode root = objectMapper.readTree(response);
            JsonNode candidate = root.path("candidates").get(0);

            if (candidate.has("finishReason") && candidate.get("finishReason").asText().equals("SAFETY")) {
                Transaction errorTx = new Transaction();
                errorTx.setNote("ERROR|Nội dung này bị bộ lọc an toàn từ chối.");
                errorTx.setAmount(BigDecimal.ZERO);
                return List.of(errorTx);
            }

            String rawText = candidate.path("content").path("parts").get(0).path("text").asText();
            JsonNode dataArray = objectMapper.readTree(extractJsonArray(rawText));
            List<Transaction> transactions = new ArrayList<>();

            for (JsonNode data : dataArray) {
                Transaction transaction = new Transaction();
                String amtStr = data.path("amount").asText("0").replaceAll("[^0-9]", "");
                transaction.setAmount(new BigDecimal(amtStr.isEmpty() ? "0" : amtStr));

                String type = data.path("type").asText("EXPENSE");
                if (transaction.getAmount().compareTo(BigDecimal.ZERO) == 0 && !type.equals("CHAT"))
                    continue;

                transaction.setType(type);

                LocalDate txDate = LocalDate.now();
                if (data.has("date") && !data.get("date").isNull()) {
                    try {
                        txDate = LocalDate.parse(data.get("date").asText().trim());
                    } catch (Exception ex) {
                    }
                }
                transaction.setTransactionDate(txDate);
                transaction.setIsAnomaly(data.path("isAnomaly").asBoolean(false));

                String reason = "";
                if (data.has("anomalyReason") && !data.get("anomalyReason").isNull()) {
                    String reasonStr = data.get("anomalyReason").asText().trim();
                    if (!reasonStr.isEmpty() && !reasonStr.equalsIgnoreCase("null")
                            && !reasonStr.equalsIgnoreCase("false")) {
                        reason = " _REASON_" + reasonStr;
                    }
                }

                if (data.has("botMessage") && !data.get("botMessage").isNull()) {
                    String botStr = data.get("botMessage").asText().trim();
                    if (!botStr.isEmpty() && !botStr.equalsIgnoreCase("null")) {
                        reason = reason + " _BOTMSG_" + botStr;
                    }
                }

                transaction.setNote(
                        data.path("categoryName").asText("Khác") + "|" + data.path("note").asText("") + reason);


                transactions.add(transaction);
            }
            return transactions;

        } catch (WebClientResponseException e) {
            Transaction errorTx = new Transaction();
            int statusCode = e.getStatusCode().value();
            if (statusCode == 429)
                errorTx.setNote("ERROR|AI đang nghỉ giải lao (Hết hạn mức). Bạn đợi 1 phút nhé!");
            else if (statusCode == 503)
                errorTx.setNote("ERROR|Máy chủ Google đang quá tải. Bạn bấm gửi lại lần nữa nhé!");
            else
                errorTx.setNote("ERROR|Lỗi kết nối API: " + statusCode);
            return List.of(errorTx);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Transaction processReceiptImage(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(bytes);
            String mimeType = file.getContentType();
            if (mimeType == null)
                mimeType = "image/jpeg";

            String promptText = "Bạn là một kế toán viên xuất sắc. Hãy đọc hóa đơn trong bức ảnh này. " +
                    "Trả về JSON: {\"amount\": số tiền tổng cộng, \"note\": \"Tên cửa hàng hoặc tóm tắt món đồ\", \"type\": \"EXPENSE\", \"categoryName\": \"tên nhóm\", \"isAnomaly\": false}. "
                    +
                    "Quy tắc categoryName CHỈ CHỌN: 'Ăn uống', 'Tiền lương', 'Mua sắm', 'Di chuyển', 'Khác'. " +
                    "Chỉ trả về ĐÚNG định dạng JSON, tuyệt đối không có markdown (```json).";

            Map<String, Object> inlineData = Map.of("mime_type", mimeType, "data", base64Image);
            Map<String, Object> imagePart = Map.of("inline_data", inlineData);
            Map<String, Object> textPart = Map.of("text", promptText);
            Map<String, Object> body = Map.of("contents", List.of(Map.of("parts", List.of(textPart, imagePart))));

            String response = webClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-2.5-flash:generateContent")
                            .queryParam("key", apiKey).build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve().bodyToMono(String.class).block();

            JsonNode root = objectMapper.readTree(response);
            String rawText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            JsonNode data = objectMapper.readTree(extractJson(rawText));

            Transaction transaction = new Transaction();
            String amtStr = data.path("amount").asText("0").replaceAll("[^0-9]", "");
            transaction.setAmount(new BigDecimal(amtStr.isEmpty() ? "0" : amtStr));
            transaction.setType(data.path("type").asText("EXPENSE"));
            transaction.setTransactionDate(LocalDate.now());
            transaction.setIsAnomaly(data.path("isAnomaly").asBoolean(false));
            transaction
                    .setNote(data.path("categoryName").asText("Khác") + "|" + data.path("note").asText("Hóa đơn ảnh"));

            return transaction;
        } catch (Exception e) {
            System.err.println("❌ Lỗi đọc ảnh AI: " + e.getMessage());
            return null;
        }
    }

    public String transcribeAudio(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            String base64Audio = Base64.getEncoder().encodeToString(bytes);
            String mimeType = file.getContentType();

            if (mimeType == null || !mimeType.startsWith("audio/")) {
                mimeType = "audio/mp4";
            }

            String promptText = "Bạn là một trợ lý nhận diện giọng nói. Hãy nghe đoạn âm thanh này và chuyển nó thành văn bản tiếng Việt một cách chính xác nhất. CHỈ TRẢ VỀ ĐOẠN VĂN BẢN ĐÓ, tuyệt đối không thêm lời chào, không giải thích, không dùng ngoặc kép.";

            Map<String, Object> inlineData = Map.of("mime_type", mimeType, "data", base64Audio);
            Map<String, Object> audioPart = Map.of("inline_data", inlineData);
            Map<String, Object> textPart = Map.of("text", promptText);
            Map<String, Object> body = Map.of("contents", List.of(Map.of("parts", List.of(textPart, audioPart))));

            String response = webClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-2.5-flash:generateContent")
                            .queryParam("key", apiKey).build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve().bodyToMono(String.class).block();

            JsonNode root = objectMapper.readTree(response);
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText().trim();
        } catch (Exception e) {
            System.err.println("❌ Lỗi nhận diện giọng nói AI: " + e.getMessage());
            return null;
        }
    }

}