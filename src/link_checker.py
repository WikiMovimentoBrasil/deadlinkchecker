import concurrent.futures
from .utils import make_request
from flask import Blueprint, request, render_template, jsonify

bp = Blueprint('linkchecker', __name__)


@bp.route('/')
def index():
    """Renders the deadlinkchecker template as the index page"""
    return render_template('checker/deadlinkchecker.html'), 200


@bp.route('/checklinks', methods=['POST'])
def check_link():
    # get the urls from the request body
    urls = request.get_json()

    # use multi-threading to make requests to each of the urls
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(make_request, urls))

    return jsonify(results)
