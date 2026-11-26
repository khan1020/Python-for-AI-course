import os
import uuid
from datetime import datetime, timezone
from functools import cache
from typing import Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel, create_engine

class Run(SQLModel, table=True):
    __tablename__ = "runs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    parent_id: Optional[uuid.UUID] = Field(default=None, foreign_key="runs.id", ondelete="SET NULL")
    message: str
    answer: str
    plan: str
    review: str
    approved: bool
    attempts: int
    files: dict = Field(sa_column=Column(JSONB, nullable=False))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@cache  # connects on first use, so the offline tests never need a database
def engine():
    raw_url = os.getenv("DATABASE_URL") or "postgresql+psycopg://postgres:postgres@localhost:9000/postgres"
    url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
    e = create_engine(url)
    SQLModel.metadata.create_all(e)  # creates the runs table if it doesn't exist
    return e

