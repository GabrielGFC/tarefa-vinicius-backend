from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func

from .models_todos import Base


class ProcessedEvent(Base):
    __tablename__ = "processed_events"

    event_id = Column(String(191), primary_key=True)
    processed_at = Column(DateTime, nullable=False, server_default=func.now())
