from flask import Blueprint,request,render_template

import requests

bp=Blueprint('linkchecker',__name__)

@bp.route('/')
def check_link():
    """
    Accepts a url as a query parameter and makes a request to the url to return the status code and status message
    """
    url=request.args.get('url')

    if url:
        try:
            response=requests.get(url)
            status_code=response.status_code
            message=response.reason
        except requests.exceptions.RequestException as e:
            status_code=e.response.status_code if e.response else None
            message=e.strerror if e.strerror else "an error occured"

        result= f'{status_code} {message}'

        return result
    else:
        return render_template('checker/deadlinkchecker.html')