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
                "system_msg":  "당신은 실무 기술 전문 면접관입니다. 다음 원칙을 반드시 따르세요.\n"
                               "- 각 질문은 반드시 한 번에 하나의 주제만 다루세요.\n"
                               "- 두 가지 이상의 항목을 묻지 마세요. (예: 'A와 B 모두 말해보세요' 금지)\n"
                               "- 답변이 모호하면 '한 문장'의 짧은 꼬리질문(follow-up question)만 한 번 추가하세요. (예: '구체적인 사례가 있나요?')\n"
                               "- 한 질문에 꼬리질문이 여러 개 붙는 것도 절대 금지. (최대 1개)\n"
                               "- 질문은 반드시 1~2문장 이내, 한 문장만 생성하는 것을 최우선으로 하세요.\n"
                               "- 질문 예시: '최근에 해결한 기술적 문제를 말씀해 주세요.' (O) / '최근 경험한 기술적 문제와 해결방법을 구체적으로 설명해 주세요.' (X, 두 가지 요구)\n"
                               "- 반드시 실무/기술/문제해결에만 집중하세요. 인성, 협업 등은 금지.\n"
            },
            {
                "name": "박AI",
                "role": "인성",
                "voice_id": "TxGEqnHWrfWFTfGW9XjX",
                "system_msg":    "당신은 인성 전문 면접관입니다. 다음 원칙을 반드시 지키세요.\n"
                                 "- 각 질문은 한 번에 하나의 소프트스킬(예: 협업, 소통, 배려, 책임감 등)이나 인성 요소만 묻는 한 문장으로 작성하세요.\n"
                                 "- 절대 두 가지 이상을 한 질문에 동시에 묻지 마세요. (예: '갈등 경험과 극복 방법을 모두 말해 주세요' 금지)\n"
                                 "- 답변이 모호하거나 짧을 때만, 한 문장의 짧은 꼬리질문(follow-up question)만 1회 추가할 수 있습니다.\n"
                                 "- 질문은 반드시 1~2문장 이내, 되도록 한 문장으로만 작성하세요.\n"
                                 "- 질문 예시는 반드시 한 가지 주제만 다루는 형태여야 합니다.\n"
                                 "- 인성과 관련된 실제 상황이나 행동, 생각을 구체적으로 확인할 수 있도록 묻고, 추상적/일반적 질문(예: '협업 경험 말씀해 주세요')은 금지하세요.\n"
                                 "- 기술, 창의력 등 인성과 직접 무관한 영역은 묻지 마세요."
            },
            {
                "name": "이AI",
                "role": "창의",
                "voice_id": "ErXwobaYiN019PkySvjV",
                "system_msg":     "당신은 창의적 문제해결 역량을 평가하는 전문 면접관입니다. 다음 원칙을 반드시 지키세요.\n"
                                  "- 각 질문은 한 번에 하나의 창의성/혁신/새로운 시도와 관련된 주제만 한 문장으로 작성하세요.\n"
                                  "- 복수의 항목을 한 질문에 포함하지 마세요. (예: '새로운 시도와 어려움 모두 말씀해 주세요' 금지)\n"
                                  "- 답변이 불분명하거나 짧을 때만, 한 문장의 follow-up question(꼬리질문)을 1회 추가할 수 있습니다.\n"
                                  "- 모든 질문은 1~2문장 이내, 되도록 한 문장으로만 하세요.\n"
                                  "- 추상적이지 않고, 지원자의 실제 경험이나 구체적 행동을 이끌어낼 수 있는 질문만 작성하세요.\n"
                                  "- 창의력과 무관한 인성, 기술, 기타 일반적 역량에 관한 질문은 하지 마세요.\n"
                                  "- 예시: '최근 스스로 시도해 본 새로운 방법이나 아이디어가 있나요?' (O)\n"
                                  "- 예시: '새로운 시도와 그 결과를 함께 설명해 주세요.' (X, 두 가지 요구)"
            },
        ]
        self.interviewer_index = 0  # 면접관 순차 교대
        self.last_interviewer_name = None  # 연속 배정 방지용

    # ----------------------------------------------------------
    # [추가] 질문 카테고리 분류 (아주 단순 키워드 기반, 필요시 확장)
    # ----------------------------------------------------------
    def classify_question_type(self, question: str) -> str:
        tech_keywords = ["성능", "시스템", "백엔드", "알고리즘", "코드", "기술"]
        personality_keywords = ["자기소개", "동기", "협업", "의사소통", "인성", "갈등"]
        creative_keywords = ["혁신", "창의", "새로운", "아이디어", "개선", "시도"]
        if any(word in question for word in tech_keywords):
            return "기술"
        elif any(word in question for word in personality_keywords):
            return "인성"
        elif any(word in question for word in creative_keywords):
            return "창의"
        else:
            return "인성"  # 기본 fallback

    # ----------------------------------------------------------
    # [추가] 역할별 면접관 가져오기
    # ----------------------------------------------------------
    def get_interviewer_by_role(self, role: str):
        return next((p for p in self.interviewer_profiles if p["role"] == role), self.interviewer_profiles[1])

    # ----------------------------------------------------------
    # [추가] 주면접관 외 다른 면접관 랜덤 배정
    # ----------------------------------------------------------
    def get_random_other_interviewer(self, exclude_role: str):
        roles = ["기술", "인성", "창의"]
        roles.remove(exclude_role)
        candidates = [p for p in self.interviewer_profiles if p["role"] in roles]
        return random.choice(candidates)

    # ----------------------------------------------------------
    # [추가] 논리(주면접관) + 다양성(랜덤) 혼합 배정
    # ----------------------------------------------------------
    def decide_next_interviewer(self, question_type: str, main_ratio: float = 0.75) -> dict:
        if random.random() < main_ratio:
            interviewer = self.get_interviewer_by_role(question_type)
        else:
            interviewer = self.get_random_other_interviewer(question_type)
        # 연속 면접관 방지
        if self.last_interviewer_name == interviewer["name"]:
            alt = self.get_random_other_interviewer(interviewer["role"])
            interviewer = alt
        self.last_interviewer_name = interviewer["name"]
        return interviewer

    # ----------------------------------------------------------
    # [기존] 랜덤 면접관 (이제는 사용하지 않아도 됨, 혹시 모르니 남겨둠)
    # ----------------------------------------------------------
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

    # ----------------------------------------------------------
    # [변경/핵심] decide_next_question - 논리+랜덤 면접관 배정 (main_ratio=0.75)
    # ----------------------------------------------------------
    def decide_next_question(self, last_answer: str) -> tuple[str, str, str, str]:
        """
        - 최근 질문 있으면 해당 질문에서 카테고리 추출(최초는 인성)
        - 75%는 논리적으로, 25%는 랜덤하게 다른 관점의 면접관 배정
        - 모든 결과는 interviewer_name/role까지 함께 반환 → DB 저장과 완벽 연동
        """
        if self.state["history"]:
            last_question = self.state["history"][-1]["question"]
            question_type = self.classify_question_type(last_question)
        else:
            question_type = "인성"

        interviewer = self.decide_next_interviewer(question_type, main_ratio=0.75)
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

아래 조건을 반드시 지키세요:
- 반드시 '{self.job_role}'와 직접적으로 관련된 실무/현장 중심의 질문을 **한 번에 하나의 핵심 주제만** 1문장으로 작성하세요.
- 답변이 명확하지 않을 때만, **한 문장**의 꼬리질문(follow-up question)만 추가하세요.
- 한 질문에 두 개 이상을 묻거나, 여러 문장을 이어붙이지 마세요.
- 예시와 같이, 각 질문은 반드시 1문장만 나오도록 하세요.
- 질문 예시를 생성하지 마세요. 반드시 실제 질문만 출력하세요.

[좋은 예]
"최근 팀 프로젝트에서 갈등이 발생했을 때, 본인은 어떤 역할을 했나요?"
"동료와의 소통에서 중요하게 생각하는 점은 무엇인가요?"
"실패를 경험한 후, 그 경험을 어떻게 성장의 기회로 삼으셨나요?"

[나쁜 예]
"협업 경험 말씀해 주세요."
"자기소개 해주세요."
"스트레스 받으면 어떻게 하나요?"

위의 [좋은 예]처럼, 자연스럽고 구체적인 면접 질문을 1문장만 출력하세요. (질문만 출력)
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

        # 면접관별 프롬프트 생성
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

아래 기준을 엄격히 지켜 다음 질문을 작성하세요:

- 반드시 '{self.job_role}'와 직접적으로 관련된 실무/현장 중심의 질문을 포함하세요
- 최근 3개 이내 질문, 동일/유사 주제는 절대 반복하지마세요.
- 지원자의 마지막 답변 내용({answer_desc})을 반드시 참고하세요.
- 답변이 짧거나 모호할 경우에만,  **한 문장 꼬리질문(예: '구체적인 사례가 있나요?')을 추가**하세요.
- **답변이 이미 충분히 구체적이라면, 꼬리질문은 추가하지 말고, 새로운 주제의 실무 질문만 생성하세요.**
- 면접 분위기는 부드럽고 친근하게, 그러나 전문성은 명확하게 해주세요.
- **질문 길이는 1~2문장 이내로 생성하세요.**
- 질문 예시를 생성하지 마세요. 반드시 실제 질문만 출력하세요.
- 꼬리질문(follow-up question)은 반드시 한 답변에 1~2번까지만 하세요.

[이전 Q/A]
{history_text}

[지원자 마지막 답변] {answer_desc}

---  
[좋은 예]  
"이 프로젝트에서 직접 담당하신 부분과 그 과정에서 겪었던 가장 큰 어려움은 무엇이었나요?"  
"최근에 새롭게 익힌 기술 중 실제 업무에 적용한 사례가 있다면 말씀해 주세요."  

[꼬리질문 예시]
"구체적인 해결 방안을 설명해 주실 수 있나요?"

[나쁜 예]  
"협업 경험 말씀해 주세요."  
"자기소개 부탁드립니다."  
"코드 예시를 들어보세요."  
---  
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
