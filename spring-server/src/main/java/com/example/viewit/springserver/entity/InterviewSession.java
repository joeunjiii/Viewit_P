package com.example.viewit.springserver.entity;

public class InterviewSession {
    private String sessionId;
    private Long userId;
    private String jobRole;
    private java.sql.Timestamp startedAt;
    private int waitTime;
    private String interviewerVoice;

    public String getSessionId() {
        return sessionId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getJobRole() {
        return jobRole;
    }

    public java.sql.Timestamp getStartedAt() { return startedAt;}

    public int getWaitTime() { return waitTime; }

    public String getInterviewerVoice() { return interviewerVoice; }



    public void setSessionId(String sessionId) { this.sessionId = sessionId;}
    public void setUserId(Long userId) {this.userId = userId;}
    public void setJobRole(String jobRole) {this.jobRole = jobRole;}
    public void setStartedAt(java.sql.Timestamp startedAt) { this.startedAt = startedAt;}
    public void setWaitTime(int waitTime) { this.waitTime = waitTime;}
    public void setInterviewerVoice(String interviewerVoice) {this.interviewerVoice = interviewerVoice; }
}
