from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text
from sqlmodel import Field, Relationship, SQLModel

from app.models.base import utcnow, uuid7_str

from app.models.auth.user import User


class AccountBase(SQLModel):
    account_id: str = Field(sa_column=Column(Text, nullable=False))
    provider_id: str = Field(sa_column=Column(Text, nullable=False))
    user_id: str = Field(
        sa_column=Column(
            String,
            ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    access_token: Optional[str] = Field(default=None, sa_column=Column(Text))
    refresh_token: Optional[str] = Field(default=None, sa_column=Column(Text))
    id_token: Optional[str] = Field(default=None, sa_column=Column(Text))
    access_token_expires_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    refresh_token_expires_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    scope: Optional[str] = Field(default=None, sa_column=Column(Text))
    password: Optional[str] = Field(default=None, sa_column=Column(Text))


class Account(AccountBase, table=True):
    __tablename__: str = "account"

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

    user: User = Relationship(back_populates="accounts")

    __table_args__ = (
        Index("ix_account_provider_account", "provider_id", "account_id"),
    )


class AccountCreate(AccountBase):
    pass
