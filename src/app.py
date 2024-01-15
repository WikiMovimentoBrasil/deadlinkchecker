import os
import subprocess

from flask import Flask, request
from flask_cors import CORS


# create and configure the app
app = Flask(__name__, instance_relative_config=True)
CORS(app)

@app.route("/update-server", methods=["POST"])
def webhook():
    if request.method == "POST":
        subprocess.check_output(["git", "pull", "origin", "main"])
        return "Updated Toolforge project successfully", 200
    else:
        return "Wrong event type", 400


# register blue print
from link_checker import bp

app.register_blueprint(bp)
