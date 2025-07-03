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
                "voice_id": "7Nah3cbXKVmGX7gQUuwz",
                "system_msg": "당신은 기술면접관입니다. 깊이있고 논리적인 질문을 던집니다.",
            },
            {
                "name": "박AI",
                "role": "인성",
                "voice_id": "fLvpMIGwcTmxzsUF4z1U",
                "system_msg": "당신은 인성면접관입니다. 따뜻하고 배려 깊은 질문을 던집니다.",
            },
            {
                "name": "이AI",
                "role": "창의",
                "voice_id": "YBRudLRm83BV5Mazcr42",
                "system_msg": "당신은 창의적이고 문제해결 중심의 면접관입니다. 열린 질문을 좋아합니다.",
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
        if kind == "intro":
            q = random.choice(intro_questions)
        elif kind == "final":
            q = random.choice(final_questions)
        else:
            q = ""
        interviewer = self.get_next_interviewer()
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

    def decide_next_question(self, last_answer: str) -> tuple[str, str, str,str]:
        interviewer = self.get_next_interviewer()
        interviewer_name = interviewer["name"]
        interviewer_role = interviewer["role"]
        system_msg = interviewer["system_msg"]
        voice_id = interviewer["voice_id"]
        
        # ✅ 여기 추가하세요
        stt_failure_keywords = ["예", "아니오", "잘 모르겠", "모르겠습니다", "죄송", "못 들었"]
        is_stt_fail = (
            len(last_answer.strip()) < 10 or
            any(k in last_answer for k in stt_failure_keywords)
    )

        # history_text 항상 준비
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
        need_more_common = (common_count / (total_count + 1)) < 0.3

        answer_desc = (
            last_answer
            if last_answer and last_answer.strip() != ""
            else "(지원자가 아직 답변을 하지 않았음)"
            
        )
        # ---- JD/자소서 기반 질문 분기 (★변수명 그대로 사용★)
        if hasattr(self, "jdText") and (self.jdText or getattr(self, "pdfText", None)):
            prompt = f"""
당신은 기업의 인사 담당자(면접관) 역할을 맡은 AI 에이전트입니다.
저희 회사는 아래와 같은 역량과 경험을 갖춘 인재를 찾고 있습니다.

아래 자료를 참고해, 지원자가 기업 요구 직무에 실제로 적합한지 ‘검증’하기 위한 심층 질문을 생성하세요.

1번은 지원자의 포트폴리오 및 자기소개서이고, 2번은 저희가 공고로 올린 요구 직무(JD)와 주요 업무, 자격요건입니다.

[1번 지원자 포트폴리오/자기소개서]
{getattr(self, 'pdfText', '')}

[2번 직무 및 주요 업무, 필요 역량 안내]
{getattr(self, 'jdText', '')}

[응답 내용] {answer_desc}

{"※ 현재 답변은 음성 인식 오류 또는 부정확한 응답으로 판단됩니다. JD나 자소서 내용을 활용해 자연스럽게 연결되는 새로운 질문을 생성해 주세요." if is_stt_fail else ""}

[이전 질문/답변 기록]
{history_text}

질문 생성 가이드:
- JD 또는 자소서 내용을 참고해, 지원자가 실제로 해당 역량과 경험을 갖추었는지 파악할 수 있도록 질문하세요.
- 회사에서 중요하게 여기는 역량/경험이 실제로 있는지, 있다면 구체적으로 어떤 역할을 했는지, 사례를 묻는 질문이 좋습니다.
- 동일한 질문 반복은 피하고, 이전 질문과 유사한 주제라도 문맥이나 표현이 중복되지 않도록 유의하세요.
- STT 오류나 부정확한 응답이 있을 경우, 그 내용을 보완하거나 다른 측면에서 다시 확인할 수 있는 방향으로 질문을 구성하세요.
- ***질문은 최대 2문장, 250자 이내로 작성하세요.***

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
                if not nxt or not nxt.strip():
                    continue
                if not self.is_too_similar_to_previous(nxt):
                    return nxt, interviewer_name, interviewer_role,voice_id
            return nxt, interviewer_name, interviewer_role,voice_id

        # 공통질문(소프트스킬) LLM 생성
        if is_short_or_passive or need_more_common:
            example_common_q = self.get_random_common_question()
            prompt = f"""
아래는 공통 소프트스킬 면접질문의 예시입니다.
[공통질문 예시]
- {example_common_q if example_common_q else ''}
[기존질문/답변]
{history_text}

→ 새 공통질문:
""".strip()
            for _ in range(3):
                response = self.openai.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.85,
                    max_tokens=256,
                )
                next_question = response.choices[0].message.content.strip()
                if not self.is_too_similar_to_previous(next_question):
                    return next_question, interviewer_name, interviewer_role, voice_id
            return next_question, interviewer_name, interviewer_role,voice_id  # fallback

        # 직무 Pool 기반 질문 생성
        example_job_q = (
            self.get_random_common_question()
            if self.job_role == "common"
            else self.get_random_common_question()
        )
        similar_qas = self.search_similar_questions(last_answer, top_k=3)
        retrieved_context = "\n".join([f"- {q}" for q, _ in similar_qas])
        prompt = f"""
아래는 {self.job_role} 직무 면접질문의 예시입니다.
[직무질문 예시]
- {example_job_q if example_job_q else ''}

아래는 사용자의 최근 답변입니다.
[응답]
{last_answer}

아래는 기존에 했던 질문/답변과 유사질문 예시입니다.
[기존질문/답변]
{history_text}

[참고 유사질문 Pool]
{retrieved_context}

이 예시들을 참고하되, 같은 문장이나 주제를 반복하지 말고,
최근 3개 질문(카테고리/문장 포함)과 겹치지 않는 완전히 새로운 {self.job_role} 직무 면접 질문을 자연스럽게 생성하세요.

→ 새 직무질문:
""".strip()
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
                return next_question, interviewer_name, interviewer_role,voice_id
        return next_question, interviewer_name, interviewer_role, voice_id  # fallback
