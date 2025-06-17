package com.example.viewit.springserver.config;

import com.example.viewit.springserver.service.CustomOAuth2UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
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
                // 1) CSRF 비활성화
                .csrf(AbstractHttpConfigurer::disable)
                // 2) WebConfig의 CORS 맵핑을 적용
                .cors(Customizer.withDefaults())

                // 3) 인가(Authorization) 설정
                .authorizeHttpRequests(auth -> auth
                        // 3-1) OPTIONS 프리플라이트는 무조건 허용
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 3-2) 네이버 토큰 전달용 API는 인증 없이 허용!
                        .requestMatchers("/api/auth/naver").permitAll()

                        // 3-3) SPA 진입점 및 정적 리소스 허용
                        .requestMatchers(
                                "/", "/login", "/main", "/interview", "/AnalyzingModal",
                                "/css/**", "/js/**", "/assets/**",
                                "/oauth2/**", "/error", "/naver/callback.html", "/naver/**"
                        ).permitAll()
                        .requestMatchers("/oauth2/authorization/naver").permitAll()

                        // 3-4) 그 외 /api/** 요청은 인증 필요
                        .requestMatchers("/api/**").authenticated()

                        .anyRequest().permitAll()
                )

                // 4) OAuth2 로그인 설정
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .authorizationEndpoint(a -> a.baseUri("/oauth2/authorization"))
                        .redirectionEndpoint(r -> r.baseUri("/login/oauth2/code/*"))
                        .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
                        .defaultSuccessUrl("/main", true)
                )

                // 5) 로그아웃 설정
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                );

        return http.build();
    }
}
