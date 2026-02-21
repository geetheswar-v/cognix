from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_session, get_current_user
from app.core.security import create_access_token, verify_password
from app.db.session import get_session as get_db_session
from app.models import Session, User
from app.schemas.auth import (
    AuthResponse,
    ForgetPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    SessionResponse,
    SignInRequest,
    SignUpRequest,
    UserResponse,
)
from app.services.auth import (
    create_session,
    create_user_with_account,
    extend_session,
    get_credential_account,
    get_user_by_email,
    request_password_reset,
    reset_password,
    send_new_verification_email,
    verify_email_token,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128


def _validate_password(password: str) -> None:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters",
        )
    if len(password) > MAX_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at most {MAX_PASSWORD_LENGTH} characters",
        )


# ---------------------------------------------------------------------
# Sign Up
# ---------------------------------------------------------------------
@router.post(
    "/sign-up", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def sign_up(
    data: SignUpRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """Register a new user with email + password (credential provider).

    An email-verification link is sent automatically.
    """
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    _validate_password(data.password)

    user = await create_user_with_account(
        db=db,
        name=data.name,
        email=data.email,
        password=data.password,
        image=data.image,
    )

    return UserResponse.model_validate(user)


# ---------------------------------------------------------------------
# Sign In
# ---------------------------------------------------------------------
@router.post("/sign-in", response_model=AuthResponse)
async def sign_in(
    data: SignInRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db_session),
):
    """Authenticate with email + password and receive a session + JWT."""
    user = await get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Require verified email — resend link if needed
    if not user.email_verified:
        await send_new_verification_email(db, user)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. A new verification email has been sent.",
        )

    account = await get_credential_account(db, user.id)
    if not account or not account.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(data.password, account.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create DB session
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    session = await create_session(db, user.id, ip_address, user_agent)

    # Issue a short-lived JWT that references the session
    access_token = create_access_token(user.id, session.id)

    response.set_cookie(
        key="cognix-secure.session_token",
        value=session.token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    return AuthResponse(
        user=UserResponse.model_validate(user),
        session=SessionResponse.model_validate(session),
        access_token=access_token,
    )


# ---------------------------------------------------------------------
# Get Session
# ---------------------------------------------------------------------
@router.get("/session", response_model=AuthResponse)
async def get_session(
    response: Response,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_current_session),
    db: AsyncSession = Depends(get_db_session),
):
    """Retrieve current session info and issue a fresh JWT.

    Used by the frontend on page load or when the JWT expires.
    This also extends the session expiry.
    """
    await extend_session(db, session)
    access_token = create_access_token(user.id, session.id)

    response.set_cookie(
        key="cognix-secure.session_token",
        value=session.token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    return AuthResponse(
        user=UserResponse.model_validate(user),
        session=SessionResponse.model_validate(session),
        access_token=access_token,
    )


# ---------------------------------------------------------------------
# Email Verfication
# ---------------------------------------------------------------------
@router.get("/verify", response_model=MessageResponse)
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db_session),
):
    """Verify a user's email address using the token from the verification link."""
    success = await verify_email_token(db, token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )
    return MessageResponse(message="Email verified successfully")


# ---------------------------------------------------------------------
# Forget Password
# ---------------------------------------------------------------------
@router.post("/forget-password", response_model=MessageResponse)
async def forget_password(
    data: ForgetPasswordRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """Request a password-reset link. Always succeeds to prevent enumeration."""
    await request_password_reset(db, data.email)
    return MessageResponse(
        message="If an account with that email exists, a password reset link has been sent.",
    )


# ---------------------------------------------------------------------
# Reset Password
# ---------------------------------------------------------------------
@router.post("/reset-password", response_model=MessageResponse)
async def reset_password_endpoint(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """Set a new password using the token from the reset-password email."""
    _validate_password(data.new_password)

    success = await reset_password(db, data.token, data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    return MessageResponse(message="Password reset successfully")


# ---------------------------------------------------------------------
# Sign Out
# ---------------------------------------------------------------------
@router.post("/sign-out", response_model=MessageResponse)
async def sign_out(
    response: Response,
    session: Session = Depends(get_current_session),
    db: AsyncSession = Depends(get_db_session),
):
    """Sign out the current user by deleting their session and clearing the cookie."""
    from app.services.auth import delete_session
    await delete_session(db, session)
    response.delete_cookie(key="cognix-secure.session_token")
    return MessageResponse(message="Signed out successfully")
