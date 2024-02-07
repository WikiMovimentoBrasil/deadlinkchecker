import asyncio
import time
import subprocess
import os
import hashlib

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from contextlib import asynccontextmanager

import httpx
# import aioredis
from redis import asyncio as aioredis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost")


async def get_redis():
    return aioredis.from_url(REDIS_URL)


@asynccontextmanager
async def life_span(app: FastAPI):
    # instantiate redis on application start up
    redis = await get_redis()
    yield
    # close redis on application shut down
    redis.close()


# fastapi instance
app = FastAPI(lifespan=life_span)

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

# update toolforge


@app.post("/update-server")
def webhook():
    subprocess.check_output(["git", "pull", "origin", "main"])
    return "Updated Toolforge project successfully", 200


# Render the index page
@app.get("/", response_class=HTMLResponse)
async def index():
    return open("templates/index.html").read()


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
    hashing_algo = hashlib.sha256()
    return hashing_algo.hexdigest(urls)


@app.post("/checklinks", response_class=JSONResponse)
async def check_links(urls: dict):
    # check links route
    links_hash = await obtain_hash(urls)
    return links_hash
    # start = time.time()

    # headers = {
    #     "User-agent": "Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/10.0"}
    # async with httpx.AsyncClient(verify=False, headers=headers, follow_redirects=True) as client:
    #     tasks = [asyncio.ensure_future(make_request(client, url))
    #              for url in urls.items()]
    #     results = await asyncio.gather(*tasks)

    # filtered_results = [
    #     result for result in results if result['status_code'] != 200]
    # end = time.time()
    # print(f'it took {end-start} seconds to fetch {len(urls)} urls ')
    # return filtered_results
