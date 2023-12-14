# from .factory import create_app

# app=create_app()

# if __name__=='main':
#     app.run()
import flask


app = flask.Flask(__name__)


@app.route('/')
def index():
  return 'Hello World!'