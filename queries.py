import models


def get_user_session_id(db, username, lang):
    # get the session_id of the user given their username and language
    user = db.query(models.User).filter_by(
        username=username, language=lang).first()
    return user.session_id


def get_user(db, username, lang, session_id):
    # Gets the user given the username, language and session_id
    user = db.query(models.User).filter_by(
        username=username, language=lang, session_id=session_id)
    return user
