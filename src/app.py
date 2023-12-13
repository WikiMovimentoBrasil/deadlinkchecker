import requests

#TODO set up database
#TODO set up a server

def get_url_info(url):
    payload={'url'}
    try:
        response=requests.get(url)
        status_code=response.status_code
        message=response.reason
    except requests.exceptions.RequestException as e:
        status_code=e.response.status_code if e.response else None
        message=e.strerror if e.strerror else "an error occured"

    result= f'{status_code} {message}'

    print(result)


if __name__ == "__main__":
    get_url_info("")
