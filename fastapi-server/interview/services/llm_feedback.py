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

아래 기준으로 피드백 작성하세요:
- 답변의 논리성, 구체성, 표현력, 직무적합성 등을 친절하게 2~3줄로 평가
- 너무 형식적이거나 모호하지 않게, 면접자가 바로 이해할 수 있게 작성

[출력 형식]
반드시 아래 예시와 **똑같은 형식**으로 출력하세요.
예시: {who} : 지원자님의 답변은 논리성이 부족합니다. 좀 더 구체적인 사례와 경험을 추가하면 좋겠습니다.

- **“{who} : ”로 시작하고, 뒤에는 문장만 붙여서 출력**
- 괄호나 []나 “” 같은 특수문자는 사용하지 마세요
- 절대로 다른 양식, 접두어나 불필요한 설명 없이 예시처럼만 출력
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

    아래 기준에 따라 각각 작성하세요:

    - 1. **총평**: 논리력, 적극성, 직무적합성 등 종합적으로 평가해서 3~4줄의 자연스러운 문장(문단)으로 작성 (예시: 지원자는 논리적인 답변을 잘 했으며, ...)
    - 2. **강점**: 2~3가지 핵심 강점을 '•' 기호로 시작하는 한 줄 키워드로만 작성 (문장 절대 금지)
    - 3. **약점**: 2~3가지 핵심 약점을 '•' 기호로 시작하는 한 줄 키워드로만 작성 (문장 절대 금지)

    [응답 형식]
    총평: (자연스러운 문장으로 3~4줄)
    강점:
    • (키워드)
    • (키워드)
    약점:
    • (키워드)
    • (키워드)

    예시:
    총평: 지원자는 논리적으로 답변을 구성하려는 노력이 돋보였으며, 적극적으로 질문에 임하는 태도를 보였습니다. 다만, 일부 답변에서 구체적인 경험이나 수치 제시가 부족했습니다. 직무에 대한 이해도는 높았으나, 실무 경험을 좀 더 어필할 필요가 있습니다.
    강점:
    • 논리적 사고력
    • 적극성
    약점:
    • 경험 부족
    • 구체성 부족

    예시와 완전히 같은 형식으로만 출력하세요. (문장/문단은 총평에서만, 강점/약점은 반드시 '•' 키워드로)
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
    summary = strengths = weaknesses = ""
    for line in text.split("\n"):
        if line.startswith("총평:"):
            summary = line.replace("총평:", "").strip()
        elif line.startswith("강점:"):
            strengths = line.replace("강점:", "").strip()
        elif line.startswith("약점:"):
            weaknesses = line.replace("약점:", "").strip()
    return summary, strengths, weaknesses
