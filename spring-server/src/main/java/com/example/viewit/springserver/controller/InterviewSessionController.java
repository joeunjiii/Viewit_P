package com.example.viewit.springserver.controller;

import com.example.viewit.springserver.entity.InterviewSession;
import com.example.viewit.springserver.repository.InterviewSessionDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;

@RestController
public class InterviewSessionController {

    private static final Logger log = LoggerFactory.getLogger(InterviewSessionController.class);

    private final InterviewSessionDao interviewSessionDao;

    public InterviewSessionController(InterviewSessionDao interviewSessionDao) {
        this.interviewSessionDao = interviewSessionDao;
    }

    @PostMapping("/api/interview/init")
    public ResponseEntity<?> initSession(@RequestBody Map<String, Object> body) {
        String sessionId = (String) body.get("session_id");
        String jobRole = (String) body.get("job_role");
        Object userIdObj = body.get("user_id");
        int waitTime = (body.get("wait_time") != null) ? Integer.parseInt(body.get("wait_time").toString()) : 5;
        String interviewerVoice = (String) body.getOrDefault("interviewerVoice", "기본 목소리");
        Long userId = null;

        // 입력값 로그
        log.info("[initSession] session_id={}, job_role={}, user_id={}", sessionId, jobRole, userIdObj);

        // user_id 체크
        if (userIdObj == null) {
            log.warn("[initSession] user_id가 null입니다. 로그인 필요!");
            Map<String, Object> err = new HashMap<>();
            err.put("error", "user_id가 없습니다. 로그인이 필요합니다.");
            return ResponseEntity.badRequest().body(err);
        }
        try {
            userId = Long.valueOf(userIdObj.toString());
        } catch (NumberFormatException e) {
            log.warn("[initSession] user_id 변환 실패: {}", userIdObj);
            Map<String, Object> err = new HashMap<>();
            err.put("error", "user_id가 숫자가 아닙니다.");
            return ResponseEntity.badRequest().body(err);
        }

        InterviewSession session = new InterviewSession();
        session.setSessionId(sessionId);
        session.setJobRole(jobRole);
        session.setUserId(userId);
        session.setStartedAt(new Timestamp(System.currentTimeMillis()));
        session.setWaitTime(waitTime);
        session.setInterviewerVoice(interviewerVoice);

        // DB Insert
        interviewSessionDao.insertSession(session);

        Map<String, Object> resp = new HashMap<>();
        resp.put("session_id", sessionId);
        resp.put("user_id", userId);
        resp.put("job_role", jobRole);
        resp.put("started_at", session.getStartedAt());
        resp.put("question", "첫 번째 질문"); // 실제 면접 질문은 FastAPI에서 받아와도 됨

        log.info("[initSession] 세션 생성 완료! session_id={}, user_id={}", sessionId, userId);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/api/interview/session/end")
    public ResponseEntity<?> endSession(@RequestBody Map<String, String> body) {
        String sessionId = body.get("sessionId");
        if (sessionId == null) {
            log.warn("[endSession] sessionId가 없습니다.");
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId가 없습니다."));
        }
//        interviewSessionDao.updateEndedAt(sessionId, new Timestamp(System.currentTimeMillis()));
//        log.info("[endSession] 세션 종료 처리 완료: session_id={}", sessionId);
        return ResponseEntity.ok(Map.of("session_id", sessionId, "status", "ended"));
    }
}
