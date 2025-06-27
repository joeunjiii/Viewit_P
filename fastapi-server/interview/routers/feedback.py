# interview/routers/feedback.py
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List, Dict

from interview.services.feedback_service import (
    save_answer_feedback_to_spring,
)
from interview.services.llm_feedback import (
    generate_answer_feedback,
)
router = APIRouter(prefix="/api/feedback")

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
