package com.example.viewit.springserver.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class InterviewFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long interfeedbackId;

    private Long sessionId;

    @Lob
    private String interviewStrengths;

    @Lob
    private String interviewWeaknesses;

    @Lob
    private String finalFeedack;
}
