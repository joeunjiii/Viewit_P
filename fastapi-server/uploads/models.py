from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class InterviewAnswer(Base):
    __tablename__ = "interview"
    interview_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    answer_feedback = Column(Text, nullable=True)

class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"
    interfeedback_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), nullable=False, index=True)
    interview_strengths = Column(Text, nullable=True)
    interview_weaknesses = Column(Text, nullable=True)
    final_feedback = Column(Text, nullable=True)
