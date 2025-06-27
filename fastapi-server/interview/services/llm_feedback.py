import re

# LLM 기반 피드백 생성 함수
def generate_answer_feedback(llm, question, answer):
    """
    단일 답변 피드백 생성
    """
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

def generate_final_feedback(llm, answers):
    """
    피드백 총평 생성
    """
    qas = "\n".join([
        f"{i+1}) Q: {item['question_text']} / A: {item['answer_text']} / F: {item['answer_feedback']}"
        for i, item in enumerate(answers)
    ])
    prompt = f"""
    [면접 전체 질문 및 답변 목록]
    {qas}

    아래 기준으로 3가지를 각각 한국어로 작성:
    - 1. 전체 면접에 대한 총평 (논리력, 적극성, 직무적합성 등 종합적으로 평가, 3~4줄)
    - 2. 강점  (2~3가지, 구체적 키워드)
    - 3. 약점 (2~3가지, 구체적 키워드)

    [응답형식]
    총평: …
    강점: …
    약점: …
    """
    resp = llm.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "당신은 인사담당자입니다."},
            {"role": "user",   "content": prompt}
        ],
        temperature=0.6,
        max_tokens=600
    )
    text = resp.choices[0].message.content.strip()
    print("=== [LLM 응답 원문] ===\n", text, "\n======================")

    # 정규표현식으로 총평/강점/약점 robust 추출
    summary = strengths = weaknesses = ""
    m = re.search(r"총평\s*[:\-]?\s*(.+?)(?:\n|$)", text)
    if m:
        summary = m.group(1).strip()
    m = re.search(r"강점\s*[:\-]?\s*(.+?)(?:\n|$)", text)
    if m:
        strengths = m.group(1).strip()
    m = re.search(r"약점\s*[:\-]?\s*(.+?)(?:\n|$)", text)
    if m:
        weaknesses = m.group(1).strip()

    print(f"[PARSED] summary: {summary}")
    print(f"[PARSED] strengths: {strengths}")
    print(f"[PARSED] weaknesses: {weaknesses}")
    return summary, strengths, weaknesses
