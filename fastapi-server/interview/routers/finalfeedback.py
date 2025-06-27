from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from interview.services.finalfeedback_service import (
    get_all_feedbacks_from_spring,
    save_final_feedback,
)
from interview.services.llm_feedback import generate_final_feedback
from interview.uploads.database import SessionLocal

router = APIRouter(prefix="/api/feedback")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/final/{session_id}")
def feedback_final(session_id: str, db: Session = Depends(get_db)):
    """
    1. Spring에서 session_id별 전체 답변/피드백 받아옴
    2. LLM으로 총평/강점/약점 생성
    3. FastAPI DB에 저장
    4. 결과 반환 (프론트엔드 바로 활용 가능)
    """
    try:
        answers = get_all_feedbacks_from_spring(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Spring fetch error: {e}")

    from main import app  # FastAPI app.state에서 LLM 클라이언트 꺼내오기
    llm = app.state.openai_client

    summary, strengths, weaknesses = generate_final_feedback(llm, answers)
    save_final_feedback(db, session_id, strengths, weaknesses, summary)
    # 서버 로그로도 확인
    print(f"총평: {summary}\n강점: {strengths}\n약점: {weaknesses}")

    return {
        "summary": summary,
        "strengths": strengths,
        "weaknesses": weaknesses
    }
