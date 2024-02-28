import models

def get_user_session_id(db,username,lang):
    user=db.query(models.User).filter_by(username=username,language=lang).first()
    return user.session_id


