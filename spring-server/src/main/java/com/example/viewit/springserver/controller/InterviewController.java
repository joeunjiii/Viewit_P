package com.example.viewit.springserver.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/interview")
public class InterviewController {

    private static final Logger log = LoggerFactory.getLogger(InterviewController.class);

    private final RestTemplate rt;

    @Value("${fastapi.url}")
    private String fastapiUrl;

    public InterviewController(RestTemplate rt) {
        this.rt = rt;
    }

    @PostMapping("/init_session")
    public Map<String,Object> initSession(@RequestBody Map<String,String> body) {
        Map<String,Object> resp = rt.postForObject(fastapiUrl + "/init_session", body, Map.class);
        log.info("[Spring ▶ init_session] session_id={} question={}", body.get("session_id"), resp.get("question"));
        return resp;
    }

    @PostMapping("/next_question")
    public Map<String,Object> nextQuestion(@RequestBody Map<String,Object> body) {
        Map<String,Object> resp = rt.postForObject(fastapiUrl + "/next_question", body, Map.class);
        log.info("[Spring ▶ next_question] session_id={} question={}", body.get("session_id"), resp.get("question"));
        return resp;
    }

    @PostMapping("/final_answer")
    public Map<String,Object> finalAnswer(@RequestBody Map<String,Object> body) {
        Map<String,Object> resp = rt.postForObject(fastapiUrl + "/final_answer", body, Map.class);
        log.info("[Spring ▶ final_answer] session_id={} completed", body.get("session_id"));
        return resp;
    }
}
