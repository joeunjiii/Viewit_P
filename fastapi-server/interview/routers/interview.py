# fastapi-server/interview/routers/interview.py

from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
import os
import time

from interview.interview_session import InterviewSession
from interview.services.tts_service import generate_tts_audio
from interview.services import feedback_service
from interview.utils.logger_utils import timing_logger



router = APIRouter()

# ── 설정 상수 ──
QUESTION_COUNT = 5
SPRING_URL     = os.getenv("SPRING_URL", "http://localhost:8083")

# ── 데이터 모델 ──
class InitRequest(BaseModel):
    session_id:      str
    job_role:        str
    softskill_label: str | None = None
    jdText:          str | None = None
    pdfText:         str | None = None

class AnswerRequest(BaseModel):
    session_id: str
    answer:     str

# ── 세션 초기화 엔드포인트 ──
@router.post("/init_session")
@timing_logger("세션 초기화 전체")
async def init_session(data: InitRequest, request: Request):
    st_model      = request.app.state.st_model
    qdrant_client = request.app.state.qdrant_client
    openai_client = request.app.state.openai_client
    session_store = request.app.state.session_store

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
        softskill_label=data.softskill_label,
        jdText=data.jdText,
        pdfText=data.pdfText,
    )
    first_q = session.ask_fixed_question("intro")
    session.store_answer(first_q, "")
    session_store[data.session_id] = session

    audio_url = generate_tts_audio(first_q)
    return {"question": first_q, "audio_url": audio_url}

# ── 후속 질문 + 자동 최종 피드백 엔드포인트 ──
@router.post("/next_question")
@timing_logger("다음 질문 ")
async def next_question(
        data: AnswerRequest,
        request: Request,
        authorization: str = Header(None)
):
    session_store = request.app.state.session_store
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    # 1) 이전 Q&A 저장
    last_q = session.state["history"][-1]["question"]
    session.store_answer(last_q, data.answer)

    # 2) 개별 피드백 생성 → Spring PUT 저장
    try:
        llm      = request.app.state.openai_client
        answer_fb = feedback_service.generate_answer_feedback(llm, last_q, data.answer)
        feedback_service.save_answer_feedback_to_spring(
            data.session_id, last_q, answer_fb,
            SPRING_URL, token=authorization
        )
    except Exception as e:
        print(f"[WARN] 개별 피드백 저장 실패: {e}")

    # 3) 5분 경과 시 final 질문 제공
    if time.time() - session.start_time >= 300 and not session.state.get("final_question_given"):
        final_q = session.ask_fixed_question("final")
        session.state["final_question_given"] = True
        session.store_answer(final_q, "")
        audio_url = generate_tts_audio(final_q)
        return {"question": final_q, "audio_url": audio_url, "done": False}

    # 4) 마지막 질문 이후 → 자동 최종 피드백 생성·저장·리턴
    if session.state.get("final_question_given"):
        # a) Spring에서 전체 Q&A 가져오기
        try:
            answers = feedback_service.fetch_all_interview_answers_from_spring(
                data.session_id, SPRING_URL
            )
        except Exception as e:
            print(f"[ERROR] Spring Q&A 조회 실패: {e}")
            raise HTTPException(500, "Spring DB에서 Q&A를 불러오지 못했습니다.")

        # c) CamelCase key 맞춤
        answers_fixed = [
            {
                "questionText": a.get("questionText") or a.get("question_text"),
                "answerText":   a.get("answerText")   or a.get("answer_text")
            }
            for a in answers
        ]

        # d) LLM으로 최종 피드백 생성
        llm = request.app.state.openai_client
        summary, strengths, weaknesses = feedback_service.generate_final_feedback(
            llm, answers_fixed
        )

        # e) Spring에 PUT 저장
        try:
            feedback_service.send_final_feedback_to_spring(
                data.session_id, summary, strengths, weaknesses, SPRING_URL
            )
        except Exception as e:
            print(f"[ERROR] 최종 피드백 저장 실패: {e}")
            raise HTTPException(500, "Spring에 총평 저장 실패")

        # f) 클라이언트에 바로 결과 리턴
        return {
            "message":       "면접 종료 및 총평 생성/저장 완료",
            "final_feedback": {
                "summary":    summary,
                "strengths":  strengths,
                "weaknesses": weaknesses
            }
        }

    # 5) 아직 final 단계가 아니면 다음 질문 생성·저장·TTS
    next_q = session.decide_next_question(data.answer)
    session.store_answer(next_q, "")
    try:
        audio_url = generate_tts_audio(next_q)
    except Exception:
        next_q = "질문 음성 생성에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
        audio_url = generate_tts_audio(next_q)

    return {"question": next_q, "audio_url": audio_url, "done": False}

# 최종 답변 및 전체 피드백 생성 엔드포인트
@router.post("/final_answer")
@timing_logger("마지막")
async def final_answer(data: AnswerRequest, request: Request):
    session_store = request.app.state.session_store
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    session.store_answer("마지막으로 하실 말 있나요?", data.answer)
    return {"message": "면접 종료", "history": session.state["history"]}
