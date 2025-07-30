# 🎤 AI 기반 개발직군 실전 면접 리허설 서비스

> **실전 같은 AI 모의 면접으로**  
> **IT 취업 준비생의 면접 감각 향상과 AI 피드백을 한 번에!**

---

## 📌 프로젝트 개요

LLM과 음성 인식(STT)을 기반으로,  
IT 직군 취업 준비생이 **실제 면접처럼 연습**하고  
**맞춤형 피드백까지 받을 수 있는 웹 서비스**입니다.

---

## ✨ 주요 기능

| 기능명                 | 설명                                                                 |
|----------------------|----------------------------------------------------------------------|
| 🔐 회원가입 / 로그인     | NAVER OAuth 2.0 기반 로그인                                          |
| 🤖 AI 면접 질문 출제     | 직무별/상황별 맞춤형 질문 실시간 생성 (TTS 음성 포함)                  |
| 🎙️ 답변 녹음 / 제출     | 웹 마이크로 실시간 답변 녹음 및 제출                                  |
| 📝 음성 인식(STT)       | 음성 답변을 실시간으로 텍스트로 변환                                  |
| 📊 AI 피드백 제공       | 답변 내용·태도·말투에 대한 LLM 기반 피드백 제공                        |
| 📄 포트폴리오/JD 기반 질문 | OCR/PDF 임베딩 분석을 통한 맞춤형 질문 생성                           |
| 🗂️ 답변 기록 관리        | 이전 면접 기록 조회 및 관리 기능                                       |
| 💬 챗봇 서비스           | 면접관에게 자유롭게 질문 가능한 AI 기반 채팅                          |

---

## 🛠️ 기술 스택

| 구분          | 기술 상세                                          |
|---------------|---------------------------------------------------|
| 💻 사용 언어     | Java, JavaScript, Python                          |
| 🎨 프론트엔드    | React, CSS, Recorder.js                          |
| ⚙️ 백엔드       | Spring Boot (회원/세션), FastAPI (AI/TTS/STT 등)  |
| 🗣️ 음성 합성(TTS) | ElevenLabs API                                    |
| 🧠 음성 인식(STT) | OpenAI Whisper                                    |
| 📎 문서 분석     | PyPDF2, OCR, 임베딩 기반 유사도 검색               |
| 🔐 인증 / 보안   | JWT 기반 인증                                      |
| 🗃️ 데이터베이스   | MySQL                                             |
| 🤝 협업 도구     | GitHub, Notion, Figma                            |
| 🚢 배포 / 인프라  | Docker, Naver Cloud, Linux 서버 운영             |

---

## 🚀 실행 방법

### 📁 1. 사전 준비
`.env` 파일에 다음 정보 등록:

- DB 정보 (MySQL)
- **ElevenLabs API 키**
- **OpenAI API 키**
- FFmpeg 실행 경로
- Qdrant API KEY 및 URL

> ⚠️ `Docker Desktop` 설치 필요

---

### 💻 2. 로컬 실행

#### ✅ 1) 프론트엔드 실행

```bash
cd front/
npm install
npm start
```

#### ✅ 2) Spring Boot 백엔드 실행

```
cd ../spring-server/

# Linux / Mac
./mvnw clean install
./mvnw spring-boot:run

# Windows
mvnw clean install
mvnw spring-boot:run
```

#### ✅ 3) FastAPI AI 서버 실행

```
cd ../fastapi-server/
python -m venv .venv

# Linux / Mac
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload
```
