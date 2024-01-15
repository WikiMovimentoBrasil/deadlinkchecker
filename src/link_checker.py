import asyncio
import utils
from flask import Blueprint, request, render_template, jsonify

bp = Blueprint('linkchecker', __name__)


@bp.route('/')
def index():
    """Renders the deadlinkchecker template as the index page"""
    return render_template('checker/deadlinkchecker.html'), 200


@bp.route('/checklinks', methods=['POST'])
async def check_link():
    # get urls from the request body
    urls = request.get_json()

    tasks = [utils.make_request(url) for url in urls]
    results = await asyncio.gather(*tasks)

    return jsonify(results)
