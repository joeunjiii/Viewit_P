import datetime
from sqlalchemy import create_engine, text

# engine 싱글턴 관리
engine = create_engine("mysql+mysqlconnector://campus_24K_LI2_p3_2:smhrd2@project-db-campus.smhrd.com:3307/campus_24K_LI2_p3_2")

def insert_log(session_id, event, process, start_time, end_time=None):
    elapsed = None
    if end_time:
        elapsed = (end_time - start_time).total_seconds()
    # datetime 변환 보정 (datetime → string, DB에 맞춤)
    def dt(dtobj):
        if dtobj and isinstance(dtobj, datetime.datetime):
            return dtobj.strftime('%Y-%m-%d %H:%M:%S')
        return dtobj

    sql = text("""
               INSERT INTO LOG (SESSION_ID, EVENT, PROCESS, START_TIME, END_TIME, ELAPSED_TIME, INSERT_DATE)
               VALUES (:session_id, :event, :process, :start_time, :end_time, :elapsed, NOW())
               """)
    try:
        with engine.begin() as conn:
            conn.execute(sql, {
                "session_id": session_id,
                "event": event,
                "process": process,
                "start_time": dt(start_time),
                "end_time": dt(end_time),
                "elapsed": elapsed
            })
    except Exception as e:
        print(f"[LOGGING ERROR] {e}")
