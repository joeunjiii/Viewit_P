package com.example.viewit.springserver.service;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. 기본 로직 실행
        OAuth2User oauth2User = super.loadUser(userRequest);

        // 2. 네이버 로그인인 경우에만 커스텀 처리
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        if ("naver".equals(registrationId)) {
            Map<String, Object> response = (Map<String, Object>) oauth2User.getAttributes().get("response");

            String id = (String) response.get("id");
            String email = (String) response.get("email");
            String name = (String) response.get("name");

            return new DefaultOAuth2User(
                    Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                    response,
                    "email" // 사용자의 고유 키
            );
        }

        // 3. 그 외는 기본 처리 그대로 반환
        return oauth2User;
    }
}