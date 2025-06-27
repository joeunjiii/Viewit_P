package com.example.viewit.springserver.service;

import com.example.viewit.springserver.entity.Interview;
import com.example.viewit.springserver.entity.InterviewSession;
import com.example.viewit.springserver.repository.InterviewDao;
import com.example.viewit.springserver.repository.InterviewSessionDao;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class InterviewService {
    private final InterviewSessionDao sessionDao;
    private final InterviewDao interviewDao;


    public InterviewService(InterviewSessionDao sessionDao, InterviewDao interviewDao) {
        this.sessionDao = sessionDao;
        this.interviewDao = interviewDao;
    }

    @Transactional
    public void saveInterviewWithSessionCheck(Interview interview) {
        String sessionId = interview.getSessionId();
        boolean exists = sessionDao.existsById(sessionId);
        if (!exists) {
            InterviewSession newSession = new InterviewSession();
            newSession.setSessionId(sessionId);
            sessionDao.insertSession(newSession);
        }
        interviewDao.saveInterview(interview);
    }

    public List<Interview> getInterviewsBySessionId(String sessionId) {
        return interviewDao.findBySessionId(sessionId);
    }

    public void updateAnswerFeedbackBySessionAndQuestion(String sessionId, String questionText, String answerFeedback) {
        interviewDao.updateAnswerFeedbackBySessionAndQuestion(sessionId, questionText, answerFeedback);
    }

    public List<Map<String, Object>> getAllFeedbacks(String sessionId) {
        return interviewDao.selectAllFeedbacksBySessionId(sessionId);
    }
}

