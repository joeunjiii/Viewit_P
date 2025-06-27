from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from interview.services.finalfeedback_service import (
    get_all_feedbacks_from_spring,
    save_final_feedback,
)
from interview.services.llm_feedback import generate_final_feedback
from interview.uploads.database import SessionLocal
from fastapi import Request

router = APIRouter(prefix="/api/feedback")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class AnswerRequest(BaseModel):
    session_id: str
    answer: str

@router.post("/final_answer")
async def final_answer(data: AnswerRequest, request: Request, db: Session = Depends(get_db)):
    """
    1. 면접 종료 시점에서 호출되는 API
    2. 마지막 답변을 세션에 저장
    3. Spring 서버에서 session_id로 해당 세션 전체 답변과 피드백 목록을 조회
    4. LLM을 호출하여 총평, 강점, 약점을 생성
    5. FastAPI DB에 총평 피드백 저장 (자동 저장)
    6. 생성된 총평 결과를 반환
    """

    # 1) FastAPI 앱 상태에서 세션 저장소, LLM 클라이언트 꺼내기
    session_store = request.app.state.session_store
    llm = request.app.state.openai_client

    # 2) 면접 세션 가져오기
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 3) 마지막 질문 저장 ("마지막으로 하실 말 있나요?" 같은 고정 질문)
    session.store_answer("마지막으로 하실 말 있나요?", data.answer)

    # 4) Spring 서버에서 session_id로 전체 답변+피드백 가져오기
    try:
        answers = get_all_feedbacks_from_spring(data.session_id)
    except Exception as e:
        # Spring 서버 호출 실패 시 에러 반환
        raise HTTPException(status_code=500, detail=f"Spring fetch error: {e}")

    # 5) LLM으로 총평, 강점, 약점 생성
    summary, strengths, weaknesses = generate_final_feedback(llm, answers)

    # 6) FastAPI DB에 총평 저장
    save_final_feedback(db, data.session_id, strengths, weaknesses, summary)

    # 7) 결과 로그 출력
    print(f"=== 면접 최종 총평 저장 완료 ===")
    print(f"session_id: {data.session_id}")
    print(f"총평: {summary}")
    print(f"강점: {strengths}")
    print(f"약점: {weaknesses}")
    print(f"============================")

    # 8) 클라이언트에 총평 결과 반환
    return {
        "message": "면접 종료 및 총평 저장 완료",
        "summary": summary,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "history": session.state["history"]
    }
