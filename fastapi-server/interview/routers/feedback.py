from fastapi import APIRouter, Request
from interview.services.feedback_service import save_answer_feedback_to_spring
from interview.services.feedback_service import save_final_feedback
from interview.services.llm_feedback import (
    generate_answer_feedback,
    generate_final_feedback
)
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()

SPRING_URL = "http://localhost:8083"  # 환경변수 추천

class AnswerInput(BaseModel):
    session_id: str
    question_text: str
    answer_text: str

class FinalFeedbackInput(BaseModel):
    session_id: str
    answers: List[Dict[str, str]]

@router.post("/answer")
def feedback_answer(
        input: AnswerInput,
        request: Request,
):
    llm = request.app.state.openai_client
    feedback = generate_answer_feedback(llm, input.question_text, input.answer_text)
    save_answer_feedback_to_spring(
        input.session_id, input.question_text, feedback, spring_url=SPRING_URL
    )
    return {"feedback": feedback}

@router.post("/final")
def feedback_final(
        input: FinalFeedbackInput,
        request: Request,
):
    llm = request.app.state.openai_client
    summary, strengths, weaknesses = generate_final_feedback(llm, input.answers)
    db = next(request.app.dependency_overrides.get("get_db", lambda: None)())
    save_final_feedback(
        db, input.session_id, strengths, weaknesses, summary) # 최종 피드백총평/강점/약점은 FastAPI에서 저장할 수 있게
    return {
        "summary": summary,
        "strengths": strengths,
        "weaknesses": weaknesses
    }
