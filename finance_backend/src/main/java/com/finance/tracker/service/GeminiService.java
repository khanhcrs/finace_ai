package com.finance.tracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.tracker.model.Transaction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.multipart.MultipartFile;
import java.util.Base64;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.List;

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

    public Transaction processTransaction(String userInput) {
        String promptText = "Phân tích câu: '" + userInput + "'. " +
                            "Trả về JSON: {\"amount\": số, \"note\": \"nội dung\", \"type\": \"INCOME\" hoặc \"EXPENSE\", \"categoryName\": \"tên nhóm\", \"isAnomaly\": true/false}. " +
                            "Quy tắc số tiền: Tự quy đổi 'k' thành hàng nghìn, 'triệu' thành hàng triệu (Ví dụ: 45k -> 45000). " +
                            "Quy tắc categoryName CHỈ CHỌN: 'Ăn uống', 'Tiền lương', 'Mua tài liệu', 'Tiền tiêu vặt', 'Khác'. " +
                            "Quy tắc isAnomaly (Phát hiện bất thường): Đánh giá tính hợp lý của số tiền so với mục đích chi tiêu. Nếu số tiền chi tiêu lớn một cách vô lý hoặc bất thường (ví dụ: ăn sáng/ăn uống tốn hơn 2 triệu, mua tài liệu tốn hàng chục triệu...), hãy đặt isAnomaly là true. Ngược lại là false.";

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", promptText))))
        );

        try {
            String response = webClient.post()
                .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-2.5-flash:generateContent").queryParam("key", apiKey).build())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode root = objectMapper.readTree(response);
            String rawText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            String cleanJson = rawText.replace("```json", "").replace("```", "").trim();
            JsonNode data = objectMapper.readTree(cleanJson);
            
            Transaction transaction = new Transaction();
            transaction.setAmount(new BigDecimal(data.path("amount").asText()));
            transaction.setType(data.path("type").asText());
            transaction.setTransactionDate(LocalDate.now());
            
            
            if (data.has("isAnomaly")) {
                transaction.setIsAnomaly(data.path("isAnomaly").asBoolean());
            } else {
                transaction.setIsAnomaly(false);
            }
            
            transaction.setNote(data.path("categoryName").asText() + "|" + data.path("note").asText());

            return transaction;
        } catch (Exception e) {
            return null;
        }
    }
    
    public String analyzeSpending(List<Transaction> transactions) {
        if (transactions == null || transactions.isEmpty()) {
            return "{\"message\": \"Chưa có dữ liệu để phân tích.\"}";
        }

        
        StringBuilder dataBuilder = new StringBuilder();
        for (Transaction t : transactions) {
            String catName = t.getCategory() != null ? t.getCategory().getName() : "Khác";
            dataBuilder.append("- Ngày: ").append(t.getTransactionDate())
                       .append(" | Loại: ").append(t.getType())
                       .append(" | Danh mục: ").append(catName)
                       .append(" | Số tiền: ").append(t.getAmount()).append(" VNĐ\n");
        }

       
        String promptText = "Bạn là một chuyên gia cố vấn tài chính cá nhân. " +
                "Dưới đây là lịch sử thu chi của tôi:\n" + dataBuilder.toString() + "\n" +
                "Dựa vào dữ liệu này, hãy thực hiện 3 việc:\n" +
                "1. Phân tích và dự đoán xu hướng chi tiêu (tôi đang chi nhiều nhất vào đâu, tháng tới sẽ ra sao).\n" +
                "2. Đánh giá xem có khoản chi nào đang bất thường hoặc lãng phí không.\n" +
                "3. Đưa ra 3 lời khuyên thiết thực để cắt giảm chi tiêu và tiết kiệm.\n" +
                "Trả về JSON ĐÚNG cấu trúc sau: {\"analysis\": \"bài phân tích\", \"prediction\": \"dự đoán\", \"advice\": [\"khuyên 1\", \"khuyên 2\", \"khuyên 3\"]}. Không trả về gì khác ngoài JSON.";

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", promptText))))
        );

        try {
            String response = webClient.post()
                .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-2.5-flash:generateContent").queryParam("key", apiKey).build())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode root = objectMapper.readTree(response);
            String rawText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
          
            return rawText.replace("```json", "").replace("```", "").trim();
        } catch (Exception e) {
            // 1. In toàn bộ lỗi đỏ ra màn hình Terminal của VS Code để chúng ta đọc
            e.printStackTrace(); 
            
            // 2. Trả thẳng câu thông báo lỗi chi tiết lên Postman
            return "{\"error\": \"Lỗi chi tiết: " + e.getMessage() + "\"}";
        }
    }
    public Transaction processReceiptImage(MultipartFile file) {
        try {
            // 1. Biến bức ảnh thành chuỗi ký tự (Base64) để gửi qua mạng
            byte[] bytes = file.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(bytes);
            String mimeType = file.getContentType();
            if (mimeType == null) mimeType = "image/jpeg";

            // 2. Lệnh yêu cầu AI (Prompt)
            String promptText = "Bạn là một kế toán viên xuất sắc. Hãy đọc hóa đơn trong bức ảnh này. " +
                    "Trả về JSON: {\"amount\": số tiền tổng cộng, \"note\": \"Tên cửa hàng hoặc tóm tắt món đồ\", \"type\": \"EXPENSE\", \"categoryName\": \"tên nhóm\", \"isAnomaly\": false}. " +
                    "Quy tắc categoryName CHỈ CHỌN: 'Ăn uống', 'Tiền lương', 'Mua tài liệu', 'Tiền tiêu vặt', 'Khác'. " +
                    "Chỉ trả về ĐÚNG định dạng JSON, tuyệt đối không có markdown (```json).";

            // 3. Đóng gói Ảnh + Text gửi cho Gemini 2.5 Flash
            Map<String, Object> inlineData = Map.of("mime_type", mimeType, "data", base64Image);
            Map<String, Object> imagePart = Map.of("inline_data", inlineData);
            Map<String, Object> textPart = Map.of("text", promptText);

            Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(textPart, imagePart)))
            );

            // GỌI ĐÚNG MODEL GEMINI-2.5-FLASH
            String response = webClient.post()
                .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-2.5-flash:generateContent").queryParam("key", apiKey).build())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            // 4. Bóc tách JSON AI trả về và tạo Transaction
            JsonNode root = objectMapper.readTree(response);
            String rawText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            String cleanJson = rawText.replace("```json", "").replace("```", "").trim();
            JsonNode data = objectMapper.readTree(cleanJson);
            
            Transaction transaction = new Transaction();
            transaction.setAmount(new BigDecimal(data.path("amount").asText()));
            transaction.setType(data.path("type").asText());
            transaction.setTransactionDate(LocalDate.now());
            
            if (data.has("isAnomaly")) {
                transaction.setIsAnomaly(data.path("isAnomaly").asBoolean());
            } else {
                transaction.setIsAnomaly(false);
            }
            
            // Nối tên Category và Note bằng dấu | để Controller tách ra
            transaction.setNote(data.path("categoryName").asText() + "|" + data.path("note").asText());

            return transaction;
        } catch (Exception e) {
            System.out.println("Lỗi đọc ảnh AI: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
}