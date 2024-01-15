import aiohttp
import asyncio


async def make_request(url):
    """
    Accepts a url as a query parameter and makes a request to the url to return the status code and status message

    Args:
        url(str): The url to which the request will be made

    Returns:
        url_info(list): A list of dictionaries with the link,status_code and message
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=5) as response:
                status_code = response.status
                message = response.reason
    except aiohttp.ClientError as e:
        status_code = getattr(e, 'status', 500)
        message = "unable to connect"
    except asyncio.TimeoutError as e:
        status_code = 599
        message = "network connection failed"

    return {
        "link": url,
        "status_code": status_code,
        "status_message": message
    }
