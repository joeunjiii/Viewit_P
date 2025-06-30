package com.example.viewit.springserver.repository;

import com.example.viewit.springserver.entity.InterviewFeedback;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class InterviewFeedbackDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public InterviewFeedback findBySessionId(String sessionId) {
        String sql = "SELECT * FROM INTERVIEW_FEEDBACK WHERE session_id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            InterviewFeedback fb = new InterviewFeedback();
            fb.setInterfeedbackId(rs.getLong("interfeedback_id"));
            fb.setSessionId(rs.getString("session_id"));
            fb.setFinalFeedback(rs.getString("final_feedback"));
            fb.setInterviewStrengths(rs.getString("interview_strengths"));
            fb.setInterviewWeaknesses(rs.getString("interview_weaknesses"));
            return fb;
        }, sessionId);
    }

    public String saveFeedback(InterviewFeedback feedback) {
        String checkSql = "SELECT COUNT(*) FROM INTERVIEW_FEEDBACK WHERE session_id = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, feedback.getSessionId());

        String sql = """
        INSERT INTO INTERVIEW_FEEDBACK (session_id, final_feedback, interview_strengths, interview_weaknesses)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            final_feedback = VALUES(final_feedback),
            interview_strengths = VALUES(interview_strengths),
            interview_weaknesses = VALUES(interview_weaknesses)
    """;
        jdbcTemplate.update(sql,
                feedback.getSessionId(),
                feedback.getFinalFeedback(),
                feedback.getInterviewStrengths(),
                feedback.getInterviewWeaknesses()
        );
        return (count != null && count > 0) ? "updated" : "inserted";
    }

}
