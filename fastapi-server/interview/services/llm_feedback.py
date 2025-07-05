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
- 답변의 논리성, 구체성, 표현력, 직무적합성 등을 2~3줄로 평가하세요.
- 너무 형식적이거나 모호하지 않게, 면접자가 바로 이해할 수 있게 작성하세요.

[출력 형식 예시]
박AI/인성 피드백: 응답은 구체적이고 논리적이며 꼼꼼함을 잘 보여줍니다. 더 구체적인 예시를 들어 설명했으면 더 좋았을 것 같습니다. 직무에 대한 이해와 책임감을 잘 보여줍니다.

[지켜야 할 규칙]
- 반드시 위의 출력 형식과 동일하게 '{who} 피드백:'으로 시작하세요.
- 불필요한 추가 설명, 사족, 해설, 예시는 절대 쓰지 마세요.
- 질문에 대한 평가(논리성, 구체성, 직무적합성 등)만 간단명료하게 서술하세요.
"""
    resp = llm.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "당신은 국내 대기업 인사담당자이며, 실무 면접 평가 피드백 및 강점/약점을 전문적으로 정리하는 역할입니다. "
                                          "모든 출력은 반드시 안내된 출력 형식과 예시에 정확히 맞춰야 하며, 지시 이외의 문장은 절대 추가하지 마세요. "
                                          "출력은 일관되고 간결해야 하며, 프롬프트에 정의된 예시를 반드시 준수하세요."},
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

★★★ 반드시 아래 출력 형식만 엄격히 따르세요! ★★★

총평: (3~4줄 논리적 문장, 종합 평가)
강점: 키워드1,키워드2,키워드3 (콤마(,)로 구분된 키워드만, 문장 금지!)
약점: 키워드1,키워드2,키워드3 (콤마(,)로 구분된 키워드만, 문장 금지!)

[출력 예시]
총평: 지원자는 논리력이 뛰어나고 책임감이 강해 보입니다. 면접 내내 명확하게 자신의 생각을 표현했습니다. 적극적인 태도와 직무 이해도도 높았습니다.
강점: 공감능력, 책임감, 논리적 사고
약점: 자기표현 부족, 세부 집중, 경험 부족

[금지 예시]
강점: 지원자는 공감능력이 뛰어나며 책임감이 강하고 논리적으로 사고합니다. (문장, 금지!)
약점: 때때로 세부적인 부분에 집중하다가 전체 흐름을 놓칠 수 있습니다. (문장, 금지!)

★★★ 강점/약점은 반드시 한글 키워드만, 콤마(,)로 구분해서 작성! 절대 문장 X! ★★★
    """
    resp = llm.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "당신은 인사 담당자입니다."},
            {"role": "user",   "content": prompt}
        ],
        temperature=0.4,
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