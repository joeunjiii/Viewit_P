package com.example.viewit.springserver.repository;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
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
}
