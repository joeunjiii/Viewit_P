package com.example.viewit.springserver.controller;

import com.example.viewit.springserver.entity.Interview;
import com.example.viewit.springserver.entity.InterviewSession;
import com.example.viewit.springserver.repository.InterviewDao;
import com.example.viewit.springserver.repository.InterviewSessionDao;
import com.example.viewit.springserver.service.InterviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interview")
public class InterviewController {

    private final InterviewSessionDao interviewSessionDao;
    private final InterviewService interviewService;
    private final RestTemplate rt;

    @Value("${fastapi.url}")
    private String fastapiUrl;

    public InterviewController(RestTemplate rt,
                               InterviewService interviewService,
                               InterviewSessionDao interviewSessionDao) {
        this.rt = rt;
        this.interviewService = interviewService;
        this.interviewSessionDao = interviewSessionDao;
    }

    // 세션 초기화 (Spring DB에 세션 저장 후 FastAPI 호출)
    @PostMapping("/init_session")
    public Map<String, Object> initSession(@RequestBody Map<String, Object> body) {
        // 세션정보 저장
        String sessionId = (String) body.get("session_id");
        String jobRole = (String) body.get("job_role");
        Object userIdRaw = body.get("user_id");
        Long userId = null;
        if (userIdRaw instanceof String) {
            userId = Long.valueOf((String) userIdRaw);
        } else if (userIdRaw instanceof Number) {
            userId = ((Number) userIdRaw).longValue();
        }
        if (userId == null) throw new IllegalArgumentException("user_id는 필수입니다!");

        InterviewSession session = new InterviewSession();
        session.setSessionId(sessionId);
        session.setJobRole(jobRole);
        session.setUserId(userId);
        session.setStartedAt(new Timestamp(System.currentTimeMillis()));
        interviewSessionDao.insertSession(session);

        // FastAPI 호출
        Map<String, Object> resp = rt.postForObject(fastapiUrl + "/init_session", body, Map.class);
        return resp;
    }

    // 최종 답변 API (FastAPI 호출)
    @PostMapping("/final_answer")
    public Map<String,Object> finalAnswer(@RequestBody Map<String,Object> body) {
        Map<String,Object> resp = rt.postForObject(fastapiUrl + "/final_answer", body, Map.class);
        return resp;
    }

    // 질문/답변 저장 API
    @PostMapping("/save")
    public String saveInterview(@RequestBody Interview interview) {
        interviewService.saveInterviewWithSessionCheck(interview);
        return "저장 완료";
    }

    // session_id별 질문/답변 조회 API
    @GetMapping("/{sessionId}")
    public List<Interview> getInterviews(@PathVariable String sessionId) {
        return interviewService.getInterviewsBySessionId(sessionId);
    }

    // 답변 피드백 업데이트 API (FastAPI에서 PUT 호출)
    @PutMapping("/answer/feedback")
    public String updateAnswerFeedback(@RequestBody Map<String, Object> body) {
        String sessionId = (String) body.get("sessionId");
        String questionText = (String) body.get("questionText");
        String answerFeedback = (String) body.get("answerFeedback");
        interviewService.updateAnswerFeedbackBySessionAndQuestion(sessionId, questionText, answerFeedback);
        return "피드백 저장 완료";
    }

    @GetMapping("/feedbacks/{sessionId}")
    public List<Map<String, Object>> getAllFeedbacks(@PathVariable String sessionId) {
        return interviewService.getAllFeedbacks(sessionId);
    }
}
