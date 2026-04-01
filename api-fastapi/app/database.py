import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL_LARAVEL = os.getenv(
    "DATABASE_URL_LARAVEL",
    "mysql+pymysql://root:@localhost:3306/db-projeto-2026",
)
DATABASE_URL_EXPRESS = os.getenv(
    "DATABASE_URL_EXPRESS",
    "mysql+pymysql://root:@localhost:3306/projeto-log-2026",
)

engine_laravel = create_engine(DATABASE_URL_LARAVEL, pool_pre_ping=True)
engine_express = create_engine(DATABASE_URL_EXPRESS, pool_pre_ping=True)

SessionLaravel = sessionmaker(autocommit=False, autoflush=False, bind=engine_laravel)
SessionExpress = sessionmaker(autocommit=False, autoflush=False, bind=engine_express)


def get_db_laravel():
    db = SessionLaravel()
    try:
        yield db
    finally:
        db.close()


def get_db_express():
    db = SessionExpress()
    try:
        yield db
    finally:
        db.close()
