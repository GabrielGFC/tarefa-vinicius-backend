from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import declarative_base

BaseLogs = declarative_base()


class Log(BaseLogs):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(255), nullable=False)
    todo_id = Column(Integer, nullable=False)
    message = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=True)
