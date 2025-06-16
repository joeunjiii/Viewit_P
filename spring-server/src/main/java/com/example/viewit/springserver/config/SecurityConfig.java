package com.example.viewit.springserver.config;

import com.example.viewit.springserver.service.CustomOAuth2UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           CustomOAuth2UserService customOAuth2UserService) throws Exception {
        http
                // CSRF 비활성화
                .csrf(AbstractHttpConfigurer::disable)

                // SPA 라우트와 정적 리소스는 모두 인증 없이
                .authorizeHttpRequests(auth ->
                        auth
                                .requestMatchers(
                                        "/", "/login", "/main", "/interview", "/AnalyzingModal",
                                        "/css/**", "/js/**", "/assets/**",
                                        "/oauth2/**", "/error", "/naver/callback.html", "/naver/**"
                                ).permitAll()
                                // 그 외 API 요청만 인증
                                .requestMatchers("/api/**").authenticated()
                                .anyRequest().permitAll()
                )

                // OAuth2 로그인
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .authorizationEndpoint(a -> a.baseUri("/oauth2/authorization"))
                        .redirectionEndpoint(r -> r.baseUri("/login/oauth2/code/*"))
                        .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
                        .defaultSuccessUrl("/main", true)
                )

                // 로그아웃
                .logout(logout ->
                        logout
                                .logoutUrl("/logout")
                                .logoutSuccessUrl("/login")
                                .invalidateHttpSession(true)
                                .deleteCookies("JSESSIONID")
                );

        return http.build();
    }
}
