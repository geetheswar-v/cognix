from datetime import datetime
from typing import TYPE_CHECKING, List, Optional


from sqlalchemy import Boolean, Column, DateTime, Text
from sqlmodel import Field, Relationship, SQLModel

from app.models.base import utcnow, uuid7_str

if TYPE_CHECKING:
    from app.models.auth.session import Session
    from app.models.auth.account import Account


class UserBase(SQLModel):
    name: str = Field(sa_column=Column(Text, nullable=False))
    email: str = Field(sa_column=Column(Text, nullable=False, unique=True, index=True))
    image: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))


class User(UserBase, table=True):
    __tablename__: str = "user"

    id: str = Field(default_factory=uuid7_str, primary_key=True)
    email_verified: bool = Field(
        default=False, sa_column=Column(Boolean, nullable=False, default=False)
    )
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

    sessions: List["Session"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    accounts: List["Account"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class UserCreate(UserBase):
    pass


class UserUpdate(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None
    image: Optional[str] = None
