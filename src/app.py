import os
import subprocess

from flask import Flask, request


# create and configure the app
app = Flask(__name__, instance_relative_config=True)
app.config.from_mapping(
    SECRET_KEY=os.getenv('SECRET_KEY'),
    DATABASE=os.path.join(app.instance_path, 'urls.sqlite'),
)

# create the instance folder
try:
    os.makedirs(app.instance_path)
except OSError:
    pass

@app.route("/update-server", methods=["POST"])
def webhook():
    if request.method == "POST":
        subprocess.check_output(["git", "pull", "origin", "main"])
        return "Updated Toolforge project successfully", 200
    else:
        return "Wrong event type", 400

# database
import db
db.init_app(app)

# register blue print
import link_checker

app.register_blueprint(link_checker.bp)

