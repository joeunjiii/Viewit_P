package com.example.viewit.springserver.entity;

import java.time.LocalDateTime;

public class User {

    private Long userId;       // user_id (PK)
    private String naverId;    // naver_id (UNIQUE)
    private String name;       // name
    private String email;      // email
    private LocalDateTime createdAt; // created_at

    // --- 생성자 ---
    public User() {}

    public User(Long userId, String naverId, String name, String email, LocalDateTime createdAt) {
        this.userId = userId;
        this.naverId = naverId;
        this.name = name;
        this.email = email;
        this.createdAt = createdAt;
    }

    // --- getter / setter ---
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getNaverId() {
        return naverId;
    }

    public void setNaverId(String naverId) {
        this.naverId = naverId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "User{" +
                "userId=" + userId +
                ", naverId='" + naverId + '\'' +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
