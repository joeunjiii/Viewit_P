import time

from openai import OpenAI
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

from interview.interview_session import InterviewSession

if __name__ == "__main__":
    st_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    qdrant_client = QdrantClient(
        url="https://45cff26b-e6e3-4d99-b4e9-659b4822b35a.us-east4-0.gcp.cloud.qdrant.io:6333",
        api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.9QiHCRB2MlBmeEfAuwYlSEmJicTSx4kF7i-HU7pfAIU"
    )
    openai_client = OpenAI(
        api_key="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"
    )
    collection_name = "interview_questions"

    job_role = input("지원 직무를 선택하세요(Back-end, Front-end, AI)").strip().lower()

    session = InterviewSession(qdrant_client, openai_client, st_model, collection_name, job_role)

    print("자기소개 부탁드립니다")
    intro_answer = input("응답 : ")
    session.store_answer("자기소개 부탁드립니다", intro_answer)

    while True:
        if time.time() - session.start_time >= 600:
            print("10분 경과. 마지막 질문으로 전환됩니다.")
            break

        last_answer = session.state["history"][-1]["answer"]
        next_question = session.decide_next_question(last_answer)
        print(f"\n면접관 질문 : {next_question}")
        user_ans = input("응답 : ")
        session.store_answer(next_question, user_ans)

        if session.state["topic_count"] >= 3:
            print(" 사용자의 답변에 대한 3번 연속 질문. 다른 주제로 전환됩니다.")

    final_question = session.ask_fixed_question("final")
    print(f"면접관 질문 : {final_question}")
    final = input("응답 : ")
    session.store_answer(final_question, final)

    print("\n 면접 종료, 전체 질문/응답 로그:")
    for item in session.state["history"]:
        print(f"Q : {item['question']}\nA : {item['answer']}\n")
