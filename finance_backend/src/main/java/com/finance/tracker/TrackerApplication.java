package com.finance.tracker;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.reactive.function.client.WebClient;

@SpringBootApplication
public class TrackerApplication {

	public static void main(String[] args) {
		SpringApplication.run(TrackerApplication.class, args);
	}
	@Bean
	public WebClient.Builder webClientBuilder() {
    return WebClient.builder();
}
@Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

}
