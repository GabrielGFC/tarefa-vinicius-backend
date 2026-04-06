from datetime import datetime

from pydantic import BaseModel


class StatsResponse(BaseModel):
    total: int
    completed: int
    pending: int


class InternalTaskEvent(BaseModel):
    event_id: str
    event_type: str
    user_id: int
    todo_id: int
    completed: bool | None = None
    occurred_at: datetime
    request_id: str
