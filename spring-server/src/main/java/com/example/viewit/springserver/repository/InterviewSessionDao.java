package com.example.viewit.springserver.repository;

import com.example.viewit.springserver.entity.InterviewSession;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;

@Repository
public class InterviewSessionDao {

    private final JdbcTemplate jdbcTemplate;

    public InterviewSessionDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    private static final Map<String, String> VOICE_LABELS = Map.of(
            "ErXwobaYiN019PkySvjV", "기본 목소리",
            "21m00Tcm4TlvDq8ikWAM", "여성 - 차분한",
            "TxGEqnHWrfWFTfGW9XjX", "남성 - 명확한"
    );

    public void insertSession(InterviewSession session) {
        String sql = "INSERT INTO INTERVIEW_SESSION (session_id, user_id, job_role, started_at, wait_time, interviewer_voice) VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, session.getSessionId(), session.getUserId(), session.getJobRole(), session.getStartedAt(), session.getWaitTime(), session.getInterviewerVoice());
    }


    public Map<String, Object> findSessionWithVoiceLabel(String sessionId) {
        String sql = "SELECT session_id, user_id, job_role, started_at, wait_time, interviewer_voice FROM INTERVIEW_SESSION WHERE session_id = ?";

        return jdbcTemplate.queryForObject(sql, new Object[]{sessionId}, (rs, rowNum) -> {
            String voiceId = rs.getString("interviewer_voice");
            String label = VOICE_LABELS.getOrDefault(voiceId, "알 수 없음");

            Map<String, Object> result = new HashMap<>();
            result.put("session_id", rs.getString("session_id"));
            result.put("user_id", rs.getLong("user_id"));
            result.put("job_role", rs.getString("job_role"));
            result.put("started_at", rs.getTimestamp("started_at"));
            result.put("wait_time", rs.getInt("wait_time"));
            result.put("interviewer_voice", voiceId);
            result.put("interviewer_voice_label", label);  // 추가된 라벨
            return result;
        });
    }
//    public void updateEndedAt(String sessionId, Timestamp endedAt) {
//        String sql = "UPDATE INTERVIEW_SESSION SET WHERE session_id = ?";
//        jdbcTemplate.update(sql, sessionId);
//    }

    public boolean existsById(String sessionId) {
        String sql = "SELECT COUNT(*) FROM INTERVIEW_SESSION WHERE session_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, sessionId);
        return count != null && count > 0;
    }

}