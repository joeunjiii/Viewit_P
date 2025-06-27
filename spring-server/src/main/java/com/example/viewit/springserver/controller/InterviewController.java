package com.example.viewit.springserver.controller;

import com.example.viewit.springserver.entity.Interview;
import com.example.viewit.springserver.entity.InterviewSession;
import com.example.viewit.springserver.repository.InterviewDao;
import com.example.viewit.springserver.repository.InterviewSessionDao;
import com.example.viewit.springserver.service.InterviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.sql.Timestamp;
import java.util.HashMap;
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

        // ★★★★★ [자동 트리거] 마지막 질문이면 FastAPI로 총평 생성/저장 요청
        if (isFinalQuestion(interview.getQuestionText())) {
            Map<String, Object> fastapiRequest = new HashMap<>();
            fastapiRequest.put("session_id", interview.getSessionId());
            fastapiRequest.put("answer", interview.getAnswerText());
            try {
                // FastAPI /api/feedback/final_answer 자동 호출
                rt.postForObject(fastapiUrl + "/api/feedback/final_answer", fastapiRequest, Map.class);
            } catch (Exception e) {
                // 예외 발생 시 로그만 남기고 서비스 흐름은 중단하지 않음
                System.out.println("[WARN] FastAPI 자동 총평 저장 실패: " + e.getMessage());
            }
        }
        return "저장 완료";
    }

    // 마지막 질문 여부 판별 로직 (★상황에 맞게 구현)
    private boolean isFinalQuestion(String questionText) {
        // 예시: 고정 텍스트, 인덱스, 키워드 등으로 판별
        return questionText != null && questionText.trim().contains("마지막으로 하실 말 있나요?");
        // 또는 return questionText.contains("final");
        // 실제 현업에서는 DB 플래그, 질문 순번 등 더 정교하게 분기 가능
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

    @PostMapping("/end_session")
    public Map<String, Object> endSession(@RequestBody Map<String, Object> body) {
        String sessionId = (String) body.get("session_id");
        String lastAnswer = (String) body.getOrDefault("answer", "");
        // FastAPI final_answer 호출해서 총평 생성 및 저장 트리거
        Map<String, Object> fastapiRequest = new HashMap<>();
        fastapiRequest.put("session_id", sessionId);
        fastapiRequest.put("answer", lastAnswer);

        Map<String, Object> resp = rt.postForObject(fastapiUrl + "/api/feedback/final_answer", fastapiRequest, Map.class);
        return Map.of(
                "message", "면접 종료 및 총평 저장 완료",
                "finalFeedback", resp
        );
    }
}
