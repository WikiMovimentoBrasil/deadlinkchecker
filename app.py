import asyncio
import time
import subprocess
import os
import hashlib

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from contextlib import asynccontextmanager

from starlette.middleware.sessions import SessionMiddleware

import httpx
import mwoauth
from redis import asyncio as aioredis
from dotenv import load_dotenv

from sqlalchemy.orm import Session
from db import SessionLocal, engine
import models
# create tables
models.Base.metadata.create_all(bind=engine)

# load environment variables
load_dotenv()

# Dependency


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


SOCIAL_AUTH_MEDIAWIKI_KEY = os.environ.get(
    "SOCIAL_AUTH_MEDIAWIKI_KEY", "dummy-default-value")
SOCIAL_AUTH_MEDIAWIKI_SECRET = os.environ.get(
    "SOCIAL_AUTH_MEDIAWIKI_SECRET", "dummy-default-value")
SOCIAL_AUTH_MEDIAWIKI_URL = 'https://meta.wikimedia.org/w/index.php'
SOCIAL_AUTH_MEDIAWIKI_CALLBACK = 'http://127.0.0.1:8080/oauth/complete/mediawiki/'
SESSION_SECRET = os.environ.get("SESSION_SECRET")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost")


async def get_redis():
    return aioredis.from_url(REDIS_URL)


@asynccontextmanager
async def life_span(app: FastAPI):
    # instantiate redis on application start up
    redis = await get_redis()
    yield
    # close redis on application shut down
    await redis.close()


# fastapi instance
app = FastAPI(lifespan=life_span)
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)

# mounting static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/templates", StaticFiles(directory="templates"), name="templates")

# set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def some_middleware(request: Request, call_next):
    response = await call_next(request)
    session = request.cookies.get('session')
    if session:
        response.set_cookie(
            key=SESSION_SECRET, value=request.cookies.get('session'), httponly=True)
    return response


@app.post("/update-server")
# update toolforge
def webhook():
    subprocess.check_output(["git", "pull", "origin", "main"])
    return "Updated Toolforge project successfully", 200


# Render the index page
@app.get("/", response_class=HTMLResponse)
async def index():
    return open("templates/index.html").read()


@app.get("/login")
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


@app.get('/oauth-callback')
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
        user = models.User(username=identity['username'])
        db.add(user)
        db.commit()
        db.refresh(user)
    return f"{identity}"


def get_custom_message(status):
    # creates custom error messages for the status codes
    if 400 <= status < 500:
        if status == 400:
            return "bad_request"
        elif status == 403:
            return "forbidden"
        else:
            return "not_found"
    elif 500 <= status < 600:
        return "unable_to_connect"
    else:
        return "unknown_error"


async def make_request(client, url):
    try:
        response = await client.head(url[1])
        status_code = response.status_code
        message = get_custom_message(status_code)
    except httpx.HTTPError as e:
        status_code = getattr(e, 'status_code', 500)
        message = get_custom_message(status_code)

    return {
        "link": url,
        "status_code": status_code,
        "status_message": message,
    }


async def obtain_hash(urls):
    hash = hashlib.sha256(urls.encode()).hexdigest()
    return hash


@app.post("/checklinks", response_class=JSONResponse)
async def check_links(urls: dict):
    # check links route
    start = time.time()
    headers = {
        "User-agent": "Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/10.0"}
    async with httpx.AsyncClient(verify=False, headers=headers, follow_redirects=True) as client:
        tasks = [asyncio.ensure_future(make_request(client, url))
                 for url in urls.items()]
        results = await asyncio.gather(*tasks)

    filtered_results = [
        result for result in results if result['status_code'] != 200]
    end = time.time()
    print(f'it took {end-start} seconds to fetch {len(urls)} urls ')
    return filtered_results
