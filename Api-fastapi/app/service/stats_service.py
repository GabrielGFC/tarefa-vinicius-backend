from sqlalchemy import func


def calculate_stats(db_todos, db_logs, todo_model, log_model):
    total_todos = db_todos.query(todo_model).count()
    completed = db_todos.query(todo_model).filter(todo_model.completed.is_(True)).count()
    pending = total_todos - completed

    total_logs = db_logs.query(log_model).count()

    most_action = (
        db_logs.query(log_model.action, func.count(log_model.action).label("count"))
        .group_by(log_model.action)
        .order_by(func.count(log_model.action).desc())
        .first()
    )

    most_frequent_action = most_action[0] if most_action else None
    average_logs_per_todo = round((total_logs / total_todos), 2) if total_todos > 0 else 0.0

    return {
        "total": total_todos,
        "completed": completed,
        "pending": pending,
        "total_logs": total_logs,
        "most_frequent_action": most_frequent_action,
        "average_logs_per_todo": average_logs_per_todo,
    }
