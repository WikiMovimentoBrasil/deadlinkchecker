import os

from flask import Flask

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

#database
from .db import init_app

init_app(app)

# register blue print
from . import link_checker

app.register_blueprint(link_checker.bp)


