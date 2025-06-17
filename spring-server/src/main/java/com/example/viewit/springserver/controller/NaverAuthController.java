// src/main/java/com/example/viewit/springserver/controller/NaverAuthController.java
package com.example.viewit.springserver.controller;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
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

        ResponseEntity<Map<String, Object>> resp = rest.exchange(
                "https://openapi.naver.com/v1/nid/me",
                HttpMethod.GET, entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        Map<String, Object> profile = resp.getBody();
        if (profile == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Map<String, Object> userInfo = (Map<String, Object>) profile.get("response");

        // 2) 사용자 등록/조회 로직
        String email = userInfo.get("email").toString();
        // e.g., User user = userService.findOrCreate(email);

        // 3) JWT 발급
        String jwt = jwtProvider.createToken(email);
        return ResponseEntity.ok(Map.of("token", jwt));
    }
}
