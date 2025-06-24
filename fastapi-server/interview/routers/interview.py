# routers/interview.py

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

# 외부 객체/함수(main.py에서 import 필요)
from services.tts_service import generate_tts_audio
from interview.interview_session import InterviewSession

router = APIRouter()

# 요청 모델
class InitRequest(BaseModel):
    session_id: str
    job_role: str
    softskill_label: str | None = None

class AnswerRequest(BaseModel):
    session_id: str
    answer: str

@router.post("/init_session")
async def init_session(data: InitRequest, request: Request):
    st_model = request.app.state.st_model
    qdrant_client = request.app.state.qdrant_client
    openai_client = request.app.state.openai_client
    session_store = request.app.state.session_store

    session = InterviewSession(
        session_id=data.session_id,
        qdrant_client=qdrant_client,
        openai_client=openai_client,
        st_model=st_model,
        collection_name="interview_questions",
        job_role=data.job_role,
        softskill_label=data.softskill_label
    )
    first_q = session.ask_fixed_question("intro")
    session.store_answer(first_q, "")
    session_store[data.session_id] = session

    audio_url = generate_tts_audio(first_q)
    return {"question": first_q, "audio_url": audio_url}

@router.post("/next_question")
async def next_question(data: AnswerRequest, request: Request):
    session_store = request.app.state.session_store
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    last_q = session.state["history"][-1]["question"]
    session.store_answer(last_q, data.answer)

    # 종료 조건 체크
    import time
    if time.time() - session.start_time >= 600 and not session.state.get("final_question_given", False):
        final_q = session.ask_fixed_question("final")
        session_state["final_question_given"] = True
        session.store_answer(final_q, "")
        audio_url = generate_tts_audio(final_q)
        return {"question": final_q, "audio_url": audio_url, "done": False} # 답변을 받아야하기 때문에 False로

    # 마지막 질문이 주어지면
    if session.state.get("final_question_given", False):
        return{
            "message": "마지막 질문 답변을 기다립니다",
            "done": True
        }


    next_q = session.decide_next_question(data.answer)
    session.store_answer(next_q, "")
    audio_url = generate_tts_audio(next_q)
    return {"question": next_q, "audio_url": audio_url, "done": False}

@router.post("/final_answer")
async def final_answer(data: AnswerRequest,  request: Request):
    session_store = request.app.state.session_store
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    session.store_answer("면접을 마무리 하기 전에 마지막으로 하실 말 있나요?", data.answer)
    return {"message": "면접 종료", "history": session.state["history"]}
