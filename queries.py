import models


async def is_existing_user(db, username):
    user = await db.query(models.User).filter_by(username=username).first()
