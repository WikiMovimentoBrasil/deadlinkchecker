import models


def is_existing_user(db, username):
    user = db.query(models.User).filter_by(username=username).first()
