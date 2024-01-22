from .link_checker import bp
import os
import subprocess

from flask import Flask, request
from flask_cors import CORS
from flask_babel import Babel


# create and configure the app
app = Flask(__name__)
CORS(app)

app.config.update(
    LANGUAGES=['en', 'pt'],
)


def get_locale():
    # gets the locale from the request headers when a request is made
    return request.accept_languages.best_match(app.config['LANGUAGES'])

babel=Babel(app, get_locale)

# pick configuration variables from the config file
#app.config.from_pyfile('config.py')


@app.route("/update-server", methods=["POST"])
def webhook():
    if request.method == "POST":
        subprocess.check_output(["git", "pull", "origin", "main"])
        return "Updated Toolforge project successfully", 200
    else:
        return "Wrong event type", 400


# register blue print
# import link_checker

# app.register_blueprint(link_checker.bp)
app.register_blueprint(bp)
