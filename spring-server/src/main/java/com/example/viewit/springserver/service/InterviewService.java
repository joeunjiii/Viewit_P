package com.example.viewit.springserver.service;

import com.example.viewit.springserver.entity.Interview;
import com.example.viewit.springserver.entity.InterviewSession;
import com.example.viewit.springserver.repository.InterviewDao;
import com.example.viewit.springserver.repository.InterviewSessionDao;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Service
public class InterviewService {
    private final InterviewSessionDao sessionDao;
    private final InterviewDao interviewDao;
    private static final Logger log = LoggerFactory.getLogger(InterviewService.class);


    public InterviewService(InterviewSessionDao sessionDao, InterviewDao interviewDao) {
        this.sessionDao = sessionDao;
        this.interviewDao = interviewDao;
    }

    @Transactional
    public void saveInterviewWithSessionCheck(Interview interview) {
        log.debug("[Service] DB 저장 진입: sessionId={}", interview.getSessionId());
        String sessionId = interview.getSessionId();
        boolean exists = sessionDao.existsById(sessionId);
        if (!exists) {
            InterviewSession newSession = new InterviewSession();
            newSession.setSessionId(sessionId);
            sessionDao.insertSession(newSession);
        }
        interviewDao.saveInterview(interview);  // 실제 DB 저장
        log.debug("[Service] DB 저장 완료: sessionId={}", interview.getSessionId());
    }


    public List<Interview> getInterviewsBySessionId(String sessionId) {
        return interviewDao.findBySessionId(sessionId);
    }

    public void updateAnswerFeedbackBySessionAndQuestion(String sessionId, String questionText, String answerFeedback, String interviewerName, String interviewerRole) {
        interviewDao.updateAnswerFeedbackBySessionAndQuestion(sessionId, questionText, answerFeedback, interviewerName, interviewerRole);
    }
}
