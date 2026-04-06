import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL_ANALYTICS = os.getenv(
    "DATABASE_URL_ANALYTICS",
    "mysql+pymysql://root:todo_root_password@localhost:3306/projeto-analytics-2026",
)

engine = create_engine(DATABASE_URL_ANALYTICS, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
