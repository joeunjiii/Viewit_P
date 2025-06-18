// src/main/java/com/example/viewit/springserver/config/WebConfig.java
package com.example.viewit.springserver.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry){
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")  // OPTIONS 포함
                .allowCredentials(true);
    }
}