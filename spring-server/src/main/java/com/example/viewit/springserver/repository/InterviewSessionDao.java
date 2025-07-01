package com.example.viewit.springserver.repository;

import com.example.viewit.springserver.entity.InterviewSession;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;

@Repository
public class InterviewSessionDao {

    private final JdbcTemplate jdbcTemplate;

    public InterviewSessionDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insertSession(InterviewSession session) {
        String sql = "INSERT INTO INTERVIEW_SESSION (session_id, user_id, job_role, started_at, wait_time, interviewer_voice) VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, session.getSessionId(), session.getUserId(), session.getJobRole(), session.getStartedAt(), session.getWaitTime(), session.getInterviewerVoice());
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
