import os
import requests

# Spring 기본 URL (환경변수 또는 기본값)
SPRING_URL = os.getenv("SPRING_URL", "http://localhost:8083")

# ========== 1. 개별 피드백 (답변 1개 단위) ==========

def generate_answer_feedback(llm, question, answer):
    prompt = f"""
    [면접 질문] {question}
    [지원자 답변] {answer}
    아래 기준으로 피드백 작성:
    - 답변의 논리성, 구체성, 표현력, 직무적합성 등을 친절하게 2~3줄로 평가
    - 너무 형식적이거나 모호하지 않게, 면접자가 바로 이해할 수 있게 작성
    """
    resp = llm.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "당신은 인사담당자입니다."},
            {"role": "user",   "content": prompt}
        ],
        temperature=0.6,
        max_tokens=250
    )
    return resp.choices[0].message.content.strip()

def save_answer_feedback_to_spring(
        session_id: str,
        question_text: str,
        answer_feedback: str,
        spring_url: str = SPRING_URL,
        token: str | None = None
) -> str:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = {
        "sessionId": session_id,
        "questionText": question_text,
        "answerFeedback": answer_feedback
    }
    url = f"{spring_url}/api/interview/answer/feedback"
    res = requests.put(url, json=body, headers=headers)
    res.raise_for_status()
    return res.text

# ========== 2. 최종 피드백 (모든 답변 모아 총평) ==========

def fetch_all_interview_answers_from_spring(
        session_id: str,
        spring_url: str = SPRING_URL
) -> list[dict]:
    """
    Spring에서 session_id에 해당하는 모든 질문·답변(및 개별 피드백) 리스트를 조회
    """
    url = f"{spring_url}/api/interview/{session_id}"
    res = requests.get(url)
    res.raise_for_status()
    return res.json()

def generate_final_feedback(
        llm,
        answers: list[dict]
) -> tuple[str, str, str]:
    """
    전체 질문·답변 목록을 LLM에 전달하여
    (1) 총평, (2) 강점, (3) 약점을 생성
    """
    qas = "\n".join(
        f"{i+1}) Q: {item['questionText']} / A: {item['answerText']}"
        for i, item in enumerate(answers)
    )
    prompt = f"""
    [면접 전체 질문 및 답변 목록]
    {qas}

    아래 기준으로 3가지를 각각 한국어로 작성:
    - 1. 전체 면접에 대한 총평 (논리력, 적극성, 직무적합성 등 종합적으로 평가, 3~4줄)
    - 2. 강점  (2~3가지, 구체적 키워드)
    - 3. 약점  (2~3가지, 구체적 키워드)

    [응답형식]
    총평: …
    강점: …
    약점: …
    """
    resp = llm.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "당신은 인사담당자입니다."},
            {"role": "user",   "content": prompt}
        ],
        temperature=0.6,
        max_tokens=600
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
    """
    Spring에 최종 피드백을 PUT 으로 저장
    엔드포인트: /api/feedback/final/feedback
    """
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