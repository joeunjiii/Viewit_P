package com.example.viewit.springserver.repository;

import com.example.viewit.springserver.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UserDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void saveOrUpdateUser(String naverId, String name, String email) {
        String checkSql = "SELECT COUNT(*) FROM USER WHERE naver_id = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, naverId);

        if (count != null && count > 0) {
            System.out.println("✅ 이미 등록된 사용자입니다.");
        } else {
            String insertSql = "INSERT INTO USER (naver_id, name, email) VALUES (?, ?, ?)";
            jdbcTemplate.update(insertSql, naverId, name, email);
            System.out.println("✅ 신규 사용자 저장 완료");
        }
    }

    public User findByEmail(String email) {
        String sql = "SELECT * FROM USER WHERE email = ?";
        try {
            return jdbcTemplate.queryForObject(sql, userRowMapper(), email);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    // ✅ userId(PK)로 조회
    public Long findUserIdByNaverId(String naverId) {
        String sql = "SELECT user_id FROM USER WHERE naver_id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, Long.class, naverId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private RowMapper<User> userRowMapper() {
        return (rs, rowNum) -> {
            User user = new User();
            user.setUserId(rs.getLong("user_id"));
            user.setNaverId(rs.getString("naver_id"));
            user.setName(rs.getString("name"));
            user.setEmail(rs.getString("email"));
            user.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            return user;
        };
    }
}
