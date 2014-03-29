import voluptuous as v
import tornado

from peerdo.utils import json_dump
from peerdo.handlers import APIHandler
from peerdo.data.card import Card
from peerdo.data.game import Game

schema = v.Schema({
    'title': unicode,
    'giveback': v.Coerce(int),
    'message': unicode,
    'image_url': unicode,
    'url': unicode,
}, strip=True)

class CardsHandler(APIHandler):
    def post(self):
        print self.json_body
        data = schema(self.json_body)
        data['user_id'] = self.get_current_user().id
        c = Card.create(data)
        self.write(json_dump({'card_id': c.id}))

    def get(self):
        self.write(json_dump([c.dict() for c in Card.get_by_user(self.current_user)]))

class CardHandler(APIHandler):
    def get(self, id):
        try:
            c = Card.get(id)
        except Card.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Card not found.')
        else:
            self.write(c.json())

    def patch(self, id):
        try:
            c = Card.get(id)
        except Card.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Card not found.')
        c.update(schema(self.json_body))
