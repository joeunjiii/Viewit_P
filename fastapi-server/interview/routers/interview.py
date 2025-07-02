from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
import os
import time
import random
from interview.interview_session import InterviewSession
from interview.services.tts_service import generate_tts_audio
from interview.services import feedback_service
from interview.utils.logger_utils import timing_logger

router = APIRouter()

# ── 설정 상수 ──
SPRING_URL = os.getenv("SPRING_URL", "http://localhost:8083")


# ── 데이터 모델 ──
class InitRequest(BaseModel):
    session_id: str
    job_role: str
    softskill_label: str | None = None
    jdText: str | None = None
    pdfText: str | None = None
    interviewerVoice: str


class AnswerRequest(BaseModel):
    session_id: str
    answer: str



# ── 세션 초기화 ──
@router.post("/init_session")
@timing_logger("세션 초기화 전체")
async def init_session(data: InitRequest, request: Request):
    # 리소스 로드
    st_model = request.app.state.st_model
    qdrant_client = request.app.state.qdrant_client
    openai_client = request.app.state.openai_client
    session_store = request.app.state.session_store

    # 세션 생성
    session = InterviewSession(
        session_id=data.session_id,
        qdrant_client=qdrant_client,
        openai_client=openai_client,
        st_model=st_model,
        collection_name="interview_questions",
        job_role=data.job_role,
        softskill_label=data.softskill_label,
        jdText=data.jdText,
        pdfText=data.pdfText,
    )
    # 첫 질문 + 면접관 정보 + voice_id 한 번에 받기
    first_q, interviewer_name, interviewer_role, voice_id = session.ask_fixed_question("intro")
    
    session.store_answer(
        first_q, "",
        interviewer_name=interviewer_name,
        interviewer_role=interviewer_role,
        interviewer_voice_id=voice_id
    )
    session_store[data.session_id] = session

    audio_url = generate_tts_audio(first_q, voice_id)
    return {
        "question": first_q,
        "audio_url": audio_url,
        "interviewer_name": interviewer_name,
        "interviewer_role": interviewer_role,
        "voice_id": voice_id,
    }



# ── 다음 질문 & 피드백 ──
@router.post("/next_question")
@timing_logger("다음 질문")
async def next_question(
        data: AnswerRequest, request: Request, authorization: str = Header(None)
):
    session_store = request.app.state.session_store
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    # 1) 이전 Q&A 저장 (with interviewer info)
    last_q = session.state["history"][-1]["question"]
    prev = session.state["history"][-1]
    name = prev.get("interviewer_name") or "AI면접관"
    role = prev.get("interviewer_role") or "기술"

    print(f"[DEBUG] interviewer_name={name}, interviewer_role={role}")
    session.store_answer(last_q, data.answer, interviewer_name=name, interviewer_role=role)

    # 2) 개별 피드백 생성·저장
    try:
        llm = request.app.state.openai_client
        fb = feedback_service.generate_answer_feedback(
            llm, last_q, data.answer, interviewer_name=name, interviewer_role=role
        )
        feedback_service.save_answer_feedback_to_spring(
            data.session_id,
            last_q,
            fb,
            SPRING_URL,
            interviewer_name=name,
            interviewer_role=role,
            token=authorization,
        )
    except Exception as e:
        print(f"[WARN] 개별 피드백 저장 실패: {e}")

    # 3) 5분 경과 → final 질문
    if time.time() - session.start_time >= 300 and not session.state.get("final_question_given"):
        fq = session.ask_fixed_question("final")
        session.state["final_question_given"] = True
        session.store_answer(fq, "", interviewer_name=name, interviewer_role=role)
        audio_url = generate_tts_audio(fq, session.state["interviewerVoice"])
        return {"question": fq, "audio_url": audio_url, "done": False}

    # 4) final 이후 → 최종 피드백
    if session.state.get("final_question_given"):
        try:
            answers = feedback_service.fetch_all_interview_answers_from_spring(data.session_id, SPRING_URL)
        except Exception as e:
            print(f"[ERROR] Q&A 조회 실패: {e}")
            raise HTTPException(500, "Spring DB에서 Q&A를 불러오지 못했습니다.")

        fixed = [
            {"questionText": a.get("questionText") or a.get("question_text"),
             "answerText": a.get("answerText") or a.get("answer_text")}
            for a in answers
        ]
        summary, strengths, weaknesses = feedback_service.generate_final_feedback(request.app.state.openai_client, fixed)
        try:
            feedback_service.send_final_feedback_to_spring(
                data.session_id, summary, strengths, weaknesses, SPRING_URL, token=authorization
            )
        except Exception as e:
            print(f"[ERROR] 최종 피드백 저장 실패: {e}")
            raise HTTPException(500, "Spring에 총평 저장 실패")

        return {
            "message": "면접 종료 및 총평 저장 완료",
            "final_feedback": {"summary": summary, "strengths": strengths, "weaknesses": weaknesses},
        }

    # 5) 일반 다음 질문
    nq, nn, nr, voice_id = session.decide_next_question(data.answer)
    session.store_answer(nq, "", interviewer_name=nn, interviewer_role=nr,interviewer_voice_id=voice_id)
    audio_url = generate_tts_audio(nq, voice_id)
    return {
    "question": nq,
    "audio_url": audio_url,
    "interviewer_name": nn,
    "interviewer_role": nr,
    "voice_id": voice_id,
    "done": False
}


# ── 마지막 답변 수집 ──
@router.post("/final_answer")
@timing_logger("마지막")
async def final_answer(data: AnswerRequest, request: Request):
    session_store = request.app.state.session_store
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    session.store_answer("마지막으로 하실 말 있나요?", data.answer)
    return {"message": "면접 종료", "history": session.state["history"]}
