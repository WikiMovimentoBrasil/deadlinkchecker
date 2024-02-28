from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from sqlalchemy.schema import FetchedValue
from sqlalchemy.sql import func
from sqlalchemy.schema import UniqueConstraint

from db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True)
    session_id = Column(String(100), unique=True)
    language = Column(String(50))
    created_at = Column(TIMESTAMP,server_default=func.now())
    link_count_timestamp = Column(TIMESTAMP,
                                  server_default=text(
                                      "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
                                  server_onupdate=FetchedValue())
    link_count = Column(Integer, nullable=True)

    __table_args__ = (UniqueConstraint('username', 'language', name='_username_language'),
                     )
