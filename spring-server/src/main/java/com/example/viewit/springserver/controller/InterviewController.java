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


    private static final Logger log = LoggerFactory.getLogger(InterviewController.class);
    private final InterviewSessionDao interviewSessionDao;
    private final InterviewService interviewService;
    private final RestTemplate rt;

    @Value("${fastapi.url}")
    private String fastapiUrl;

    public InterviewController(
            RestTemplate rt,
            InterviewService interviewService,
            InterviewSessionDao interviewSessionDao) {
        this.rt = rt;
        this.interviewService = interviewService;
        this.interviewSessionDao = interviewSessionDao;
    }

    @PostMapping("/init_session")
    public Map<String, Object> initSession(@RequestBody Map<String, Object> body) {
        log.info("[init_session] body = {}", body);

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
        log.info("[Spring ▶ init_session] session_id={} question={}", sessionId, resp.get("question"));
        return resp;
    }

    @PostMapping("/final_answer")
    public Map<String,Object> finalAnswer(@RequestBody Map<String,Object> body) {
        Map<String,Object> resp = rt.postForObject(fastapiUrl + "/final_answer", body, Map.class);
        log.info("[Spring ▶ final_answer] session_id={} completed", body.get("session_id"));
        return resp;
    }

    @PostMapping("/save")
    public String saveInterview(@RequestBody Interview interview) {
        log.info("DEBUG >>> {}", interview);
        interviewService.saveInterviewWithSessionCheck(interview);
        return "저장 완료";
    }

    @GetMapping("/{sessionId}")
    public List<Interview> getInterviews(@PathVariable String sessionId) {
        return interviewService.getInterviewsBySessionId(sessionId);
    }
}