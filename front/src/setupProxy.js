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
    // FastAPI - AI 면접 등
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
};
