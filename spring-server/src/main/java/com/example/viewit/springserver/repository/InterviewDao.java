package com.example.viewit.springserver.repository;

import com.example.viewit.springserver.entity.Interview;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class InterviewDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void saveInterview(Interview interview) {
        String sql = "INSERT INTO INTERVIEW (session_id, question_text, answer_text, filter_word, answer_feedback) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                interview.getSessionId(),
                interview.getQuestionText(),
                interview.getAnswerText(),
                interview.getFilterWord(),
                interview.getAnswerFeedback()
        );
    }

    public List<Interview> findBySessionId(String sessionId) {
        String sql = "SELECT * FROM INTERVIEW WHERE session_id = ?";
        return jdbcTemplate.query(sql, interviewRowMapper(), sessionId);
    }

    private RowMapper<Interview> interviewRowMapper() {
        return (rs, rowNum) -> {
            Interview iv = new Interview();
            iv.setInterviewId(rs.getLong("interview_id"));
            iv.setSessionId(rs.getString("session_id"));
            iv.setQuestionText(rs.getString("question_text"));
            iv.setAnswerText(rs.getString("answer_text"));
            iv.setFilterWord(rs.getString("filter_word"));
            iv.setAnswerFeedback(rs.getString("answer_feedback"));
            return iv;
        };
    }
}
