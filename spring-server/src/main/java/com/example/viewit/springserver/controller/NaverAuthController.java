package com.example.viewit.springserver.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.example.viewit.springserver.repository.UserDao;
import com.example.viewit.springserver.security.JwtTokenProvider;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class NaverAuthController {
    private static final Logger log = LoggerFactory.getLogger(NaverAuthController.class);

    private final UserDao userDao;
    private final RestTemplate rest;
    private final JwtTokenProvider jwtProvider;

    public NaverAuthController(RestTemplateBuilder builder,
                               JwtTokenProvider jwtProvider,
                               UserDao userDao) {
        this.rest        = builder.build();
        this.jwtProvider = jwtProvider;
        this.userDao     = userDao;
    }

    @PostMapping("/naver")
    public ResponseEntity<?> loginWithNaver(@RequestBody Map<String,String> body) {
        String accessToken = body.get("accessToken");
        log.info("[NaverAuth] 1) 받은 accessToken = {}", accessToken);

        // 네이버 프로필 조회
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<Map<String, Object>> resp = rest.exchange(
                "https://openapi.naver.com/v1/nid/me",
                HttpMethod.GET, entity,
                new ParameterizedTypeReference<>() {}
        );

        Map<String, Object> profile = resp.getBody();
        log.info("[NaverAuth] 2) 네이버 프로필 응답 = {}", profile);

        if (profile == null) {
            log.warn("[NaverAuth] 프로필 조회 실패 → 401 Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> userInfo = (Map<String, Object>) profile.get("response");

        String email = userInfo.get("email").toString();
        String name = userInfo.get("name").toString();
        String naverId = userInfo.get("id").toString();

        log.info("[NaverAuth] 3) 파싱된 이메일 = {}", email);
        log.info("[NaverAuth] 3) 파싱된 이름 = {}", name);

        // JWT 발급
        String jwt = jwtProvider.createToken(email, name);
        log.info("[NaverAuth] 4) 발급된 JWT = {}", jwt);

        // DB 저장 & userId 반환
        userDao.saveOrUpdateUser(naverId, name, email);
        Long userId = userDao.findUserIdByNaverId(naverId); // 반드시 구현되어 있어야 함!

        return ResponseEntity.ok(Map.of(
                "token", jwt,
                "userId", userId
        ));
    }
}
