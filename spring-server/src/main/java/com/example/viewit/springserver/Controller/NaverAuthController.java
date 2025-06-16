package com.example.viewit.springserver.auth;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import com.example.viewit.springserver.security.JwtTokenProvider;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class NaverAuthController {

    private final RestTemplate rest;
    private final JwtTokenProvider jwtProvider;

    public NaverAuthController(RestTemplateBuilder builder,
                               JwtTokenProvider jwtProvider) {
        this.rest        = builder.build();
        this.jwtProvider = jwtProvider;
    }

    @PostMapping("/naver")
    public ResponseEntity<?> loginWithNaver(@RequestBody Map<String,String> body) {
        String accessToken = body.get("accessToken");

        // 1) 네이버 프로필 조회
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> resp = rest.exchange(
                "https://openapi.naver.com/v1/nid/me",
                HttpMethod.GET, entity, Map.class
        );
        Map profile = resp.getBody();
        Map userInfo = (Map) profile.get("response");

        // 2) 사용자 등록/조회 로직
        String email = userInfo.get("email").toString();
        // 예: User user = userService.findOrCreate(email, userInfo);

        // 3) JWT 발급 또는 세션 설정
        String jwt = jwtProvider.createToken(email);

        return ResponseEntity.ok(Map.of("token", jwt));
    }
}
