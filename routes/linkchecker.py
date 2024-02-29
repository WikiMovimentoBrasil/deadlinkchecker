import asyncio
import time

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

import httpx
from sqlalchemy.orm import Session

from queries import get_user
from db import get_db

# router
router = APIRouter()


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


@router.post("/checklinks", response_class=JSONResponse)
async def check_links(data: dict, db: Session = Depends(get_db)):
    # check links route

    urls = data["urls"]  # The urls to be checked
    wiki = data["wiki"]  # The wiki the user is coming from
    session_id = data["sessionId"]  # The sessionId of the user
    username = data["username"]

    # query the database for the user
    db_user = get_user(db=db, username=username,
                       lang=wiki, session_id=session_id)

    if db_user:
        if db_user.link_count+len(urls) > 10000:
            raise HTTPException(
                status_code=200, detail="Too many links requested")
        else:
            db_user.link_count += len(urls)
            db.commit()

        headers = {
            "User-agent": "Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/10.0"
        }

        async with httpx.AsyncClient(verify=False, headers=headers, follow_redirects=True) as client:
            tasks = [asyncio.ensure_future(make_request(client, url))
                     for url in urls.items()]
            results = await asyncio.gather(*tasks)

        filtered_results = [
            result for result in results if result['status_code'] != 200]
        end = time.time()

        return filtered_results

    return HTTPException(status_code=400, detail="unable to fulfill this request")
