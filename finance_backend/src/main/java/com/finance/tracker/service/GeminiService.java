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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
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
        this.webClient = webClientBuilder.baseUrl("https://generativelanguage.googleapis.com").build();
    }

    public Map<String, Object> processTransaction(String userInput) {
        String promptText = "Bạn là 'Trợ lý Tài chính FinanceAI' cực kỳ thông minh, xưng 'mình' và gọi người dùng là 'bạn'. "
                +
                "Người dùng vừa nhắn: '" + userInput + "'. " +
                "Hãy trả về ĐÚNG 1 object JSON (tuyệt đối không dùng markdown) gồm 2 phần: " +
                "1. 'reply': Viết phản hồi tự nhiên, hài hước. Nhặt được tiền thì chúc mừng, xài hoang thì nhắc nhở, mệt mỏi thì an ủi. BẮT BUỘC CÓ. "
                +
                "2. 'transaction': Dữ liệu lưu. Nếu KHÔNG phải giao dịch, để null. Nếu đúng là giao dịch, dùng cấu trúc: {\"amount\": số tiền, \"note\": \"ghi chú\", \"type\": \"INCOME\" hoặc \"EXPENSE\", \"categoryName\": \"Ăn uống/Di chuyển/Mua sắm/Lương/Khác\", \"isAnomaly\": true/false}.";

        Map<String, Object> body = Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", promptText)))));

        try {
            String response = webClient.post()
                    // 🔴 Đã cập nhật tên model thành gemini-2.5-flash ở dòng dưới đây
                    .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-2.5-flash:generateContent")
                            .queryParam("key", apiKey).build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve().bodyToMono(String.class).block();

            JsonNode root = objectMapper.readTree(response);

            // 1. Tách riêng câu trả lời nguyên bản của AI ra
            String rawText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            // 🌟 2. MÁY QUÉT DEBUG: IN RA CONSOLE KIỂM TRA
            System.out.println("=========================================");
            System.out.println("🤖 [DEBUG] AI TRẢ VỀ NGUYÊN BẢN: \n" + rawText);
            System.out.println("=========================================");

            // 3. Dọn dẹp format và trích xuất JSON an toàn
            String cleanJson = rawText.trim();
            if (cleanJson.contains("{") && cleanJson.contains("}")) {
                cleanJson = cleanJson.substring(cleanJson.indexOf("{"), cleanJson.lastIndexOf("}") + 1);
            }
            JsonNode data = objectMapper.readTree(cleanJson);

            Map<String, Object> result = new HashMap<>();
            result.put("reply", data.has("reply") ? data.path("reply").asText() : "Mình đã ghi nhận nhé!");

            JsonNode txNode = data.path("transaction");
            if (!txNode.isNull() && !txNode.isMissingNode()) {
                Transaction transaction = new Transaction();
                transaction.setAmount(new BigDecimal(txNode.path("amount").asText()));
                transaction.setType(txNode.path("type").asText());
                transaction.setTransactionDate(LocalDate.now());
                transaction.setIsAnomaly(txNode.path("isAnomaly").asBoolean(false));
                transaction.setNote(txNode.path("categoryName").asText() + "|" + txNode.path("note").asText());
                result.put("transaction", transaction);
            } else {
                result.put("transaction", null);
            }
            return result;
        } catch (WebClientResponseException e) {
            System.err.println("Error from Gemini API: " + e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}