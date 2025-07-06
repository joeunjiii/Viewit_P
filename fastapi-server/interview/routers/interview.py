from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
import os
import time
import random
from interview.interview_session import InterviewSession
from interview.services.tts_service import generate_tts_audio
from interview.services import feedback_service
from interview.utils.logging_utils import insert_log
import datetime

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

class EndRequest(BaseModel):
    session_id: str



# ── 세션 초기화 ──
@router.post("/init_session")
async def init_session(data: InitRequest, request: Request):

    # 1) 세션 초기화 시작
    t0 = datetime.datetime.now()
    insert_log(data.session_id, "init_session", "세션 초기화 시작", t0)


    st_model = request.app.state.st_model
    qdrant_client = request.app.state.qdrant_client
    openai_client = request.app.state.openai_client
    session_store = request.app.state.session_store

    # 2) 첫 질문 생성
    t1 = datetime.datetime.now()
    insert_log(data.session_id, "init_session", "질문 생성", t1)
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

    # 3) TTS 생성
    t2 = datetime.datetime.now()
    insert_log(data.session_id, "init_session", "TTS 생성 시작", t2)
    audio_url = generate_tts_audio(first_q, voice_id)
    t3 = datetime.datetime.now()
    insert_log(data.session_id, "init_session", "TTS 생성 완료", t2, t3)
    audio_url = generate_tts_audio(first_q, voice_id)


    # 4) 최초 상태 저장
    session.state["interviewerVoice"] = data.interviewerVoice
    session.store_answer(
        first_q, "",
        interviewer_name=interviewer_name,
        interviewer_role=interviewer_role,
        interviewer_voice_id=voice_id
    )
    session_store[data.session_id] = session


    return {
        "question": first_q,
        "audio_url": audio_url,
        "interviewer_name": interviewer_name,
        "interviewer_role": interviewer_role,
        "voice_id": voice_id,
        "done": False
    }



# ── 다음 질문 & 피드백 ──
@router.post("/next_question")
async def next_question(
        data: AnswerRequest, request: Request, authorization: str = Header(None)
):
    session_store = request.app.state.session_store
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    last_q = session.state["history"][-1]["question"]
    prev = session.state["history"][-1]
    name = prev.get("interviewer_name") or "AI면접관"
    role = prev.get("interviewer_role") or "기술"

    print(f"[DEBUG] interviewer_name={name}, interviewer_role={role}")
    session.store_answer(last_q, data.answer, interviewer_name=name, interviewer_role=role)

    # ⭐️[Spring DB 저장] 답변 저장!
    import requests
    payload = {
        "session_id": data.session_id,
        "question_text": last_q,
        "answer_text": data.answer,
        "answer_feedback": None,
        "interviewer_name": name,
        "interviewer_role": role
    }
    requests.post(f"{SPRING_URL}/api/interview", json=payload)
    # ⭐️[Spring DB 저장] 끝

    # 1) **로그**: 질문 생성 시작
    t1 = datetime.datetime.now()
    insert_log(data.session_id, "next_question", "질문 생성 시작", t1)

    # 1분 40초(100초) 경과 후 마지막 질문 던지기
    if time.time() - session.start_time >= 300 and not session.state.get("final_question_given"):
        fq, nn, nr, voice_id = session.ask_fixed_question("final")
        session.state["final_question_given"] = True
        session.state["final_answer_received"] = False  # 새로운 플래그 추가
        session.store_answer(fq, "", interviewer_name=nn, interviewer_role=nr, interviewer_voice_id=voice_id) \
        # ⭐️[Spring DB 저장] 마지막 질문도 빈 답변으로 저장!
        payload = {
            "session_id": data.session_id,
            "question_text": fq,
            "answer_text": "",
            "answer_feedback": None,
            "interviewer_name": nn,
            "interviewer_role": nr
        }
        requests.post(f"{SPRING_URL}/api/interview", json=payload)
        # ⭐️[Spring DB 저장] 끝

        t2 = datetime.datetime.now()
        insert_log(data.session_id, "next_question", "질문 생성 완료", t1, t2)
        # 3) **로그**: TTS 생성 시작
        t3 = datetime.datetime.now()
        insert_log(data.session_id, "next_question", "TTS 생성 시작", t3)
        audio_url = generate_tts_audio(fq, voice_id)
        # 4) **로그**: TTS 생성 완료
        t4 = datetime.datetime.now()
        insert_log(data.session_id, "next_question", "TTS 생성 완료", t3, t4)
        return {"question": fq, "audio_url": audio_url, "done": False}

    # 마지막 질문에 대한 답변이 도착했으면 final_answer_received를 True로 변경
    if session.state.get("final_quest3tion_given") and not session.state.get("final_answer_received"):
        # 여기서 last_q가 마지막 질문 텍스트인지 체크
        final_question_text = session.state["history"][-2]["question"]  # 마지막 질문 직전 질문
        # 또는 session.ask_fixed_question("final") 반환값 중 질문 텍스트를 저장해두고 비교
        # 간단히 last_q가 마지막 질문과 같다고 가정
        if last_q == session.state["history"][-2]["question"]:
            session.state["final_answer_received"] = True

    # 최종 질문 답변을 받았을 때만 피드백 생성 진행
    if session.state.get("final_question_given") and session.state.get("final_answer_received"):
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

        return {
            "message": "면접 종료 및 총평 미리보기",
            "final_feedback": {"summary": summary, "strengths": strengths, "weaknesses": weaknesses},
            "done": True,  # done True를 보내서 클라이언트가 종료 처리하도록
        }

    # 일반 질문
    nq, nn, nr, voice_id = session.decide_next_question(data.answer)
    # 1) **로그**: 질문 생성 완료
    t2 = datetime.datetime.now()
    insert_log(data.session_id, "next_question", "질문 생성 완료", t1, t2)
    # 2) **로그**: TTS 생성 시작
    t3 = datetime.datetime.now()
    insert_log(data.session_id, "next_question", "TTS 생성 시작", t3)
    audio_url = generate_tts_audio(nq, voice_id)
    # 3) **로그**: TTS 생성 완료
    t4 = datetime.datetime.now()
    insert_log(data.session_id, "next_question", "TTS 생성 완료", t3, t4)
    session.store_answer(nq, "", interviewer_name=nn, interviewer_role=nr, interviewer_voice_id=voice_id)

    # ⭐️[Spring DB 저장] 일반 질문(빈 답변) 저장
    payload = {
        "session_id": data.session_id,
        "question_text": nq,
        "answer_text": "",
        "answer_feedback": None,
        "interviewer_name": nn,
        "interviewer_role": nr
    }
    requests.post(f"{SPRING_URL}/api/interview", json=payload)
    # ⭐️[Spring DB 저장] 끝

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
async def final_answer(data: AnswerRequest, request: Request):
    session_store = request.app.state.session_store
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    session.store_answer("마지막으로 하실 말 있나요?", data.answer)
    return {"message": "면접 종료", "history": session.state["history"]}

@router.post("/end_session")
async def end_session(data: EndRequest, request: Request, authorization: str = Header(None)):
    session_id = data.session_id
    session_store = request.app.state.session_store
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    answers = feedback_service.fetch_all_interview_answers_from_spring(session_id, SPRING_URL)

    for i, item in enumerate(answers):
        interviewer_name = session.state["history"][i].get("interviewer_name", "AI면접관")
        interviewer_role = session.state["history"][i].get("interviewer_role", "기술")
        fb = feedback_service.generate_answer_feedback(
            request.app.state.openai_client,
            item.get('questionText') or item.get('question_text'),
            item.get('answerText') or item.get('answer_text'),
            interviewer_name=interviewer_name,
            interviewer_role=interviewer_role,
            )
        feedback_service.save_answer_feedback_to_spring(
            session_id,
            item.get('questionText') or item.get('question_text'),
            fb,
            SPRING_URL,
            interviewer_name=interviewer_name,
            interviewer_role=interviewer_role,
            token=authorization,
            )

    # 3. 총평/강점/약점 생성 및 저장
    fixed = [
        {
            "questionText": a.get("questionText") or a.get("question_text"),
            "answerText": a.get("answerText") or a.get("answer_text")
        }
        for a in answers
    ]
    summary, strengths, weaknesses = feedback_service.generate_final_feedback(request.app.state.openai_client, fixed)
    try:
        feedback_service.send_final_feedback_to_spring(
            session_id, summary, strengths, weaknesses, SPRING_URL, token=authorization
        )
    except Exception as e:
        print(f"[ERROR] 최종 피드백 저장 실패: {e}")
        raise HTTPException(500, "Spring에 총평 저장 실패")

    return {
        "message": "면접 종료 및 총평 저장 완료",
        "final_feedback": {
            "summary": summary,
            "strengths": strengths,
            "weaknesses": weaknesses
        }
    }
