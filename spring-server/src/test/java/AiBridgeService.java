import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;


@Slf4j
@Service
public class AiBridgeService {

    private final WebClient webClient = WebClient.create("http://localhost:8000");

    @PostConstruct
    public void checkFastApiConnection() {
        Map<String, String> dummy = Map.of("text", "ping");

        try {
            String response = webClient.post()
                    .uri("/ask")
                    .bodyValue(dummy)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("FastAPI 연결 성공: {}", response);
        } catch (Exception e) {
            log.error("FastAPI 연결 실패", e);
        }
    }

    public String askAi(String prompt) {
        Map<String, String> request = Map.of("text", prompt);

        return webClient.post()
                .uri("/ask")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

}
