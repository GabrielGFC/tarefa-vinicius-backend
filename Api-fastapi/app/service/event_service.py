from sqlalchemy.orm import Session

from ..models_logs import ProcessedEvent
from ..models_todos import TaskProjection
from ..schemas import InternalTaskEvent


SUPPORTED_TASK_EVENTS = {"todo.created", "todo.toggled", "todo.deleted"}


def apply_task_event(db: Session, event: InternalTaskEvent) -> bool:
    if event.event_type not in SUPPORTED_TASK_EVENTS:
        raise ValueError(f"Unsupported event type: {event.event_type}")

    existing_event = db.get(ProcessedEvent, event.event_id)
    if existing_event is not None:
        return False

    projection = db.get(TaskProjection, event.todo_id)

    if projection is None:
        projection = TaskProjection(
            todo_id=event.todo_id,
            user_id=event.user_id,
            completed=bool(event.completed),
            is_deleted=False,
            updated_at=event.occurred_at,
        )
        db.add(projection)

    projection.user_id = event.user_id
    projection.updated_at = event.occurred_at

    if event.event_type == "todo.created":
        projection.completed = bool(event.completed)
        projection.is_deleted = False
    elif event.event_type == "todo.toggled":
        projection.completed = bool(event.completed)
        projection.is_deleted = False
    elif event.event_type == "todo.deleted":
        projection.completed = bool(event.completed)
        projection.is_deleted = True

    db.add(ProcessedEvent(event_id=event.event_id))
    db.commit()
    return True
