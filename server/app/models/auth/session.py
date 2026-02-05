from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text
from sqlmodel import Field, Relationship, SQLModel

from app.models.base import utcnow, uuid7_str

if TYPE_CHECKING:
    from app.models.auth.user import User


class SessionBase(SQLModel):
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    token: str = Field(sa_column=Column(Text, nullable=False, unique=True, index=True))
    ip_address: Optional[str] = Field(default=None, sa_column=Column(Text))
    user_agent: Optional[str] = Field(default=None, sa_column=Column(Text))
    user_id: str = Field(
        sa_column=Column(
            String,
            ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )


class Session(SessionBase, table=True):
    __tablename__: str = "session"

    id: str = Field(default_factory=uuid7_str, primary_key=True)
    created_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, default=utcnow),
    )
    updated_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
        ),
    )

    user: Optional["User"] = Relationship(back_populates="sessions")

    __table_args__ = (Index("ix_session_user_id_expires_at", "user_id", "expires_at"),)


class SessionCreate(SessionBase):
    pass
