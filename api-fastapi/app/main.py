import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, get_db
from .models_logs import ProcessedEvent
from .models_todos import Base, TaskProjection
from .schemas import InternalTaskEvent, StatsResponse
from .service.auth_service import get_authenticated_user_id
from .service.event_service import apply_task_event
from .service.stats_service import calculate_stats

load_dotenv()

app = FastAPI(title="Stats API", version="2.0.0")

cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:5500")
internal_token = os.getenv("INTERNAL_TOKEN", "change-me-internal-token")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[cors_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Requested-With", "X-Internal-Token"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


def require_internal_token(x_internal_token: str = Header(default="", alias="X-Internal-Token")) -> None:
    if not internal_token or x_internal_token != internal_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized internal request")


@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/internal/task-events")
def receive_task_event(
    event: InternalTaskEvent,
    _internal_auth: None = Depends(require_internal_token),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    try:
        created = apply_task_event(db, event)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Exception:
        db.rollback()
        raise

    return {"status": "processed" if created else "duplicate"}


@app.get("/api/stats", response_model=StatsResponse)
def get_stats(request: Request, db: Session = Depends(get_db)) -> StatsResponse:
    user_id = get_authenticated_user_id(request)
    stats = calculate_stats(db, user_id)
    return StatsResponse(**stats)
