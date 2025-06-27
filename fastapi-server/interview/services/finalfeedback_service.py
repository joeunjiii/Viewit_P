import requests
from interview.uploads.models import InterviewFeedback


SPRING_URL = "http://localhost:8083"  # 운영환경에 맞게 수정

def get_all_feedbacks_from_spring(session_id):
    """
    Spring 서버에서 session_id별 모든 답변/피드백 목록 가져오기
    (Spring 반환 예시: [{question_text, answer_text, answer_feedback}, ...])
    """
    url = f"{SPRING_URL}/api/interview/feedbacks/{session_id}"
    res = requests.get(url)
    res.raise_for_status()
    return res.json()

def save_final_feedback(db, session_id, strengths, weaknesses, summary):
    """
    FastAPI DB(interview_feedback)에 총평/강점/약점 저장
    """
    feedback = InterviewFeedback(
        session_id=session_id,
        interview_strengths=strengths,
        interview_weaknesses=weaknesses,
        final_feedback=summary
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
