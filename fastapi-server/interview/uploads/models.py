from sqlalchemy import Column, Integer, String, Text ,BigInteger, DateTime
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()

class User(Base):
    __tablename__ = "USER"

    user_id = Column(BigInteger, primary_key=True, autoincrement=True)
    naver_id = Column(String(100), unique=True, nullable=False)
    name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=True)
    

class InterviewSession(Base):
    __tablename__ = "INTERVIEW_SESSION"

    session_id = Column(String(36), primary_key=True)
    user_id = Column(BigInteger, nullable=False)
    job_role = Column(String(100), nullable=True)
    started_at = Column(DateTime, nullable=False)
    interviewer_voice = Column(String(50), nullable=False)  
    wait_time = Column(Integer, nullable=False)  
    
    
class InterviewAnswer(Base):
    __tablename__ = "INTERVIEW"  # 반드시 실제 테이블 이름과 정확히 일치시켜야 합니다

    interview_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(36), nullable=True, index=True)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=False)
    answer_feedback = Column(Text, nullable=True)

class InterviewFeedback(Base):
    __tablename__ = "INTERVIEW_FEEDBACK"  # ← 대소문자 정확히 일치시켜야 함

    interfeedback_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(36), nullable=False, index=True)
    interview_strengths = Column(Text, nullable=True)
    interview_weaknesses = Column(Text, nullable=True)
    final_feedback = Column(Text, nullable=True)
