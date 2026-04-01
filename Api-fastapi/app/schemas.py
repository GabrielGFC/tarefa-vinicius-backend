from pydantic import BaseModel


class StatsResponse(BaseModel):
    total: int
    completed: int
    pending: int
    total_logs: int
    most_frequent_action: str | None
    average_logs_per_todo: float
