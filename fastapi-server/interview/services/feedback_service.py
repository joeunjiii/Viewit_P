import os
import requests

# Spring 기본 URL
SPRING_URL = os.getenv("SPRING_URL", "http://localhost:8083")


def generate_answer_feedback(
        llm,
        question: str,
        answer: str,
        interviewer_name: str | None = None,
        interviewer_role: str | None = None
) -> str:
    """
    개별 답변 피드백 생성
    - interviewerName/interviewerRole 을 프롬프트에 반영
    """
    who = (
        f"{interviewer_name}/{interviewer_role}"
        if interviewer_name and interviewer_role
        else interviewer_name or interviewer_role or "면접관"
    )
    prompt = f"""
[면접 질문] {question}
[지원자 답변] {answer}

아래 기준으로 피드백 작성:
- 답변의 논리성, 구체성, 표현력, 직무적합성 등을 2~3줄로 평가
- 너무 형식적이거나 모호하지 않게 작성
- "[{who} 피드백: ...]" 형태로 시작하세요.
"""
    resp = llm.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "당신은 인사담당자입니다."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.6,
        max_tokens=250,
    )
    return resp.choices[0].message.content.strip()


def save_answer_feedback_to_spring(
        session_id: str,
        question_text: str,
        answer_feedback: str,
        spring_url: str = SPRING_URL,
        interviewer_name: str | None = None,
        interviewer_role: str | None = None,
        token: str | None = None
) -> str:
    """
    Spring 서버에 개별 피드백 저장
    - 반드시 키: interviewerName, interviewerRole
    """
    name = interviewer_name or "AI면접관"
    role = interviewer_role or "기술"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = {
        "sessionId": session_id,
        "questionText": question_text,
        "answerFeedback": answer_feedback,
        "interviewerName": name,
        "interviewRole": role
    }
    url = f"{spring_url}/api/interview/answer/feedback"
    res = requests.put(url, json=body, headers=headers)
    res.raise_for_status()
    return res.text


def fetch_all_interview_answers_from_spring(
        session_id: str,
        spring_url: str = SPRING_URL
) -> list[dict]:
    url = f"{spring_url}/api/interview/{session_id}"
    res = requests.get(url)
    res.raise_for_status()
    return res.json()


def generate_final_feedback(
        llm,
        answers: list[dict]
) -> tuple[str, str, str]:
    qas = "\n".join(
        f"{i+1}) Q: {item['questionText']} / A: {item['answerText']}"
        for i, item in enumerate(answers)
    )
    prompt = f"""
[면접 전체 질문 및 답변 목록]
{qas}

아래 형식으로 작성:
총평: …
강점: …
약점: …
"""
    resp = llm.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "당신은 인사담당자입니다."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.6,
        max_tokens=600,
    )
    text = resp.choices[0].message.content.strip()
    summary = strengths = weaknesses = ""
    for line in text.splitlines():
        if line.startswith("총평:"):
            summary = line.split(":", 1)[1].strip()
        elif line.startswith("강점:"):
            strengths = line.split(":", 1)[1].strip()
        elif line.startswith("약점:"):
            weaknesses = line.split(":", 1)[1].strip()
    return summary, strengths, weaknesses


def send_final_feedback_to_spring(
        session_id: str,
        summary: str,
        strengths: str,
        weaknesses: str,
        spring_url: str = SPRING_URL,
        token: str | None = None
) -> str:
    url = f"{spring_url}/api/interview/final/feedback"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = {
        "sessionId": session_id,
        "finalFeedback": summary,
        "interviewStrengths": strengths,
        "interviewWeaknesses": weaknesses
    }
    res = requests.put(url, json=body, headers=headers)
    res.raise_for_status()
    return res.text
