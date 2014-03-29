from peerdo.handlers import BaseHandler
import voluptuous as v
from jinja2 import Environment, FileSystemLoader
import os

class MainHandler(BaseHandler):
    def __init__(self, *args, **kwargs):
        super(MainHandler, self).__init__(*args, **kwargs)
        p = os.path.join(os.path.dirname(__file__), '..', 'templates')
        print p
        self.env = Environment(loader=FileSystemLoader(p))

    def get(self):
        self.write(self.env.get_template("main.html").render())