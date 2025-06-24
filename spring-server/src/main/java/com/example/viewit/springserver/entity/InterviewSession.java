package com.example.viewit.springserver.entity;

public class InterviewSession {
    private String sessionId;
    private Long userId;
    private String jobRole;
    private java.sql.Timestamp startedAt;
    private java.sql.Timestamp endedAt;

    public String getSessionId() {
        return sessionId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getJobRole() {
        return jobRole;
    }

    public java.sql.Timestamp getStartedAt() {
        return startedAt;
    }
    public java.sql.Timestamp getEndedAt() {
        return endedAt;
    }



    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public void setJobRole(String jobRole) {
        this.jobRole = jobRole;
    }
    public void setStartedAt(java.sql.Timestamp startedAt) {
        this.startedAt = startedAt;
    }
    public void setEndedAt(java.sql.Timestamp endedAt) {
        this.endedAt = endedAt;
    }
}
