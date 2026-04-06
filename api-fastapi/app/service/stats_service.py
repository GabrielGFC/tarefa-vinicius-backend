from sqlalchemy.orm import Session

from ..models_todos import TaskProjection


def calculate_stats(db: Session, user_id: int) -> dict[str, int]:
    active_query = db.query(TaskProjection).filter(
        TaskProjection.user_id == user_id,
        TaskProjection.is_deleted.is_(False),
    )

    total = active_query.count()
    completed = active_query.filter(TaskProjection.completed.is_(True)).count()
    pending = total - completed

    return {
        "total": total,
        "completed": completed,
        "pending": pending,
    }
