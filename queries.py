from sqlalchemy.orm import Session
import models


def get_user_session_id(db: Session, username: str, lang: str):
    # get the session_id of the user given their username and language
    user = db.query(models.User).filter(
        models.User.username == username, models.User.language == lang).first()
    return user.session_id


def get_user(db: Session, username: str, lang: str, session_id: str):
    # Gets the user given the username, language and session_id
    user = db.query(models.User).filter(
        models.User.username == username,
        models.User.language == lang,
        models.User.session_id == session_id).first()
    return user
