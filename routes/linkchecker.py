import asyncio
import time

from fastapi import APIRouter
from fastapi.responses import HTMLResponse, JSONResponse

import httpx

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
