import voluptuous as v
import tornado

from peerdo.utils import json_dump
from peerdo.handlers import APIHandler
from peerdo.data.deed import Deed
from peerdo.data.round import Round

schema = v.Schema({
    'title': unicode,
    'giveback': v.Coerce(int),
    'message': unicode,
    'image_url': unicode,
    'url': unicode,
}, strip=True)

class DeedsHandler(APIHandler):
    def post(self):
        print self.json_body
        data = schema(self.json_body)
        data['user_id'] = self.get_current_user().id
        c = Deed.create(data)
        self.write(json_dump({'deed_id': c.id}))

    def get(self):
        self.write(json_dump([c.dict() for c in Deed.get_by_user(self.current_user)]))

class DeedHandler(APIHandler):
    def get(self, id):
        try:
            c = Deed.get(id)
        except Deed.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Deed not found.')
        else:
            self.write(c.json())

    def patch(self, id):
        try:
            c = Deed.get(id)
        except Deed.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Deed not found.')
        c.update(schema(self.json_body))
