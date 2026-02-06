from datetime import datetime, timezone
from typing import Optional

import jwt as pyjwt
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_session as get_db_session
from app.models import Session, User
from app.services.auth import get_session_by_token

security = HTTPBearer(auto_error=False)


async def get_current_session(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_session_token: Optional[str] = Header(None, alias="X-Session-Token"),
    db: AsyncSession = Depends(get_db_session),
) -> Session:
    """Retrieve the current active session."""
    session: Optional[Session] = None

    if credentials:
        try:
            payload = decode_access_token(credentials.credentials)
            session_id = payload.get("session_id")
            if session_id:
                session = await db.get(Session, session_id)
        except (pyjwt.PyJWTError, AttributeError):
            pass

    if not session and x_session_token:
        session = await get_session_by_token(db, x_session_token)

    if not session or session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid session not found",
        )
    return session


async def get_current_user(
    session: Session = Depends(get_current_session),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """Extract and validate identity from JWT or Opaque Session Token."""
    user = await db.get(User, session.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user
