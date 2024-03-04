import asyncio
import time
import os
from datetime import datetime, timedelta
import pickle

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

import httpx
from sqlalchemy.orm import Session
from redis import asyncio as aioredis
from dotenv import load_dotenv

from queries import get_user
from db import get_db

#load environment varables
load_dotenv()

# router
router = APIRouter()

# redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost")
REDIS_PREFIX=os.getenv("REDIS_PREFIX") #prefix for redis keys
REDIS_EXPIRY=86400 # expiry of 1 day

async def get_redis():
    return aioredis.from_url(REDIS_URL,encoding="utf-8", decode_responses=True)


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


async def make_request_and_cache(client, redis, url):

    async with redis:
        # check if the link is cached in redis
        cached_response = await redis.get(url[1])
        if cached_response:
            deserialized_cached_response=pickle.loads(cached_response)
            return deserialized_cached_response

        # if the link isn't in cache make request using httpx
        try:
            response = await client.head(url[1])
            status_code = response.status_code
            message = get_custom_message(status_code)

        except httpx.HTTPError as e:
            status_code = getattr(e, 'status_code', 500)
            message = get_custom_message(status_code)

        result = {
            "link": url,
            "status_code": status_code,
            "status_message": message,
        }

        # cache the result in redis
        serialized_result=pickle.dumps(result)
        await redis.setex(url[1], serialized_result,REDIS_EXPIRY)

        return result


@router.post("/checklinks", response_class=JSONResponse)
async def check_links(data: dict, redis: aioredis.Redis = Depends(get_redis), db: Session = Depends(get_db)):
    # check links route
    start=time.time()

    urls = data["urls"]  # The urls to be checked
    wiki = data["wiki"]  # The wiki the user is coming from
    session_id = data["sessionId"]  # The sessionId of the user
    username = data["username"]

    if session_id is None:
        raise HTTPException(
            status_code=400, detail="Session ID not provided.")

    # Query the database for the user
    db_user = get_user(db=db, username=username,
                       lang=wiki, session_id=session_id)
    db_user.link_count = int(db_user.link_count or 0)

    # Verify if user are on database
    if db_user:

        # Verify if linkcount expiration time has passed
        if db_user.link_count_timestamp + timedelta(days=1) < datetime.now():

            # Resets linkcount
            db_user.link_count_timestamp = datetime.now()
            db_user.link_count = len(urls)
            db.commit()

        # When linkcount time is still valid
        else:

            # When limit of link has been reached
            if db_user.link_count + len(urls) > 10000:
                raise HTTPException(
                    status_code=429, detail="Too many links requested")

            # Logs amount of new links
            else:
                setattr(db_user, 'link_count', db_user.link_count + len(urls))
                db.commit()

        # Request headers
        headers = {
            "User-agent": "Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/10.0"
        }

        async with httpx.AsyncClient(verify=False, headers=headers, follow_redirects=True) as client:
            tasks = [asyncio.ensure_future(make_request_and_cache(client, redis, url))
                        for url in urls.items()]
            results = await asyncio.gather(*tasks)

        filtered_results = [
            result for result in results if result['status_code'] != 200]
        end = time.time()
        print(f"it took {end-start} seconds to fetch {len(urls)}")

        return filtered_results

    return HTTPException(status_code=400, detail="User not found on database.")
