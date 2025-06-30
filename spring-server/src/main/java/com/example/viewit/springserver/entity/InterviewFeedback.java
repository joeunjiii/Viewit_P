package com.example.viewit.springserver.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

public class InterviewFeedback {

    private Long interfeedbackId;
    @JsonProperty("sessionId")
    private String sessionId;
    @JsonProperty("finalFeedback")
    private String finalFeedback;
    @JsonProperty("interviewStrengths")
    private String interviewStrengths;
    @JsonProperty("interviewWeaknesses")
    private String interviewWeaknesses;

    // 기본 생성자 (필수)Y
    public InterviewFeedback() {
    }

    public Long getInterfeedbackId() {
        return interfeedbackId;
    }

    public void setInterfeedbackId(Long interfeedbackId) {
        this.interfeedbackId = interfeedbackId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getFinalFeedback() {
        return finalFeedback;
    }

    public void setFinalFeedback(String finalFeedback) {
        this.finalFeedback = finalFeedback;
    }

    public String getInterviewStrengths() {
        return interviewStrengths;
    }

    public void setInterviewStrengths(String interviewStrengths) {
        this.interviewStrengths = interviewStrengths;
    }

    public String getInterviewWeaknesses() {
        return interviewWeaknesses;
    }

    public void setInterviewWeaknesses(String interviewWeaknesses) {
        this.interviewWeaknesses = interviewWeaknesses;
    }

    @Override
    public String toString() {
        return "InterviewFeedback{" +
                "interfeedbackId=" + interfeedbackId +
                ", sessionId='" + sessionId + '\'' +
                ", finalFeedback='" + finalFeedback + '\'' +
                ", interviewStrengths='" + interviewStrengths + '\'' +
                ", interviewWeaknesses='" + interviewWeaknesses + '\'' +
                '}';
    }
}
