const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function(app) {
    // Spring Boot - 인증/로그인 API
    app.use(
        "/api/auth",
        createProxyMiddleware({
            target: "http://localhost:8083",
            changeOrigin: true,
        })
    );
    // Spring - 세션 초기화/종료는 Spring으로!
    app.use(
        "/api/interview/init",
        createProxyMiddleware({
            target: "http://localhost:8083",
            changeOrigin: true,
        })
    );
    app.use(
        "/api/interview/session/end",
        createProxyMiddleware({
            target: "http://localhost:8083",
            changeOrigin: true,
        })
    );
    app.use(
        "/api/interview/save",
        createProxyMiddleware({
            target: "http://localhost:8083",
            changeOrigin: true,
        })
    );
    // FastAPI - 나머지 AI 기능
    app.use(
        "/api/interview",
        createProxyMiddleware({
            target: "http://localhost:8000",
            changeOrigin: true
        })
    );
    app.use(
        "/api/stt",
        createProxyMiddleware({
            target: "http://localhost:8000",
            changeOrigin: true,
        })
    );
    app.use(
        "/api/tts",
        createProxyMiddleware({
            target: "http://localhost:8000",
            changeOrigin: true,
        })
    );
    app.use(
        "/api/jd",
        createProxyMiddleware({
            target: "http://localhost:8000",
            changeOrigin: true,
        })
    );
};
