# # test_save.py
#
# from interview.uploads.database import SessionLocal
# from interview.uploads.models import InterviewFeedback
#
# db = SessionLocal()
# feedback = InterviewFeedback(
#     session_id="test_session_123",
#     interview_strengths="성실함, 논리적 사고",
#     interview_weaknesses="긴장감",
#     final_feedback="전반적으로 우수하나, 자신감 표현이 필요함"
# )
# db.add(feedback)
# db.commit()
# db.refresh(feedback)
# print("Inserted ID:", feedback.interfeedback_id)

from sqlalchemy import create_engine, text

DATABASE_URL = "mysql+mysqlconnector://campus_24K_LI2_p3_2:smhrd2@project-db-campus.smhrd.com:3307/campus_24K_LI2_p3_2"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("DESC interview_feedback"))
    for row in result:
        print(row)

