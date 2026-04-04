from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------
class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    image: Optional[str] = None


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class ForgetPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------
class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    image: Optional[str] = None
    email_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionResponse(BaseModel):
    id: str
    token: str
    expires_at: datetime
    user_id: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    session: SessionResponse
    access_token: str


class MessageResponse(BaseModel):
    message: str
