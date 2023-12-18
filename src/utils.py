import requests


def make_request(url):
    """
    Accepts a url as a query parameter and makes a request to the url to return the status code and status message

    Args:
        url(str): The url to which the request will be made

    Returns:
        url_info(list): A list of dictionaries with the link,status_code and message
    """
    try:
        response = requests.get(url)
        status_code = response.status_code
        message = response.reason
    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response else None
        message = e.strerror if e.strerror else "unable to connect"

    return {
        "link": url,
        "status_code": status_code,
        "status_message": message
    }
