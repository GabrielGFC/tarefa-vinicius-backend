from sqlalchemy import Boolean, Column, DateTime, Integer
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class TaskProjection(Base):
    __tablename__ = "task_projection"

    todo_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    completed = Column(Boolean, nullable=False, default=False)
    is_deleted = Column(Boolean, nullable=False, default=False)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
