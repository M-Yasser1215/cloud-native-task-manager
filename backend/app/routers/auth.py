import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, decode_access_token
from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    payload.update({"exp": expire, "type": "refresh"})
    from jose import jwt
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@router.post("/register", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, payload: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = models.User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        verified=False,
        verification_token=secrets.token_urlsafe(32),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "Account created."}


@router.post("/login", response_model=schemas.TokenWithRefresh)
@limiter.limit("10/minute")
def login(request: Request, payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return schemas.TokenWithRefresh(
        access_token=access_token,
        refresh_token=refresh_token,
        user=schemas.UserOut.model_validate(user)
    )


@router.post("/refresh", response_model=schemas.TokenWithRefresh)
@limiter.limit("30/minute")
def refresh(request: Request, payload: schemas.RefreshRequest, db: Session = Depends(get_db)):
    from jose import JWTError, jwt
    try:
        data = jwt.decode(payload.refresh_token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        if data.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user_id = data.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return schemas.TokenWithRefresh(
        access_token=access_token,
        refresh_token=refresh_token,
        user=schemas.UserOut.model_validate(user)
    )