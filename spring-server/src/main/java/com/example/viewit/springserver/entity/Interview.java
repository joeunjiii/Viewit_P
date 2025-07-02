package com.example.viewit.springserver.entity;

public class Interview {
    private Long interviewId;
    private String sessionId;
    private String questionText;
    private String answerText;
    private String answerFeedback;
    private String interviewerName;
    private String interviewerRole;


    public Interview() {}

    public Interview(Long interviewId, String sessionId, String questionText, String answerText, String filterWord, String answerFeedback) {
        this.interviewId = interviewId;
        this.sessionId = sessionId;
        this.questionText = questionText;
        this.answerText = answerText;

        this.answerFeedback = answerFeedback;
    }

    // --- getter / setter ---
    public Long getInterviewId() { return interviewId; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }


    public String getAnswerFeedback() { return answerFeedback; }
    public void setAnswerFeedback(String answerFeedback) { this.answerFeedback = answerFeedback; }

    public String getInterviewerName() { return interviewerName; }
    public void setInterviewerName(String interviewerName) { this.interviewerName = interviewerName; }

    public String getInterviewerRole() { return interviewerRole; }
    public void setInterviewerRole(String interviewerRole) { this.interviewerRole = interviewerRole; }

    @Override
    public String toString() {
        return "Interview{" +
                "interviewId=" + interviewId +
                ", sessionId=" + sessionId +
                ", questionText='" + questionText + '\'' +
                ", answerText='" + answerText + '\'' +
                ", answerFeedback='" + answerFeedback + '\'' +
                ", interviewerName='" + interviewerName + '\'' +
                ", interviewerRole='" + interviewerRole + '\'' +

                '}';
    }
}
