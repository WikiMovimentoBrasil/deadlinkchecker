import asyncio
import os
from utils import make_request
from quart import Blueprint, request, render_template, jsonify, send_file

bp = Blueprint('linkchecker', __name__)


@bp.route('/')
async def index():
    """Renders the deadlinkchecker template as the index page"""
    return await render_template('checker/deadlinkchecker.html'), 200


@bp.route('/script.js')
async def script():
    """Renders the script.js file"""
    abs_path = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(abs_path, "static", "script.js")

    return await send_file(script_path, mimetype='application/javascript')


@bp.route('/checklinks', methods=['POST'])
async def check_link():
    # get urls from the request body
    # urls = request.get_json()

    # tasks = [make_request(url) for url in urls]
    # results = await asyncio.gather(*tasks)

    # return jsonify(results)
    return 'This checks links'
