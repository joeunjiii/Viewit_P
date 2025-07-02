from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from sqlalchemy.orm import joinedload
from fastapi import Query
from interview.uploads.models import (
    InterviewFeedback,
    InterviewSession,
    User,
    InterviewAnswer,
)  # SQLAlchemy 모델 예시
from interview.uploads.database import get_db  # DB 세션 의존성
from interview.routers.auth import get_current_user  # 인증 유저 추출 함수

router = APIRouter()
# 🔊 목소리 라벨 매핑
# VOICE_LABELS = {
#     "ErXwobaYiN019PkySvjV": "기본 목소리",
#     "21m00Tcm4TlvDq8ikWAM": "차분한 여성",
#     "TxGEqnHWrfWFTfGW9XjX": "명확한 남성",
# }


# 메인화면 5개 받아오는 api
@router.get("/api/user/sessions/latest")
def get_latest_sessions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    
    sessions = (
        db.query(InterviewSession)
        .filter_by(user_id=current_user["user_id"])
        .order_by(InterviewSession.started_at.desc())
        .limit(5)  # 최근 5개
        .all()
    )
    user = db.query(User).filter_by(user_id=current_user["user_id"]).first()

    result = []
    for session in sessions:
        # print("session.interviewer_voice:", session.interviewer_voice)
        feedback = (
            db.query(InterviewFeedback).filter_by(session_id=session.session_id).first()
        )

        # 질문 수 조회
        question_count = (
            db.query(func.count(InterviewAnswer.interview_id))
            .filter(InterviewAnswer.session_id == session.session_id)
            .scalar()
        )
        result.append(
            {
                "session_id": session.session_id,
                "job_role": session.job_role,
                "started_at": session.started_at,
                "question_count": question_count or 0,
                "wait_time": session.wait_time,
                # "interviewerVoice": session.interviewer_voice,
                # "interviewerVoiceLabel": VOICE_LABELS.get(session.interviewer_voice, "알 수 없음")
            }   
        )

    return result


# feeebackhistory컴포넌트 5개씩 랜더링는 api
@router.get("/api/user/sessions/history")
def get_user_sessions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(5, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    sessions = (
        db.query(InterviewSession)
        .filter_by(user_id=current_user["user_id"])
        .order_by(InterviewSession.started_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    user = db.query(User).filter_by(user_id=current_user["user_id"]).first()

    result = []
    for session in sessions:
        feedback = (
            db.query(InterviewFeedback).filter_by(session_id=session.session_id).first()
        )
        # ⬇️ 질문 개수 쿼리 추가!
        question_count = (
            db.query(func.count(InterviewAnswer.interview_id))
            .filter(InterviewAnswer.session_id == session.session_id)
            .scalar()
        )
        result.append(
            {
                "session_id": session.session_id,
                "job_role": session.job_role,
                "started_at": session.started_at,
                "question_count": question_count or 0,
                "wait_time": session.wait_time,
                # "interviewerVoice": session.interviewer_voice,
                # "interviewerVoiceLabel": VOICE_LABELS.get(session.interviewer_voice, "알 수 없음"),
                "feedback": {
                    "interview_strengths": (
                        feedback.interview_strengths if feedback else None
                    ),
                    "interview_weaknesses": (
                        feedback.interview_weaknesses if feedback else None
                    ),
                },
            }
        )

    return result


# 상세 세션 피드백 반환 API
@router.get("/api/feedback/{session_id}")
def get_session_feedback(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    print("===== [API 호출됨] session_id:", session_id)
    print("current_user:", current_user)
    # 본인 소유 세션만 반환 (보안)
    session = (
        db.query(InterviewSession)
        .filter_by(session_id=session_id, user_id=current_user["user_id"])
        .first()
    )
    print("쿼리 결과 session:", session)
    if not session:
        print("[404] 세션을 찾을 수 없습니다!")

        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    feedback = db.query(InterviewFeedback).filter_by(session_id=session_id).first()
    if feedback and feedback.interview_strengths:
        print("interview_strengths 원본:", feedback.interview_strengths)
    if feedback and feedback.interview_weaknesses:
        print("interview_weaknesses 원본:", feedback.interview_weaknesses)
    answers = (
        db.query(InterviewAnswer).filter_by(session_id=session_id)
        # .order_by(InterviewAnswer.question_index)
        .all()
    )

    return {
        "session_id": session.session_id,
        "name": current_user.get("name") or "",
        "date": session.started_at,
        "job": session.job_role,
        "summary": feedback.final_feedback if feedback else None,
        "strengths": (
            [s.strip() for s in feedback.interview_strengths.split(",")]
            if feedback and feedback.interview_strengths
            else []
        ),
        "weaknesses": (
            [w.strip() for w in feedback.interview_weaknesses.split(",")]
            if feedback and feedback.interview_weaknesses
            else []
        ),
        "questions": [
            {
                "question": a.question_text,
                "answer": a.answer_text,
                "feedback": a.answer_feedback,
            }
            for a in answers
        ],
        # 필요하면 더 추가 (score, duration, etc)
    }
