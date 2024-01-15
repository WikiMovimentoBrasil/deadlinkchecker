from link_checker import bp
import subprocess

from quart import Quart, request
from quart_cors import cors


# create and configure the app
app = Quart(__name__)
app = cors(app)


@app.route("/update-server", methods=["POST"])
def webhook():
    if request.method == "POST":
        subprocess.check_output(["git", "pull", "origin", "main"])
        return "Updated Toolforge project successfully", 200
    else:
        return "Wrong event type", 400


# register blue print

app.register_blueprint(bp)

# run the app
app.run()
