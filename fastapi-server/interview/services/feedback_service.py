import requests


# 답변 피드백 생성 (LLM 호출)
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
            {"role": "user", "content": prompt}
        ],
        temperature=0.6,
        max_tokens=250
    )
    return resp.choices[0].message.content.strip()

# Spring 서버에 answer_feedback 업데이트 요청
def save_answer_feedback_to_spring(session_id, question_text, answer_feedback, spring_url, token=None):
    headers = {}
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
