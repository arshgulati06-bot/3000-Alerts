"""
Minimal, dependency-free demo authentication primitives.

- Passwords: salted PBKDF2-HMAC-SHA256 (never stored or logged in plain text).
- Tokens: HMAC-SHA256 signed, expiring bearer tokens (JWT-like, stdlib only).
"""

import base64
import hashlib
import hmac
import json
import secrets
import time

from backend.app.core.config import settings

_PBKDF2_ITERATIONS = 200_000
_SECRET = (settings.SECRET_KEY or secrets.token_urlsafe(48)).encode("utf-8")


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt, expected = stored.split("$")
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iterations))
        return hmac.compare_digest(digest.hex(), expected)
    except (ValueError, AttributeError):
        return False


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _unb64(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def create_access_token(user_id: int) -> str:
    payload = {"sub": user_id, "exp": int(time.time()) + settings.ACCESS_TOKEN_TTL_MINUTES * 60}
    body = _b64(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _b64(hmac.new(_SECRET, body.encode("ascii"), hashlib.sha256).digest())
    return f"{body}.{signature}"


def decode_access_token(token: str) -> int | None:
    """Return the user id for a valid, unexpired token, else None."""
    try:
        body, signature = token.split(".")
        expected = _b64(hmac.new(_SECRET, body.encode("ascii"), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            return None
        payload = json.loads(_unb64(body))
        if payload.get("exp", 0) < time.time():
            return None
        return int(payload["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return None
