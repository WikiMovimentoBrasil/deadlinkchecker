import asyncio
import aiohttp
import os
import time
from flask import Blueprint, request, render_template, jsonify, send_file

bp = Blueprint('linkchecker', __name__)


@bp.route('/')
def index():
    """Renders the deadlinkchecker template as the index page"""
    return render_template('checker/deadlinkchecker.html'), 200


@bp.route('/script.js')
async def script():
    """Renders the script.js file"""
    abs_path = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(abs_path, "static", "script.js")

    return await send_file(script_path, mimetype='application/javascript')


async def make_request(session, url):
    try:
        async with session.get(url[1], ssl=False) as response:
            status_code = response.status
            message = response.reason
    except aiohttp.ClientError as e:
        status_code = getattr(e, 'status', 500)
        message = "unable to connect"

    return {
        "link": url,
        "status_code": status_code,
        "status_message": message,
    }


@bp.route('/checklinks', methods=['POST'])
async def check_link():
    # get urls from the request body
    start = time.time()
    urls = request.get_json()

    async with aiohttp.ClientSession() as session:
        tasks = [asyncio.create_task(make_request(session, url))
                 for url in urls.items()]
        results = await asyncio.gather(*tasks)

    # return results only for links whose status_code is not 200
    filtered_results = [
        result for result in results if result['status_code'] != 200]

    end = time.time()
    print(f"it took {end-start}- seconds to fetch {len(urls)} urls")
    return jsonify(filtered_results)
