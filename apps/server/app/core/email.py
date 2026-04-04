import httpx

from app.core.config import settings


async def send_email(to: str, subject: str, html: str) -> None:
    """Send an email via the DigitalOcean serverless function.

    Fires the request without blocking the caller — if it fails.
    """
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                settings.EMAIL_FUNCTION,
                json={
                    "name": "Cognix Team",
                    "from": settings.EMAIL_FROM,
                    "to": to,
                    "subject": subject,
                    "html": html,
                },
                headers={
                    "X-Require-Whisk-Auth": settings.EMAIL_KEY,
                    "Content-Type": "application/json",
                },
                timeout=30.0,
            )

            if settings.DEBUG:
                print(f"Email sent from {settings.EMAIL_FROM} to {to} with subject '{subject}'")
    except Exception as e:
        # Log the error but don't raise — don't want to block the user
        # or leak information about email validity
        print(f"Error sending email to {to}: {str(e)}")


async def send_verification_email(email: str, token: str) -> None:
    html = f"""\
    <h2>Verify your email address</h2>
    <p>Click the link below to verify your email address:</p>
    <p><a href="{settings.FRONTEND_URL}/auth/verify?token={token}">Verify Email</a></p>
    <p>This link expires in 24 hours.</p>
    """
    await send_email(email, "Verify your email address", html)


async def send_password_reset_email(email: str, token: str) -> None:
    html = f"""\
    <h2>Reset your password</h2>
    <p>Click the link below to reset your password:</p>
    <p><a href="{settings.FRONTEND_URL}/auth/reset-password?token={token}">Reset Password</a></p>
    <p>This link expires in 1 hour.</p>
    """
    await send_email(email, "Reset your password", html)
