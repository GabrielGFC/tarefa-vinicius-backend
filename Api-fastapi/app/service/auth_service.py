import base64
import hashlib
import hmac
import json
import os
import time

from dotenv import load_dotenv
from fastapi import HTTPException, Request, status

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-super-secret-jwt")
AUTH_COOKIE_NAME = os.getenv("AUTH_COOKIE_NAME", "auth_token")


def _b64url_decode(value: str) -> bytes:
    normalized = value + "=" * (-len(value) % 4)
    normalized = normalized.replace("-", "+").replace("_", "/")
    return base64.b64decode(normalized)


def decode_jwt(token: str) -> dict:
    try:
        header, payload, signature = token.split(".")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required") from exc

    unsigned_token = f"{header}.{payload}".encode("utf-8")
    expected_signature = hmac.new(JWT_SECRET.encode("utf-8"), unsigned_token, hashlib.sha256).digest()
    encoded_expected_signature = (
        base64.urlsafe_b64encode(expected_signature).decode("utf-8").rstrip("=")
    )

    if not hmac.compare_digest(signature, encoded_expected_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    parsed_payload = json.loads(_b64url_decode(payload).decode("utf-8"))
    expires_at = parsed_payload.get("exp")

    if not isinstance(expires_at, int) or expires_at <= int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    return parsed_payload


def get_authenticated_user_id(request: Request) -> int:
    token = request.cookies.get(AUTH_COOKIE_NAME)

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    payload = decode_jwt(token)

    try:
        return int(payload["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required") from exc
