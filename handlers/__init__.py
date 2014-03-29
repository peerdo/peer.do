import json
import tornado

from peerdo.data.user import User

class BaseHandler(tornado.web.RequestHandler):
    @property
    def json_body(self):
        return json.loads(self.request.body)

    @property
    def session(self):
        sessionid = self.get_secure_cookie('sid')
        return Session(self.application.session_store, sessionid)

    def get_current_user(self):
        if self.get_secure_cookie('user') is None:
            # create new user
            u = User.create()
            self.set_secure_cookie('user', str(u.id))
            return u
        try:
            return User.get(int(self.get_secure_cookie('user')))
        except User.DoesNotExist:
            # for now, just make a new user...
            u = User.create()
            self.set_secure_cookie('user', str(u.id))
            return u

class APIHandler(BaseHandler):
    def initialize(self):
        self.set_header("Content-Type", "application/json")