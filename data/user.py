import voluptuous as v
from tornado.ioloop import IOLoop

from peerdo.data import RedisData, r
from peerdo.settings import *
from passlib.apps import custom_app_context as pwd_context

class User(RedisData):
    namespace = 'peer.do:users'
    schema = v.Schema({
        'username': v.All(unicode, v.Length(min=1)),
        'password': v.All(unicode, v.Length(min=4))
    })

    class AlreadyExists(ValueError):
        pass

    def _create_with_data(self, data, pipe):
        # check username not taken
        valid_data = self.schema(data)
        if 'username' in valid_data:
            if r.hexists(self.namespace + ':names', valid_data['username']):
                raise self.AlreadyExists
            pipe.set(self.key('username'), valid_data['username'])
            pipe.set(self.key('hash'), self.hash(valid_data['password']))
            pipe.hset(self.namespace + ":names", valid_data['username'], self.id)

    @classmethod
    def get_by_username(cls, name):
        return User.get(int(r.hget(cls.namespace + ':names', name)))

    def hash(self, password):
        return pwd_context.encrypt(password)

    def verify(self, password):
        return pwd_context.verify(password, self._g('hash'))    

    def get_games(self, start=None, num=None):
        from peerdo.data.game import Game
        print [id for id in r.zrangebyscore(self.key('games'), '-inf', 'inf', start=start, num=num)]
        return [Game(id) for id in r.zrangebyscore(self.key('games'), '-inf', 'inf', start=start, num=num)]

    def get_cards(self, start=None, num=None):
        from peerdo.data.card import Card
        return [Card(id) for id in r.zrangebyscore(self.key('cards'), '-inf', 'inf', start=start, num=num)]

