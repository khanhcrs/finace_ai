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
import java.util.ArrayList;

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
        if (rawText == null) return "{}";
        String clean = rawText.trim();
        if (clean.contains("{") && clean.contains("}")) {
            return clean.substring(clean.indexOf("{"), clean.lastIndexOf("}") + 1);
        }
        return clean;
    }

    private String extractJsonArray(String rawText) {
        if (rawText == null) return "[]";
        String clean = rawText.trim();
        // Cố gắng tìm mảng JSON trước
        if (clean.contains("[") && clean.contains("]")) {
            return clean.substring(clean.indexOf("["), clean.lastIndexOf("]") + 1);
        }
        // Nếu AI lỡ trả về 1 object, tự bọc mảng lại
        if (clean.contains("{") && clean.contains("}")) {
            return "[" + clean.substring(clean.indexOf("{"), clean.lastIndexOf("}") + 1) + "]";
        }
        return "[]";
    }

    public List<Transaction> processTransaction(String userInput) {
        String today = LocalDate.now().toString(); 

        // 🔥 NÂNG CẤP PROMPT: Dạy AI văn hóa "tiền tệ Việt Nam"
        String promptText = "Bạn là máy trích xuất JSON vô tri. Tuyệt đối không bình luận. " +
                "CHỈ TRẢ VỀ DUY NHẤT MỘT MẢNG JSON ARRAY. " +
                "Cấu trúc: [{\"amount\": số_nguyên, \"date\": \"YYYY-MM-DD\", \"note\": \"nội dung\", \"type\": \"INCOME\" hoặc \"EXPENSE\", \"categoryName\": \"Ăn uống, Tiền lương, Mua sắm, Đi lại, Khác\", \"isAnomaly\": true/false, \"anomalyReason\": \"lý do\"}]. " +
                "QUY TẮC SỐ TIỀN CỰC KỲ QUAN TRỌNG: " +
                "1. '50k' -> 50000. " +
                "2. Nếu người dùng chỉ nhập số nhỏ gọn (ví dụ: '50', '35', '100') mà KHÔNG có chữ 'k' hay 'ngàn', BẠN PHẢI TỰ HIỂU ĐÓ LÀ NGÀN ĐỒNG VÀ NHÂN VỚI 1000 (thành 50000, 35000, 100000). " +
                "Hôm nay là " + today + ". Dựa vào ngữ cảnh để lùi ngày cho trường 'date'. Nếu không rõ, dùng ngày hôm nay." +
                "\n\nPhân tích câu sau: '" + userInput + "'";

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", promptText))))
        );

        try {
            String response = webClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-2.5-flash:generateContent").queryParam("key", apiKey).build())
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
                if (amtStr.isEmpty()) amtStr = "0";
                
                transaction.setAmount(new BigDecimal(amtStr));
                if(transaction.getAmount().compareTo(BigDecimal.ZERO) == 0) continue; 

                transaction.setType(data.path("type").asText("EXPENSE"));
                
                LocalDate txDate = LocalDate.now();
                if (data.has("date") && !data.get("date").isNull()) {
                    try {
                        txDate = LocalDate.parse(data.get("date").asText().trim());
                    } catch (Exception ex) {}
                }
                transaction.setTransactionDate(txDate);
                
                transaction.setIsAnomaly(data.path("isAnomaly").asBoolean(false));

                String reason = "";
                if (data.has("anomalyReason") && !data.get("anomalyReason").isNull()) {
                    String reasonStr = data.get("anomalyReason").asText().trim();
                    if (!reasonStr.isEmpty() && !reasonStr.equalsIgnoreCase("null") && !reasonStr.equalsIgnoreCase("false")) {
                        reason = " [" + reasonStr + "]";
                    }
                }
                transaction.setNote(data.path("categoryName").asText("Khác") + "|" + data.path("note").asText("") + reason);
                transactions.add(transaction);
            }
            return transactions;

        } catch (WebClientResponseException e) {
            System.out.println("❌ LỖI API (" + e.getStatusCode() + "): " + e.getResponseBodyAsString());
            Transaction errorTx = new Transaction();
            
            // 🔥 BẮT LỖI 503 Ở ĐÂY ĐỂ TRẢ VỀ LỜI NHẮN THÂN THIỆN
            int statusCode = e.getStatusCode().value();
            if (statusCode == 429) {
                errorTx.setNote("ERROR|AI đang nghỉ giải lao (Hết hạn mức). Bạn đợi 1 phút nhé!");
            } else if (statusCode == 503) {
                errorTx.setNote("ERROR|Máy chủ Google đang quá tải. Bạn bấm gửi lại lần nữa nhé!");
            } else {
                errorTx.setNote("ERROR|Lỗi kết nối API: " + statusCode);
            }
            return List.of(errorTx);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    public String analyzeSpending(List<Transaction> transactions) {
        if (transactions == null || transactions.isEmpty()) return "{\"analysis\": \"Chưa có dữ liệu.\", \"prediction\": \"N/A\", \"advice\": []}";

        StringBuilder dataBuilder = new StringBuilder();
        for (Transaction t : transactions) {
            dataBuilder.append(String.format("- %s: %s đ (%s)\n", t.getTransactionDate(), t.getAmount(), t.getNote()));
        }

        String promptText = "Dựa trên dữ liệu:\n" + dataBuilder.toString() + 
                "\nHãy trả về JSON cấu trúc: {\"analysis\": \"...\", \"prediction\": \"...\", \"advice\": [\"...\", \"...\"]}";

        Map<String, Object> body = Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", promptText)))));

        try {
            String response = webClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-2.5-flash:generateContent").queryParam("key", apiKey).build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve().bodyToMono(String.class).block();

            JsonNode root = objectMapper.readTree(response);
            return extractJson(root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText());
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 429) return "{\"analysis\": \"Hệ thống AI đang tạm thời quá tải.\", \"prediction\": \"Bạn chờ 1 phút rồi thử lại nhé.\", \"advice\": [\"Hạn mức đã đạt giới hạn\"]}";
            return "{}";
        } catch (Exception e) {
            return "{}";
        }
    }

    public Transaction processReceiptImage(MultipartFile file) { return null; }

    public String answerQuestion(String question, String transactionHistory) {
        String promptText = "Dữ liệu:\n" + transactionHistory + "\nCâu hỏi: " + question + "\nTrả lời ngắn gọn, thân thiện.";
        Map<String, Object> body = Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", promptText)))));

        try {
            String response = webClient.post()
                .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-2.5-flash:generateContent").queryParam("key", apiKey).build())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve().bodyToMono(String.class).block();
            JsonNode root = objectMapper.readTree(response);
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 429) return "Mình đang cần nghỉ giải lao (Hết hạn mức). Bạn quay lại sau 1 phút nhé!";
            return "Lỗi kết nối AI.";
        } catch (Exception e) {
            return "Xin lỗi, mình đang gặp sự cố!";
        }
    }
}