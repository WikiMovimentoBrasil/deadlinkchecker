import os
import secrets
import time

from fastapi import HTTPException, Request, APIRouter, Depends
from fastapi.responses import RedirectResponse

import mwoauth

import models
from db import get_db
from queries import get_user_session_id

from sqlalchemy.orm import Session
from dotenv import load_dotenv

# load environment variables
load_dotenv()

# router
router = APIRouter()

SOCIAL_AUTH_MEDIAWIKI_KEY = os.environ.get(
    "SOCIAL_AUTH_MEDIAWIKI_KEY", "dummy-default-value")
SOCIAL_AUTH_MEDIAWIKI_SECRET = os.environ.get(
    "SOCIAL_AUTH_MEDIAWIKI_SECRET", "dummy-default-value")
SOCIAL_AUTH_MEDIAWIKI_URL = 'https://meta.wikimedia.org/w/index.php'


@router.get("/login/{wiki}")
async def login(request: Request, wiki):
    """Initiate Oauth login

    get the consumer token from the Media Wiki server and redirect the user to the Media Wiki server to sign the request
    """
    SOCIAL_AUTH_MEDIAWIKI_CALLBACK = f'https://deadlinkchecker.toolforge.org/oauth-callback/{wiki}'
    
    consumer_token = mwoauth.ConsumerToken(
        SOCIAL_AUTH_MEDIAWIKI_KEY, SOCIAL_AUTH_MEDIAWIKI_SECRET)

    try:
        redirect, request_token = mwoauth.initiate(
            SOCIAL_AUTH_MEDIAWIKI_URL, consumer_token, SOCIAL_AUTH_MEDIAWIKI_CALLBACK)

    except Exception:
        raise HTTPException(
            status_code=400, detail="Media Wiki Oauth handshake failed")

    else:
        request.session["request_token"] = dict(
            zip(request_token._fields, request_token))

        return RedirectResponse(url=redirect)


@router.get('/oauth-callback/{wiki}')
async def oauth_callback(wiki, request: Request, db: Session = Depends(get_db)):
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

        # generate a sesion_id
        session_id = f"{time.time()}-{secrets.token_hex(16)}"

        try:
            # add the user to the database
            user = models.User(
                username=identity['username'],
                session_id=session_id,
                language=wiki,
                link_count=int(0))
            db.add(user)
            db.commit()

        except Exception as e:
            db.rollback()

        # checking the database for username and language
        db_session_id = get_user_session_id(
            db=db,
            username=identity["username"],
            lang=wiki)

        if db_session_id:
            return RedirectResponse(url=f"https://{wiki}/wiki/Special:Deadlinkchecker/{db_session_id}")
        
        return HTTPException(status_code=500,detail="failed to save the user to the database")

            


    
