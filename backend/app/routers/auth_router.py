import secrets
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token
from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

GMAIL_SENDER = "mohammed.yasser1216@gmail.com"


def send_verification_email(email: str, username: str, token: str):
    verify_url = f"{settings.frontend_url}/verify?token={token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your Taskr account"
    msg["From"] = f"Taskr <{GMAIL_SENDER}>"
    msg["To"] = email

    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem; background: #0c0c0e; color: #f0f0f2; border-radius: 12px;">
        <h1 style="color: #d4f550; font-size: 1.5rem; margin-bottom: 0.5rem;">◈ Taskr</h1>
        <h2 style="font-size: 1.1rem; margin-bottom: 1rem;">Hey {username}, verify your email</h2>
        <p style="color: #6b6b72; margin-bottom: 1.5rem;">Click the button below to verify your email address and activate your account.</p>
        <a href="{verify_url}"
           style="display: inline-block; background: #d4f550; color: #0c0c0e; padding: 0.75rem 1.5rem;
                  border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.95rem;">
            Verify my account
        </a>
        <p style="color: #6b6b72; font-size: 0.8rem; margin-top: 1.5rem;">
            If you didn't create a Taskr account, you can safely ignore this email.
        </p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_SENDER, settings.gmail_app_password)
        server.sendmail(GMAIL_SENDER, email, msg.as_string())


@router.post("/register", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    verification_token = secrets.token_urlsafe(32)

    user = models.User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        verified=False,
        verification_token=verification_token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    send_verification_email(payload.email, payload.username, verification_token)

    return {"message": "Account created. Please check your email to verify your account."}


@router.get("/verify", response_model=schemas.Token)
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.verification_token == token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user.verified = True
    user.verification_token = None
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=access_token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    access_token = create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=access_token, user=schemas.UserOut.model_validate(user))
