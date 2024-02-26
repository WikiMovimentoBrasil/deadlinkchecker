import subprocess
import os

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager

from starlette.middleware.sessions import SessionMiddleware

from redis import asyncio as aioredis
from dotenv import load_dotenv

from db import engine
import models
from routes import auth,linkchecker

# load environment variables
load_dotenv()

# create database tables
models.Base.metadata.create_all(bind=engine)

# Environment variables
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
async def session_middleware(request: Request, call_next):
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

#routers
app.include_router(auth.router)
app.include_router(linkchecker.router)

@app.get("/", response_class=HTMLResponse)
# Render the index page
async def index():
    return open("templates/index.html").read()