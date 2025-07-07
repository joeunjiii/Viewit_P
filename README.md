# AI 면접 리허설 서비스

실전과 같은 AI 기반 모의 면접으로  
IT 취업 준비생의 실전 감각 향상과 맞춤 피드백까지 한 번에!

---

## 프로젝트 개요

본 프로젝트는 최신 LLM 및 음성 인식·합성 기술을 활용하여  
IT 직군 취업 준비생이 실제 면접과 유사한 환경에서  
연습할 수 있도록 지원하는 AI 면접 리허설 웹 서비스입니다.

---

### 주요 기능

| 기능                   | 설명                                                                       |
|------------------------|----------------------------------------------------------------------------|
| 회원가입 / 로그인        | 이메일 기반 계정 생성 및 인증                                               |
| AI 면접관 질문          | 직무별/상황별 맞춤형 질문 실시간 출제 (TTS를 통한 음성 질문 포함)            |
| 답변 녹음/제출          | 웹 마이크로 실시간 답변 녹음 및 제출                                        |
| STT 변환                | 사용자의 음성 답변을 실시간 텍스트로 변환                                    |
| AI 피드백 제공          | 답변 내용·태도·말투에 대한 AI 기반 피드백                                    |
| 포트폴리오/JD 기반 질문 | OCR/PDF 임베딩을 통한 개인화 맞춤형 질문 생성                               |
| 답변 기록 및 관리        | 이전 면접 기록 열람 및 관리 기능                                             |
| 챗봇 서비스             | AI 면접관에게 자유롭게 질문 및 취업 Q&A                                      |

---

## 🛠️ 사용 언어 및 도구

| 구분          | 기술 스택                                                                 |
|---------------|--------------------------------------------------------------------------|
| 사용 언어      | JAVA,js, Python                                                      |
| 프론트엔드     | React,CSS, Recorder.js                                   |
| 백엔드        |  Spring Boot (회원/세션), FastAPI (AI/TTS/STT/피드백)                     |
| 음성 합성(TTS) | ElevenLabs API                                                          |
| 음성 인식(STT) | OpenAI Whisper                                                     |
| 포트폴리오,JD 분석 | OCR, PyPDF2, 임베딩 기반 문서 검색                                      |
| 인증/보안      | JWT                                                                     |
| 데이터베이스    | MySQL                                                                   |
| 협업 도구      | GitHub, Notion, Figma                                       |
| 배포/인프라     | Docker, Naver Cloud, Linux                                              |

---

## 실행 방법

### 1. 사전 준비
- `.env` 파일에 DB 정보, ELEVENLABs api, OpenAI api 준비,FFmpeg 경로 설정,qdrant api, url 설정
- Docker Desktop 설치

### 2. 로컬 실행

cd front/
npm install


cd ../spring-server/
리눅스/Mac:
    ./mvnw clean install
    ./mvnw spring-boot:run
Windows:
    mvnw clean install
    mvnw spring-boot:run


cd ./fastapi-server/
python -m venv .venv
source .venv/bin/activate      # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --reload

# 혹은 docker-compose up -d --build 로 전체 실행
