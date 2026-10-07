from sqlalchemy import Column, DateTime, Integer, String, func
from backend.app.core.database import Base


class User(Base):
    """SOC analyst account (demo authentication). Passwords are stored as salted PBKDF2 hashes only."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(50), nullable=False, default="SOC Analyst")
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"
