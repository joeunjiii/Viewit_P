from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Question(BaseModel):
    text: str

@app.post("/ask")
async def ask(q: Question):
    return {"answer": f"AI says: {q.text}"}

@app.get("/ask")
def test_get():
    return {"message": "연결 확인용 텍스트"}


# @app.get("/")
# async def root():
#     return {"message": "Hello World"}
#
#
# @app.get("/hello/{name}")
# async def say_hello(name: str):
#     return {"message": f"Hello {name}"}




