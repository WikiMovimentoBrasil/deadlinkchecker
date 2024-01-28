import os
import subprocess

from flask import Flask, request
from flask_cors import CORS
import yaml

# create and configure the app
app = Flask(__name__)
CORS(app)

# Load configuration from YAML file
__dir__ = os.path.dirname(__file__)
app.config.update(
    yaml.safe_load(open(os.path.join(__dir__, 'config.yaml'))))


@app.route("/update-server", methods=["POST"])
def webhook():
    if request.method == "POST":
        subprocess.check_output(["git", "pull", "origin", "main"])
        return "Updated Toolforge project successfully", 200
    else:
        return "Wrong event type", 400


# register blue print
import link_checker
#from .link_checker import bp

app.register_blueprint(link_checker.bp)
#app.register_blueprint(bp)
