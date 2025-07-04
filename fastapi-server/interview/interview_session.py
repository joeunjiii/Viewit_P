import time
import torch
from sentence_transformers import util
import random

class InterviewSession:
    def __init__(
            self,
            session_id: str,
            qdrant_client,
            openai_client,
            st_model,
            collection_name: str,
            job_role: str,
            softskill_label: str | None = None,
            jdText: str | None = None,
            pdfText: str | None = None,
    ):
        self.session_id = session_id
        self.qdrant_client = qdrant_client
        self.openai = openai_client
        self.embedder = st_model
        self.collection_name = collection_name
        self.start_time = time.time()
        self.job_role = job_role
        self.softskill_label = softskill_label
        self.jdText = jdText  # 그대로 유지
        self.pdfText = pdfText  # 그대로 유지
        self.state = {
            "step": 0,
            "current_topic": None,
            "topic_count": 0,
            "history": [],
            "completed": False,
        }
        self.interviewer_profiles = [
            {
                "name": "김AI",
                "role": "기술",
                "voice_id": "21m00Tcm4TlvDq8ikWAM",
                "system_msg": "당신은 기술면접관입니다. 지원자의 실무 능력, 문제해결력, 최신 기술 트렌드 이해, 구체적 경험 위주의 질문을 중시합니다."
                              "질문은 기술적 원리, 구현 과정, 본인이 직접 해결한 사례에 집중하세요"
                              "모호한 답변에는 꼬리 질문으로 원인/과정/결과를 반드시 구체적으로 파고듭니다"
                              "코드, 알고리즘, 성능 최적화, 장애 대응 경험, 실제 사용한 기술 등을 중심으로 질문을 생성하세요"
                              "인성·창의와 직접 관련 없는 내용이어야 하며, 절대 추상적/포괄적 질문(예: '협업 경험 말씀해보세요')은 피하세요."

            },
            {
                "name": "박AI",
                "role": "인성",
                "voice_id": "TxGEqnHWrfWFTfGW9XjX",
                "system_msg": "당신은 인성면접관입니다. 지원자의 태도, 협업능력, 동기, 커뮤니케이션, 스트레스 대처, 갈등 해결 방식 등에 초점을 맞춥니다. "
                              "지원자가 편안하게 이야기할 수 있도록 공감하고 배려하는 어투로 질문하세요. "
                              "구체적인 상황/사례를 물으며, 추상적 질문은 지양합니다. 기술 구현에 대한 질문은 삼가고, 인간적인 면과 조직 적응력, 동료와의 소통, 리더십, 자기성장 경험 등을 중심으로 질문을 만드세요."
            },
            {
                "name": "이AI",
                "role": "창의",
                "voice_id": "ErXwobaYiN019PkySvjV",
                "system_msg": "당신은 창의적 문제해결 면접관입니다. 고정관념을 벗어난 접근, 새로운 아이디어, 변화/개선 제안, 스스로 도전한 경험, 실패 후 배움 등에 초점을 맞춥니다. "
                              "질문은 열린 형태(Yes/No가 아닌), 정답이 없는 상황, 지원자만의 관점과 사고를 유도해야 하며, 단순 경험 나열은 피하세요. "
                              "창의·혁신을 끌어낼 수 있도록 질문은 상황 중심 또는 가상의 문제/상황 제시 형식도 환영합니다."
            },
        ]
        self.interviewer_index = 0  # 면접관 순차 교대

    def get_next_interviewer(self):
        interviewer = random.choice(self.interviewer_profiles)
        print(
            f"[DEBUG] 랜덤 면접관: {interviewer['name']} / voice_id: {interviewer['voice_id']}"
        )
        return interviewer

    def get_random_common_question(self) -> str | None:
        results = self.qdrant_client.search(
            collection_name=self.collection_name,
            query_vector=self.embedder.encode("공통 소프트스킬 질문").tolist(),
            limit=20,
            with_payload=True,
            query_filter={"must": [{"key": "job_role", "match": {"value": "common"}}]},
        )
        if results:
            questions = [
                r.payload.get("question") for r in results if r.payload.get("question")
            ]
            return random.choice(questions) if questions else None

    def ask_fixed_question(self, kind: str = "intro") -> tuple[str, str, str, str]:
        intro_questions = [
            "먼저 자기소개 부탁드립니다.",
            "본인을 한 문장으로 표현한다면 어떻게 소개하시겠어요?",
            "지원 동기와 함께 본인을 간단히 소개해 주세요.",
            "최근 가장 도전적이었던 경험과 함께 자기소개 해주세요.",
            "자신의 강점 위주로 자신을 소개해 주세요.",
        ]
        final_questions = [
            "면접을 마무리하기 전에 마지막으로 하고 싶은 말이 있나요?",
            "추가로 하고 싶은 말씀이 있으신가요?",
            "오늘 면접 소감이나 마지막으로 강조하고 싶은 점이 있으신가요?",
        ]
        interviewer = [p for p in self.interviewer_profiles if p["role"] == "인성"][0]
        if kind == "intro":
            q = random.choice(intro_questions)
        elif kind == "final":
            q = random.choice(final_questions)
        else:
            q = ""
        return q, interviewer["name"], interviewer["role"], interviewer["voice_id"]

    def search_similar_questions(
            self, query: str, top_k: int = 5
    ) -> list[tuple[str, float]]:
        query_vector = self.embedder.encode(query).tolist()
        filters = [{"key": "job_role", "match": {"value": self.job_role}}]
        if self.softskill_label:
            filters.append(
                {"key": "softskill_label", "match": {"value": self.softskill_label}}
            )

        results = self.qdrant_client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=top_k,
            with_payload=True,
            query_filter={"must": filters},
        )
        return [(r.payload.get("question", ""), r.score) for r in results]

    def store_answer(
            self,
            question: str,
            answer: str,
            topic: str | None = None,
            interviewer_name: str = None,
            interviewer_role: str = None,
            interviewer_voice_id: str = None,
    ) -> None:
        self.state["history"].append(
            {
                "question": question,
                "answer": answer,
                "topic": topic,
                "interviewer_name": interviewer_name,
                "interviewer_role": interviewer_role,
            }
        )
        if topic == self.state.get("current_topic"):
            self.state["topic_count"] += 1
        else:
            self.state["current_topic"] = topic
            self.state["topic_count"] = 1

    def is_too_similar_to_previous(
            self, new_question: str, threshold: float = 0.9
    ) -> bool:
        prev_qs = [item["question"] for item in self.state["history"]]
        if not prev_qs:
            return False
        new_vec = self.embedder.encode(new_question, convert_to_tensor=True)
        prev_vecs = self.embedder.encode(prev_qs, convert_to_tensor=True)
        sim = util.cos_sim(new_vec, prev_vecs)
        return torch.max(sim).item() > threshold

    def decide_next_question(self, last_answer: str) -> tuple[str, str, str, str]:
        interviewer = self.get_next_interviewer()
        interviewer_name = interviewer["name"]
        interviewer_role = interviewer["role"]
        system_msg = interviewer["system_msg"]
        voice_id = interviewer["voice_id"]

        history_text = "\n".join(
            f"{i+1}) Q: {h['question']} / A: {h['answer']}"
            for i, h in enumerate(self.state["history"])
        )
        is_short_or_passive = len(last_answer.strip()) < 20 or last_answer.strip() in [
            "잘 모르겠습니다",
            "없습니다",
            "생각이 나지 않습니다",
            "네",
            "아니오",
        ]
        common_count = sum(
            1 for item in self.state["history"] if item.get("topic") == "common"
        )
        total_count = len(self.state["history"])
        need_more_common = (common_count / (total_count + 1)) < 0.12

        answer_desc = (
            last_answer
            if last_answer and last_answer.strip() != ""
            else "(지원자가 아직 답변을 하지 않았음)"
        )

        # ---- JD/자소서 기반 질문 분기 (절대 건드리지 마세요!)
        if hasattr(self, "jdText") and (self.jdText or getattr(self, "pdfText", None)):
            prompt = f"""
당신은 기업의 인사 담당자(면접관) 역할을 맡은 AI 에이전트입니다.
저희 회사는 아래와 같은 역량과 경험을 갖춘 인재를 찾고 있습니다.

아래 자료를 참고해, 지원자가 기업 요구 직무에 실제로 적합한지 ‘검증’하기 위한 심층 질문을 생성하세요.

1번은 지원자의 포트폴리오 및 자기소개서이고, 2번은 저희가 공고로 올린 요구 직무와 주요 업무, 자격요건입니다.

[1번 지원자 포트폴리오/자기소개서]
{getattr(self, 'pdfText', '')}

[2번 직무 및 주요 업무, 필요 역량 안내]
{getattr(self, 'jdText', '')}

[응답 내용] {answer_desc}

[이전 질문/답변 기록]
{history_text}

질문 생성 가이드:
- 우리 회사가 찾는 인재상(아래 JD 참고)에 맞게, 지원자가 실제로 그런 역량이나 경험을 갖추었는지 확인할 수 있는 질문을 만드세요.
- 회사에서 중요하게 여기는 역량/경험이 실제로 있는지, 있다면 구체적으로 어떤 역할을 했는지, 사례를 묻는 질문이 좋습니다.
- JD 내용은 회사가 지원자에게 요구하는 것이므로, 면접관이 외부 정보처럼 다시 소개하지 말고 자연스럽게 언급하세요.
- 지원자의 답변이 모호하거나 부족할 때는, 더 구체적인 사례나 설명을 유도하는 추가 질문을 하세요.
- 이전 질문들과 동일한 질문은 하지마세요
- 지원자가 못들었다고 다시 질문해달라고하면 질문을 이전 질문을 한번하거나 다른 주제로 넘어가세요.

→ 다음 질문:    
""".strip()
            for _ in range(3):
                resp = self.openai.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.7,
                    max_tokens=512,
                )
                nxt = resp.choices[0].message.content.strip()
                if nxt and not self.is_too_similar_to_previous(nxt):
                    return nxt, interviewer_name, interviewer_role, voice_id
            return nxt, interviewer_name, interviewer_role, voice_id

        # -------- 공통질문(인성) 조건 충족 시에만 --------
        if interviewer_role == "인성" and need_more_common and is_short_or_passive:
            example_common_q = self.get_random_common_question()
            prompt = f"""
당신은 인성 면접관입니다. 지원자의 인성, 협업, 의사소통 등 소프트스킬을 파악하기 위한 질문을 하세요.

[공통질문 예시]
- {example_common_q if example_common_q else ''}

[이전 질문/답변]
{history_text}
[지원자 답변] {answer_desc}

질문 생성 가이드:
- 공통 소프트스킬(협업, 의사소통, 갈등관리 등)에 관한 새로운 질문을 1~2문장 이내로 작성하세요.
- 동일/유사 주제 반복 금지, 답변이 짧으면 다양한 각도에서 유도 질문.
"""
            for _ in range(3):
                response = self.openai.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": interviewer["system_msg"]},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.85,
                    max_tokens=256,
                )
                next_question = response.choices[0].message.content.strip()
                if not self.is_too_similar_to_previous(next_question):
                    return next_question, interviewer_name, interviewer_role, voice_id
            return next_question, interviewer_name, interviewer_role, voice_id

        # -------- 그 외(각 면접관 역할별 프롬프트) --------
        role_examples = {
            "기술": ["최근 경험한 기술적 문제를 어떻게 해결하셨나요?",
                   "코드 리뷰나 성능 개선을 주도한 경험이 있나요?",
                   "새로운 언어나 프레임워크를 도입했던 사례가 있나요?",
                   "운영 중 장애를 직접 해결한 경험을 구체적으로 설명해주세요",
                  ],
            "인성": ["팀워크가 중요했던 경험에 대해 말씀해 주세요.",
                    "스트레스를 관리하는 본인만의 방법이 있나요?",
                    "동료와의 협업에서 기억에 남는 일이 있었나요?",
                    "실패를 극복했던 경험을 말씀해주세요."],
            "창의": ["새로운 방식이나 아이디어로 일의 방식을 개선한 사례가 있나요?",
                    "정답이 없는 문제를 해결할 때 본인만의 접근법은 무엇인가요?",
                    "회사에 새로운 아이디어나 프로세스를 제안한 경험이 있나요?",
                    "실패한 경험에서 얻은 교훈을 어떻게 적용해봤나요?"]
        }
        prompt = f"""
당신은 '{interviewer_name}' 면접관({interviewer_role})입니다.
{system_msg}

[예시 질문] "{role_examples.get(interviewer_role, '')}"

[이전 Q/A]
{history_text}
[지원자 마지막 답변] {answer_desc}

질문 생성 가이드:
- '{interviewer_role}'의 시각으로 실무적/현장감 있는 심층질문을 1~2문장으로 만드세요.
- 답변이 짧으면, 그 내용을 더 구체적으로 유도하거나 새로운 각도에서 질문하세요.
- 사용자가 부담없이 이야기 할 수 있도록 부드럽고 친근한 말투로 질문하세요. 
- 각 질문은 *1~2문장 이내로 간결하고, 구체적으로 작성하세요*
- 질문 예시를 생성하지 마세요 
- 반드시 직무 ({self.job_role})에 맞는 실무적/현장감 있는 질문을 포함하세요
- 지원자의 {answer_desc}을 참고하여 꼬리질문을 생성하세요
- """
        for _ in range(3):
            response = self.openai.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.8,
                max_tokens=256,
            )
            next_question = response.choices[0].message.content.strip()
            if not self.is_too_similar_to_previous(next_question):
                return next_question, interviewer_name, interviewer_role, voice_id
        return next_question, interviewer_name, interviewer_role, voice_id  # fallback
