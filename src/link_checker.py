import asyncio
import aiohttp
import os
import time
from flask import Blueprint, request, render_template, jsonify, send_file
from flask_babel import gettext as _

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

    return send_file(script_path, mimetype='application/javascript')


def get_custom_message(status):
    # creates custom error messages for the status codes
    if 400 <= status < 500:
        if status == 400:
            return _("Bad Request")
        elif status == 403:
            return _("Forbidden")
        else:
            return _("Not Found")
    elif 500 <= status < 600:
        return _("Unable to Connect")
    else:
        return _("Unknown Error")


async def make_request(session, url):
    try:
        async with session.get(url[1], ssl=False) as response:
            status_code = response.status
            message = get_custom_message(status_code)
    except aiohttp.ClientError as e:
        status_code = getattr(e, 'status', 500)
        message = get_custom_message(status_code)

    return {
        "link": url,
        "status_code": status_code,
        "status_message": message,
    }


@bp.route('/checklinks', methods=['POST'])
async def check_link():
    # get urls from the request body
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/10.0"}

    start = time.time()
    urls = request.get_json()

    async with aiohttp.ClientSession(headers=headers) as session:
        tasks = [asyncio.create_task(make_request(session, url))
                 for url in urls.items()]
        results = await asyncio.gather(*tasks)

    # return results only for links whose status_code is not 200
    filtered_results = [
        result for result in results if result['status_code'] != 200]

    end = time.time()
    print(f"it took {end-start}- seconds to fetch {len(urls)} urls")
    return jsonify(filtered_results)
