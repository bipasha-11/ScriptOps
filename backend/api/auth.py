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
from passlib.context import CryptContext
from ..core.mail import send_otp_email

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey123")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# File-based user storage
USERS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "users.json")
os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)

if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, "w") as f:
        json.dump({}, f)

def get_users():
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f)

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
        print(f"[DEBUG] Decoding token: {token[:10]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            print("[DEBUG] Email not found in payload")
            raise HTTPException(status_code=401, detail="Invalid token")
        print(f"[DEBUG] Token valid for user: {email}")
        return email
    except JWTError as e:
        print(f"[DEBUG] JWT Decode Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Routes ---

@router.post("/signup")
async def signup(user: UserSignUp):
    users = get_users()
    if user.email in users:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Bcrypt has a 72-byte limit for passwords. Truncate to ensure it doesn't crash.
    safe_password = user.password[:72]
    
    otp = str(random.randint(100000, 999999))
    otp_store[user.email] = {
        "otp": otp,
        "name": user.name,
        "password_hash": pwd_context.hash(safe_password),
        "expires_at": time.time() + 600 # 10 minutes
    }
    
    print(f"[DEBUG] Generated OTP for {user.email}: {otp}")
    if send_otp_email(user.email, otp):
        return {"message": "OTP sent to email"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send OTP")

@router.post("/verify-signup")
async def verify_signup(data: VerifyOTP):
    if data.email not in otp_store:
        raise HTTPException(status_code=400, detail="No pending signup found")
    
    stored = otp_store[data.email]
    if time.time() > stored["expires_at"]:
        del otp_store[data.email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if stored["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Create user
    users = get_users()
    users[data.email] = {
        "name": stored["name"],
        "password": stored["password_hash"],
        "created_at": datetime.utcnow().isoformat()
    }
    save_users(users)
    
    # Clean up
    del otp_store[data.email]
    
    # Return token
    access_token = create_access_token(
        data={"sub": data.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "email": data.email, "name": users[data.email]["name"]}

@router.post("/login")
async def login(user: UserLogin):
    users = get_users()
    if user.email not in users:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_data = users[user.email]
    # Bcrypt has a 72-byte limit
    if not pwd_context.verify(user.password[:72], user_data["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "email": user.email, "name": user_data["name"]}

@router.post("/verify-login")
async def verify_login(data: VerifyOTP):
    if data.email not in otp_store:
        raise HTTPException(status_code=400, detail="No pending login found")
    
    stored = otp_store[data.email]
    if time.time() > stored["expires_at"]:
        del otp_store[data.email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if stored["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Clean up
    del otp_store[data.email]
    
    # Return token
    access_token = create_access_token(
        data={"sub": data.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    # Note: Login currently doesn't use OTP but we keep this for consistency if needed later
    users = get_users()
    return {"access_token": access_token, "token_type": "bearer", "email": data.email, "name": users[data.email]["name"]}

@router.post("/resend-otp")
async def resend_otp(data: dict):
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if there is an existing session
    if email not in otp_store:
        raise HTTPException(status_code=400, detail="No active session. Please start over.")
    
    # Generate new OTP
    otp = str(random.randint(100000, 999999))
    otp_store[email]["otp"] = otp
    otp_store[email]["expires_at"] = time.time() + 600
    
    if send_otp_email(email, otp):
        return {"message": "New OTP sent to email"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send OTP")

@router.get("/me")
async def me(email: str = Depends(get_current_user)):
    users = get_users()
    user_data = users.get(email, {})
    return {"email": email, "name": user_data.get("name", "")}
