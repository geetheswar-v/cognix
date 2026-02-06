from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import BackgroundTasks

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.email import send_password_reset_email, send_verification_email
from app.core.security import generate_token, hash_password
from app.models import Account, Session, User, Verification

SESSION_EXPIRE_DAYS = 7
EMAIL_VERIFICATION_EXPIRE_HOURS = 24
PASSWORD_RESET_EXPIRE_HOURS = 1


# ---------------------------------------------------------------------------
# User helpers
# ---------------------------------------------------------------------------
async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.exec(select(User).where(User.email == email))
    return result.first()


async def get_credential_account(
    db: AsyncSession, user_id: str
) -> Optional[Account]:
    result = await db.exec(
        select(Account).where(
            Account.user_id == user_id,
            Account.provider_id == "credential",
        )
    )
    return result.first()


# ---------------------------------------------------------------------------
# Sign-up
# ---------------------------------------------------------------------------
async def create_user_with_account(
    db: AsyncSession,
    name: str,
    email: str,
    password: str,
    image: Optional[str] = None,
    background_tasks: Optional[BackgroundTasks] = None
) -> User:
    """Create a new User + credential Account and send a verification email."""
    user = User(name=name, email=email, image=image)
    db.add(user)
    await db.flush()  # populate user.id

    account = Account(
        account_id=user.id,
        provider_id="credential",
        user_id=user.id,
        password=hash_password(password),
    )
    db.add(account)

    # Create email-verification token
    token = generate_token()
    verification = Verification(
        identifier=f"email-verification:{email}",
        value=token,
        expires_at=datetime.now(timezone.utc)
        + timedelta(hours=EMAIL_VERIFICATION_EXPIRE_HOURS),
    )
    db.add(verification)

    await db.commit()
    await db.refresh(user)

    if background_tasks:
        background_tasks.add_task(send_verification_email, email, token)
    else:
        await send_verification_email(email, token)

    return user


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------
async def verify_email_token(db: AsyncSession, token: str) -> bool:
    """Validate an email-verification token and mark the user as verified."""
    result = await db.exec(
        select(Verification).where(
            Verification.value == token,
            Verification.expires_at > datetime.now(timezone.utc),
        )
    )
    verification = result.first()
    if not verification:
        return False

    # Ensure this is an email-verification token
    if not verification.identifier.startswith("email-verification:"):
        return False

    email = verification.identifier.removeprefix("email-verification:")

    user = await get_user_by_email(db, email)
    if not user:
        return False

    user.email_verified = True
    db.add(user)
    await db.delete(verification)
    await db.commit()
    return True


async def send_new_verification_email(
        db: AsyncSession, 
        user: User,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> None:
    """Delete stale verification tokens for this user and issue a fresh one."""
    # Remove any existing email-verification entries for this email
    stale = await db.exec(
        select(Verification).where(
            Verification.identifier == f"email-verification:{user.email}",
        )
    )
    for v in stale.all():
        await db.delete(v)

    token = generate_token()
    verification = Verification(
        identifier=f"email-verification:{user.email}",
        value=token,
        expires_at=datetime.now(timezone.utc)
        + timedelta(hours=EMAIL_VERIFICATION_EXPIRE_HOURS),
    )
    db.add(verification)
    await db.commit()

    if background_tasks:
        background_tasks.add_task(send_verification_email, user.email, token)
    else:
        await send_verification_email(user.email, token)


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------
async def create_session(
    db: AsyncSession,
    user_id: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> Session:
    """Create a new session row"""
    token = generate_token()
    session = Session(
        token=token,
        user_id=user_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRE_DAYS),
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_valid_session(db: AsyncSession, session_id: str) -> Optional[Session]:
    """Return a session by UUID only if it exists and has not expired."""
    session = await db.get(Session, session_id)
    if session and session.expires_at > datetime.now(timezone.utc):
        return session
    return None


async def get_session_by_token(db: AsyncSession, token: str) -> Optional[Session]:
    """Retrieve a session by its opaque token string."""
    result = await db.exec(
        select(Session).where(
            Session.token == token,
            Session.expires_at > datetime.now(timezone.utc),
        )
    )
    return result.first()


async def extend_session(db: AsyncSession, session: Session) -> None:
    """Extend session expiry if it's nearing expiration (updateAge pattern)."""
    # Better Auth style: if session is used, reset the 7-day clock
    session.expires_at = datetime.now(timezone.utc) + timedelta(
        days=SESSION_EXPIRE_DAYS
    )
    db.add(session)
    await db.commit()


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------
async def request_password_reset(
        db: AsyncSession, 
        email: str, 
        background_tasks: Optional[BackgroundTasks] = None
    ) -> None:
    """Create a password-reset verification and email it.

    Always returns without error to prevent user-enumeration.
    """
    user = await get_user_by_email(db, email)
    if not user:
        return  # silent — don't reveal whether the email exists

    # Clean up any existing password-reset tokens for this email
    stale = await db.exec(
        select(Verification).where(
            Verification.identifier == f"password-reset:{email}",
        )
    )
    for v in stale.all():
        await db.delete(v)

    token = generate_token()
    verification = Verification(
        identifier=f"password-reset:{email}",
        value=token,
        expires_at=datetime.now(timezone.utc)
        + timedelta(hours=PASSWORD_RESET_EXPIRE_HOURS),
    )
    db.add(verification)
    await db.commit()

    if background_tasks:
        background_tasks.add_task(send_password_reset_email, email, token)
    else:
        await send_password_reset_email(email, token)


async def reset_password(
    db: AsyncSession, token: str, new_password: str
) -> bool:
    """Validate a reset token and update the user's credential password."""
    result = await db.exec(
        select(Verification).where(
            Verification.value == token,
            Verification.expires_at > datetime.now(timezone.utc),
        )
    )
    verification = result.first()
    if not verification:
        return False

    if not verification.identifier.startswith("password-reset:"):
        return False

    email = verification.identifier.removeprefix("password-reset:")

    user = await get_user_by_email(db, email)
    if not user:
        return False

    account = await get_credential_account(db, user.id)
    if not account:
        return False

    account.password = hash_password(new_password)
    db.add(account)
    await db.delete(verification)
    await db.commit()
    return True
