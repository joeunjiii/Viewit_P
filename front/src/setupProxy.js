const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function(app) {
    // FastAPI(8000) 경로 먼저!
    app.use(
        [
            "/api/interview/init_session",
            "/api/interview/next_question",
            "/api/interview/final_answer",
            "/api/stt",
            "/api/tts",
            "/api/feedback",       
            "/api/jd",       
            "/api/voice-options",     
        ],
        createProxyMiddleware({ target: "http://localhost:8000", changeOrigin: true })
    );

    // Spring(8083) 경로
    app.use(
        "/api/interview/init",
        createProxyMiddleware({ target: "http://localhost:8083", changeOrigin: true })
    );
    app.use(
        "/api/interview/save",
        createProxyMiddleware({ target: "http://localhost:8083", changeOrigin: true })
    );
    app.use(
        "/api/interview/session/end",
        createProxyMiddleware({ target: "http://localhost:8083", changeOrigin: true })
    );
    app.use(
        "/api/interview/answer/feedback",
        createProxyMiddleware({ target: "http://localhost:8083", changeOrigin: true })
    );
    app.use(
        "/api/interview/feedback",
        createProxyMiddleware({ target: "http://localhost:8083", changeOrigin: true })
    );
    app.use(
        "/api/auth",
        createProxyMiddleware({ target: "http://localhost:8083", changeOrigin: true })
    );
    app.use(
        "/api/jd",
        createProxyMiddleware({
            target: "http://localhost:8000",
            changeOrigin: true,
        })
    );
    app.use(
        "/static/audio",
        createProxyMiddleware({ target: "http://localhost:8000", changeOrigin: true })
    );
    
    app.use(
        "/api/finalfeedback",
        createProxyMiddleware({ target: "http://localhost:8000", changeOrigin: true })
    );
    app.use(
        "/api/interview/end_session",
        createProxyMiddleware({ target: "http://localhost:8000", changeOrigin: true })
    )
};
