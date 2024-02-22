from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from sqlalchemy.schema import FetchedValue
from db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50))
    last_updated = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        server_onupdate=FetchedValue()
    )
    link_count = Column(Integer)
