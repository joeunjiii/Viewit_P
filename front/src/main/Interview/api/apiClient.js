import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8083",   // Spring Boot 게이트웨이 주소
    // withCredentials: true,            // 필요시 쿠키를 보낼 때
});

export default api;