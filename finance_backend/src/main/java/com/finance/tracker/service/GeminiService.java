package com.finance.tracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.tracker.model.Transaction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

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
                            "Trả về JSON: {\"amount\": số, \"note\": \"nội dung\", \"type\": \"INCOME\" hoặc \"EXPENSE\", \"categoryName\": \"tên nhóm\"}. " +
                            "Quy tắc số tiền: Tự quy đổi 'k' thành hàng nghìn, 'triệu' thành hàng triệu (Ví dụ: 45k -> 45000). " +
                            "Quy tắc categoryName CHỈ CHỌN: 'Ăn uống', 'Tiền lương', 'Mua tài liệu', 'Tiền tiêu vặt', 'Khác'.";

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
            
            // Gộp categoryName và note để Controller dễ xử lý
            transaction.setNote(data.path("categoryName").asText() + "|" + data.path("note").asText());

            return transaction;
        } catch (Exception e) {
            return null;
        }
    }
}