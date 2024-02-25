import os
import secrets
from datetime import datetime

from fastapi import HTTPException,Request,APIRouter,Depends
from fastapi.responses import RedirectResponse

import mwoauth

import models
from db import get_db
from queries import is_existing_user

from sqlalchemy.orm import Session
from dotenv import load_dotenv

# load environment variables
load_dotenv()

# router
router=APIRouter()

SOCIAL_AUTH_MEDIAWIKI_KEY = os.environ.get(
    "SOCIAL_AUTH_MEDIAWIKI_KEY", "dummy-default-value")
SOCIAL_AUTH_MEDIAWIKI_SECRET = os.environ.get(
    "SOCIAL_AUTH_MEDIAWIKI_SECRET", "dummy-default-value")
SOCIAL_AUTH_MEDIAWIKI_URL = 'https://meta.wikimedia.org/w/index.php'
SOCIAL_AUTH_MEDIAWIKI_CALLBACK = 'http://127.0.0.1:8080/oauth/complete/mediawiki/'

@router.get("/login")
async def login(request: Request):
    """Initiate Oauth login

    get the consumer token from the Media Wiki server and redirect the user to the Media Wiki server to sign the request
    """
    consumer_token = mwoauth.ConsumerToken(
        SOCIAL_AUTH_MEDIAWIKI_KEY, SOCIAL_AUTH_MEDIAWIKI_SECRET)

    try:
        redirect, request_token = mwoauth.initiate(
            SOCIAL_AUTH_MEDIAWIKI_URL, consumer_token)

    except Exception:
        raise HTTPException(
            status_code=400, detail="Media Wiki Oauth handshake failed")

    else:
        request.session["request_token"] = dict(
            zip(request_token._fields, request_token))

        return RedirectResponse(url=redirect)


@router.get('/oauth-callback')
async def oauth_callback(request: Request, db: Session = Depends(get_db)):
    """OAuth handshake callback."""
    if 'request_token' not in request.session:
        raise HTTPException(
            status_code=400, detail="Media Wiki oauth handshake failed")

    consumer_token = mwoauth.ConsumerToken(
        SOCIAL_AUTH_MEDIAWIKI_KEY, SOCIAL_AUTH_MEDIAWIKI_SECRET)

    try:
        access_token = mwoauth.complete(
            SOCIAL_AUTH_MEDIAWIKI_URL,
            consumer_token,
            mwoauth.RequestToken(**request.session['request_token']),
            str(request.query_params))

        identity = mwoauth.identify(
            SOCIAL_AUTH_MEDIAWIKI_URL, consumer_token, access_token)
    except Exception:
        raise HTTPException(
            status_code=400, detail="Media Wiki oauth authentication failed")

    else:
        request.session['access_token'] = dict(zip(
            access_token._fields, access_token))
        request.session['username'] = identity['username']

        # check for existing user
        existing_user = is_existing_user(db=db, username=identity["username"])

        if existing_user:
            pass
        else:
            # generate a sesion_id
            session_id = f"{datetime.now()-{secrets.token_hex(16)}}"

            # add the user to the database
            user = models.User(
                username=identity['username'], session_id=session_id)
            db.add(user)
            db.commit()
            db.refresh(user)

# TODO make the redirect link dynamic depending an which wiki the user is on
    return RedirectResponse(url=f"https://pt.wikipedia.org/wiki/Special:Deadlinkchecker/{session_id}")
