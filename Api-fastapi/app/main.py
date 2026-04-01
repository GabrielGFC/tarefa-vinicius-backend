import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db_express, get_db_laravel
from .models_logs import Log
from .models_todos import Todo
from .schemas import StatsResponse
from .service.stats_service import calculate_stats

load_dotenv()

app = FastAPI(title="Stats API", version="1.0.0")

cors_origin = os.getenv("CORS_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if cors_origin == "*" else [cors_origin],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def healthcheck():
    return {"status": "ok"}


@app.get("/api/stats", response_model=StatsResponse)
def get_stats(
    db_laravel: Session = Depends(get_db_laravel),
    db_express: Session = Depends(get_db_express),
):
    return calculate_stats(db_laravel, db_express, Todo, Log)
