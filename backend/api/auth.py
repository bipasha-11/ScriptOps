import os
import json
import random
import time
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
import bcrypt
from ..core.mail import send_otp_email
from ..core.database import get_db
from ..models.db_models import User
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
# Removed passlib CryptContext due to bcrypt 4.0 compatibility issues
bearer_scheme = HTTPBearer()

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey123")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# In-memory OTP storage (email -> {otp, expires_at})
otp_store = {}

# --- Models ---
class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str

class Token(BaseModel):
    access_token: str
    token_type: str
    email: str

# --- Helpers ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Routes ---

@router.post("/signup")
async def signup(user: UserSignUp, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Use native bcrypt
    password_bytes = user.password.encode('utf-8')
    salt = bcrypt.gensalt()
    pwd_hash = bcrypt.hashpw(password_bytes[:72], salt).decode('utf-8')
    
    otp = str(random.randint(100000, 999999))
    otp_store[user.email] = {
        "otp": otp,
        "name": user.name,
        "password_hash": pwd_hash,
        "expires_at": time.time() + 600 # 10 minutes
    }
    
    print(f"[DEBUG] Generated OTP for {user.email}: {otp}")
    if send_otp_email(user.email, otp):
        return {"message": "OTP sent to email"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send OTP")

@router.post("/verify-signup")
async def verify_signup(data: VerifyOTP, db: Session = Depends(get_db)):
    if data.email not in otp_store:
        raise HTTPException(status_code=400, detail="No pending signup found")
    
    stored = otp_store[data.email]
    if time.time() > stored["expires_at"]:
        del otp_store[data.email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if stored["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Create user in DB
    new_user = User(
        email=data.email,
        name=stored["name"],
        password=stored["password_hash"]
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Clean up
    del otp_store[data.email]
    
    # Return token
    access_token = create_access_token(
        data={"sub": data.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "email": data.email, "name": new_user.name}

@router.post("/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Use native bcrypt for verification
    if not bcrypt.checkpw(user.password.encode('utf-8')[:72], db_user.password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "email": user.email, "name": db_user.name}

@router.post("/resend-otp")
async def resend_otp(data: dict):
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    if email not in otp_store:
        raise HTTPException(status_code=400, detail="No active session. Please start over.")
    
    otp = str(random.randint(100000, 999999))
    otp_store[email]["otp"] = otp
    otp_store[email]["expires_at"] = time.time() + 600
    
    if send_otp_email(email, otp):
        return {"message": "New OTP sent to email"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send OTP")

@router.get("/me")
async def me(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"email": email, "name": db_user.name}
