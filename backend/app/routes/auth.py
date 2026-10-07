import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from backend.app.models.user import User
from backend.app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Resolve the analyst from an `Authorization: Bearer <token>` header."""
    header = request.headers.get("Authorization", "")
    token = header[7:] if header.lower().startswith("bearer ") else ""
    user_id = decode_access_token(token) if token else None
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/login", response_model=TokenResponse, summary="Sign in", responses={401: {"description": "Invalid credentials"}})
def login(credentials: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        logger.info("Failed sign-in attempt for %s", credentials.email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    return TokenResponse(access_token=create_access_token(user.id), user=user)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create analyst account",
    responses={409: {"description": "Email already registered"}},
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")
    user = User(email=payload.email, full_name=payload.full_name.strip(), password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id), user=user)


@router.get("/me", response_model=UserResponse, summary="Current analyst")
def me(user: User = Depends(get_current_user)) -> User:
    return user
