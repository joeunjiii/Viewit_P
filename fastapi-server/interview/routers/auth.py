import jwt
from fastapi import Depends, HTTPException, Header
from typing import Dict, Any
from sqlalchemy.orm import Session
from interview.uploads.database import get_db
from interview.uploads.models import User 
SPRING_JWT_SECRET = "ThisIsASecretKeyThatIsAtLeast32BytesLong!!"
SPRING_JWT_ALGORITHM = "HS256"

def get_current_user(
    Authorization: str = Header(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    try:
        scheme, token = Authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")

        payload = jwt.decode(token, SPRING_JWT_SECRET, algorithms=[SPRING_JWT_ALGORITHM])
        email = payload.get("sub")  # 이게 실제로 email임
        name = payload.get("name")

        if not email:
            raise HTTPException(status_code=401, detail="No email in token")

        # 🔥 DB에서 진짜 user_id 조회
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        print(f"✅ 인증된 사용자: {user.name} (ID: {user.user_id})")

        return {"user_id": user.user_id, "name": user.name, "payload": payload}

    except Exception as e:
        print("❌ JWT 디코딩 실패:", str(e))
        raise HTTPException(status_code=401, detail=f"Token invalid: {e}")