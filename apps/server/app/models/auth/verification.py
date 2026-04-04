from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Index, Text
from sqlmodel import Field, SQLModel

from app.models.base import utcnow, uuid7_str


class VerificationBase(SQLModel):
    identifier: str = Field(sa_column=Column(Text, nullable=False, index=True))
    value: str = Field(sa_column=Column(Text, nullable=False))
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))


class Verification(VerificationBase, table=True):
    __tablename__: str = "verification"

    id: str = Field(default_factory=uuid7_str, primary_key=True)
    created_at: Optional[datetime] = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=True, default=utcnow),
    )
    updated_at: Optional[datetime] = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=True, default=utcnow),
    )

    __table_args__ = (
        Index("ix_verification_identifier_expires_at", "identifier", "expires_at"),
    )


class VerificationCreate(VerificationBase):
    pass
