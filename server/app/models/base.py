from datetime import datetime, timezone
import uuid6

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def uuid7_str() -> str:
    return str(uuid6.uuid7())
