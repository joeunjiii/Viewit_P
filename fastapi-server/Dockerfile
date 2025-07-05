FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .

# 빌드에 필요한 도구 설치
RUN apt-get update && apt-get install -y build-essential gcc g++

RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
