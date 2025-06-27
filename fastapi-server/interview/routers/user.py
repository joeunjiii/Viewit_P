from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from interview.uploads.models import  InterviewFeedback,InterviewSession,User  # SQLAlchemy 모델 예시
from interview.uploads.database import get_db  # DB 세션 의존성
from interview.routers.auth import get_current_user      # 인증 유저 추출 함수

router = APIRouter()

@router.get("/api/user/sessions")
def get_user_sessions(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).filter_by(user_id=current_user["user_id"]).all()
    user = db.query(User).filter_by(user_id=current_user["user_id"]).first()

    result = []
    for session in sessions:
        feedback = db.query(InterviewFeedback).filter_by(session_id=session.session_id).first()
        result.append({
            "session_id": session.session_id,
            "job_role": session.job_role,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "user_name": user.name if user else None,
            "feedback": {
                "interview_strengths": feedback.interview_strengths if feedback else None,
                "interview_weaknesses": feedback.interview_weaknesses if feedback else None,
            }
        })

    return result