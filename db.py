import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


TOOL_TOOLSDB_USER=os.environ.get("TOOL_TOOLSDB_USER")
TOOL_TOOLSDB_PASSWORD=os.environ.get("TOOL_TOOLSDB_PASSWORD")
SQLALCHEMY_DATABASE_URL = f"mariadb+pymysql://{TOOL_TOOLSDB_USER}:{TOOL_TOOLSDB_PASSWORD}@tools.db.svc.wikimedia.cloud/s55658__dlc?charset=utf8mb4"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, echo=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()