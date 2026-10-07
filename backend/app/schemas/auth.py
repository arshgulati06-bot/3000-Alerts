import re
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _check_email(value: str) -> str:
    value = value.strip().lower()
    if not _EMAIL_RE.match(value):
        raise ValueError("Enter a valid email address")
    return value


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=255, examples=["analyst@sworders.demo"])
    password: str = Field(..., min_length=1, max_length=128)

    _email = field_validator("email")(_check_email)


class RegisterRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128, description="Minimum 8 characters")
    full_name: str = Field(..., min_length=2, max_length=120)

    _email = field_validator("email")(_check_email)


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
