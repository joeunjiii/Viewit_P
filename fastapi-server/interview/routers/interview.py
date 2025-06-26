from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
from interview.interview_session import InterviewSession
from interview.services.tts_service import generate_tts_audio
from interview.services import feedback_service

import os
import time

router = APIRouter()

# Spring 서버 주소 (환경변수 또는 기본값)
SPRING_URL = os.getenv("SPRING_URL", "http://localhost:8083")

# 세션 초기화 요청 바디 모델
class InitRequest(BaseModel):
    session_id: str
    job_role: str
    softskill_label: str | None = None

# 답변 요청 바디 모델
class AnswerRequest(BaseModel):
    session_id: str
    answer: str

# 인터뷰 세션 초기화 엔드포인트
@router.post("/init_session")
async def init_session(data: InitRequest, request: Request):
    # FastAPI 앱 상태에서 AI 관련 객체 꺼내기
    st_model       = request.app.state.st_model
    qdrant_client  = request.app.state.qdrant_client
    openai_client  = request.app.state.openai_client
    session_store  = request.app.state.session_store  # 세션 저장소 (메모리)

    # 새로운 인터뷰 세션 객체 생성
    session = InterviewSession(
        session_id=data.session_id,
        qdrant_client=qdrant_client,
        openai_client=openai_client,
        st_model=st_model,
        collection_name="interview_questions",
        job_role=data.job_role,
        softskill_label=data.softskill_label
    )
    # 초기 질문 생성 및 빈 답변 저장
    first_q = session.ask_fixed_question("intro")
    session.store_answer(first_q, "")
    session_store[data.session_id] = session  # 세션 저장

    # TTS 오디오 생성 후 질문 및 URL 반환
    audio_url = generate_tts_audio(first_q)
    return {"question": first_q, "audio_url": audio_url}

# 후속 질문 생성 및 답변 피드백 생성 엔드포인트
@router.post("/next_question")
async def next_question(
        data: AnswerRequest,
        request: Request,
        authorization: str = Header(None)  # JWT 토큰 (있으면)
):
    session_store = request.app.state.session_store
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 이전 질문과 답변 저장
    last_q = session.state["history"][-1]["question"]
    session.store_answer(last_q, data.answer)

    openai_client = request.app.state.openai_client
    llm = openai_client

    # 1) LLM으로 답변 피드백 생성
    try:
        answer_feedback = feedback_service.generate_answer_feedback(llm, last_q, data.answer)
        print("생성된 피드백:", answer_feedback)

        # 2) Spring PUT 호출로 피드백 저장 (토큰 포함 가능)
        feedback_service.save_answer_feedback_to_spring(
            data.session_id, last_q, answer_feedback, SPRING_URL, token=None
        )
    except Exception as e:
        # 에러는 무시하되 로그 출력
        print(f"[WARN] 피드백 저장 실패: {e}")

    # 3) 종료 조건: 10분 경과, 최종 질문 미출력 시 최종 질문 생성
    if time.time() - session.start_time >= 600 and not session.state.get("final_question_given", False):
        final_q = session.ask_fixed_question("final")
        session.state["final_question_given"] = True
        session.store_answer(final_q, "")
        audio_url = generate_tts_audio(final_q)
        return {"question": final_q, "audio_url": audio_url, "done": False}

    # 4) 최종 질문 후 답변 대기 상태
    if session.state.get("final_question_given", False):
        return {"message": "마지막 질문 답변을 기다립니다", "done": True}

    # 5) 다음 질문 생성 및 반환
    next_q = session.decide_next_question(data.answer)
    session.store_answer(next_q, "")
    audio_url = generate_tts_audio(next_q)
    return {"question": next_q, "audio_url": audio_url, "done": False}

# 최종 답변 및 전체 피드백 생성 엔드포인트
@router.post("/final_answer")
async def final_answer(data: AnswerRequest, request: Request):
    session_store = request.app.state.session_store
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 마지막 답변 저장
    session.store_answer("면접을 마무리 하기 전에 마지막으로 하실 말 있나요?", data.answer)

    # 지금까지 질문/답변 리스트
    qa_list = [
        {"questionText": h["question"], "answerText": h["answer"]}
        for h in session.state["history"]
    ]

    openai_client = request.app.state.openai_client

    # 전체 피드백 생성
    summary, strengths, weaknesses = feedback_service.generate_final_feedback(openai_client, qa_list)

    # Spring 서버에 최종 피드백 저장 호출
    try:
        feedback_service.save_final_feedback_to_spring(
            data.session_id, summary, strengths, weaknesses, SPRING_URL
        )
    except Exception as e:
        print(f"[WARN] 최종 피드백 저장 실패: {e}")

    # 결과 반환
    return {
        "message": "면접 종료",
        "history": session.state["history"],
        "summary": summary,
        "strengths": strengths,
        "weaknesses": weaknesses,
    }
