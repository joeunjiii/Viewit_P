package com.example.viewit.springserver.config;

import com.example.viewit.springserver.service.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
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
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/naver").permitAll()
                        .requestMatchers(
                                "/", "/login", "/main", "/interview", "/AnalyzingModal",
                                "/css/**", "/js/**", "/assets/**",
                                "/oauth2/**", "/error", "/naver/callback.html", "/naver/**",
                                "/api/interview/save", "/api/interview/init", "/api/interview/feedbacks/**"
                        ).permitAll()
                        .requestMatchers("/oauth2/authorization/naver").permitAll()

                        // ------- 피드백 관련 무인증 ------
                        .requestMatchers("/api/interview/answer/feedback").permitAll()
                        .requestMatchers("/api/interview/feedback").permitAll()
                        .requestMatchers("/api/interview/feedback/**").permitAll()
                        .requestMatchers("/api/interview/**").permitAll()



                        // ------- FastAPI 연동 경로 무인증 ------
                        .requestMatchers("/api/interview/init_session").permitAll()
                        .requestMatchers("/api/interview/next_question").permitAll()
                        .requestMatchers("/api/interview/final_answer").permitAll()

                        // 나머지 /api/** 인증 필요
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )

                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .authorizationEndpoint(a -> a.baseUri("/oauth2/authorization"))
                        .redirectionEndpoint(r -> r.baseUri("/login/oauth2/code/*"))
                        .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
                        .defaultSuccessUrl("/main", true)
                )
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                        })
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                );
        return http.build();
    }
}
