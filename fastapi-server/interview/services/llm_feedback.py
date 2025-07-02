def generate_answer_feedback(llm, question, answer, interviewer_name=None, interviewer_role=None):
    """
    개별 답변 피드백 생성
    - 면접관 이름/역할을 답변 피드백에 반영

    interviewer_name, interviewer_role: 면접관 정보(문자열, 없으면 기본값)
    """
    # 면접관 정보 텍스트 만들기
    if interviewer_name and interviewer_role:
        who = f"{interviewer_name}/{interviewer_role}"
    elif interviewer_name:
        who = interviewer_name
    else:
        who = "면접관"

    prompt = f"""
[면접 질문] {question}
[지원자 답변] {answer}

아래 기준으로 피드백 작성:
- 답변의 논리성, 구체성, 표현력, 직무적합성 등을 친절하게 2~3줄로 평가
- 너무 형식적이거나 모호하지 않게, 면접자가 바로 이해할 수 있게 작성
- [출력 형식] "{who} 피드백: ..." 처럼 앞에 반드시 면접관 이름/역할을 포함해서 써주세요.
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

# 총평 피드백 함수는 손대지 않음
def generate_final_feedback(llm, answers):
    qas = "\n".join([
        f"{i+1}) Q: {item['questionText']} / A: {item['answerText']}"
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
    for line in text.split("\n"):
        if line.startswith("총평:"):
            summary = line.replace("총평:", "").strip()
        elif line.startswith("강점:"):
            strengths = line.replace("강점:", "").strip()
        elif line.startswith("약점:"):
            weaknesses = line.replace("약점:", "").strip()
    return summary, strengths, weaknesses
