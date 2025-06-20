from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class InterviewLog(Base):
    __tablename__ = "INTERVIEW_SESSION"

    # 세션 ID
    session_id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # 사용자 ID
    user_id = Column(BigInteger, ForeignKey("USER.user_id"), nullable=False, index=True)

    # 지원 직무 타입
    job_type = Column(String(100), nullable=True)

    # 세션 시작 시간
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # 세션 종료 시간
    finished_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return (
            f"<InterviewSession(session_id={self.session_id}, "
            f"user_id={self.user_id}, job_type={self.job_type!r}, "
            f"started_at={self.started_at!r}, ended_at={self.ended_at!r})>"
        )