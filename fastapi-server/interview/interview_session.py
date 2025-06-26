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
        self.state = {
            "step": 0,
            "current_topic": None,
            "topic_count": 0,
            "history": [],
            "completed": False,
        }
        self.jdText = jdText
        self.pdfText = pdfText

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

    def ask_fixed_question(self, kind: str = "intro") -> str:
        return {
            "intro": "자기소개 부탁드립니다.",
            "final": "면접을 마무리하기 전에 마지막으로 하고 싶은 말이 있나요?",
        }.get(kind, "")

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
        self, question: str, answer: str, topic: str | None = None
    ) -> None:
        self.state["history"].append(
            {"question": question, "answer": answer, "topic": topic}
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

    def decide_next_question(self, last_answer: str) -> str:
        # 30% 확률로 공통 질문 섞기
        if self.job_role != "common" and random.random() < 0.3:
            common_q = self.get_random_common_question()
            if common_q and not self.is_too_similar_to_previous(common_q):
                return common_q

        # 1. 개인화 질문 분기
        if hasattr(self, "jdText") and (self.jdText or getattr(self, "pdfText", None)):
            prompt = f"""
당신은 AI 면접관입니다. 아래 지원자의 자기소개서, JD(직무기술서), 답변을 참고해, 개인화된 다음 면접 질문을 생성하세요.
[자기소개서/이력서]
{getattr(self, 'pdfText', '')}

[직무기술서]
{getattr(self, 'jdText', '')}

[지원직무] {self.job_role}
[응답 내용] {last_answer}

[이전 질문/답변 기록]
{history_text}

조건:
    - 지원자의 경험·프로젝트·직무 연관성을 구체적으로 묻는 질문이어야 합니다.
    - 기존 질문과 유사한 내용은 피하세요.
    - 답변이 짧거나 모호할 경우 확장 유도 문구를 포함하세요.
    - 친근하고 부드러운 말투를 사용하세요.
    

    
예시:
“해당 프로젝트에서 직면했던 가장 큰 기술적 난관과 이를 어떻게 해결하셨는지 구체적으로 말씀해 주시겠어요?”
→ 다음 질문:
""".strip()
        else:
            topic = self.state.get("current_topic")
            count = self.state.get("topic_count", 0)
            history_text = "\n".join(
                f"{i+1}) Q: {h['question']} / A: {h['answer']}"
                for i, h in enumerate(self.state["history"])
            )
            context = "\n".join(
                f"- {q}" for q, _ in self.search_similar_questions(last_answer)
            )

            prompt = f"""
    당신은 AI 면접관입니다. 사용자의 답변과 이전 면접 기록을 참고하여 다음 질문을 생성해주세요.

    [지원직무] {self.job_role}
    [현재 주제] {topic}
    [동일 주제 연속 질문 수] {count}
    [응답 내용] {last_answer}

    [기존 질문/답변]
    {history_text}

    [참고 유사 질문들]
    {context}

    조건:
    - 반드시 직무({self.job_role})에 맞는 내용으로 질문하세요.
    - 사용자가 부담없이 이야기할 수 있도록 부드럽고 친근한 말투로 질문하세요
    - 동일 주제에 대하여 3번 이상 묻지 말고, 새로운 주제로 자연스럽게 넘어가세요
    - 유사한 질문을 반복하지 마세요.
    - 사용자의 답변이 짧거나 모호하다면, 그 내용을 확장할 수 있도록 유도 질문을 하세요

    → 다음 질문:
    """.strip()

        # 최대 3회 생성 시도
        for _ in range(3):
            resp = self.openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "당신은 AI 면접관입니다."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=512,
            )
            nxt = resp.choices[0].message.content.strip()
            if not self.is_too_similar_to_previous(nxt):
                return nxt

        return nxt  # fallback
