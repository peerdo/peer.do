import voluptuous as v
from datetime import datetime
from tornado.ioloop import IOLoop

from peerdo.data import RedisData, r
from peerdo.data.user import User
from peerdo.settings import *
from peerdo.utils import datetime_to_timestamp, json_dump, now

class Deed(RedisData):
    namespace = 'peer.do:deeds'
    def __init__(self, id, data=None):
        super(Deed, self).__init__(id)
        if data is None:
            data = {}
        self.data = data

    @classmethod
    def get_by_user(cls, user):
        return user.get_deeds()


    @property
    def user(self):
        try:
            return self._user
        except AttributeError:
            self._user = User(int(self._g('user_id')))
            return self._user


    def _create_with_data(self, data, pipe):
        u = User.get(id=data.get('user_id', ''))
        pipe.zadd(u.key('deeds'), datetime_to_timestamp(now()), self.id)
        pipe.set(self.key('title'), data.get('title', ''))
        pipe.set(self.key('message'), data.get('message', ''))
        pipe.set(self.key('image_url'), data.get('image_url', ''))
        pipe.set(self.key('url'), data.get('url', ''))
        pipe.set(self.key('user_id'), data.get('user_id', ''))
        pipe.set(self.key('giveback'), data.get('giveback', 0))
        pipe.set(self.key('credibility'), data.get('credibility', 0))
        pipe.set(self.key('longevity'), data.get('longevity', 0))
        pipe.set(self.key('winnings'), data.get('winnings', 0))

    def update(self, data):
        pipe = r.pipeline()
        for k in 'user_id giveback url image_url title message'.split(' '):
            if k in data:
                pipe.set(self.key(k), data[k])
        pipe.execute()


    def get_dict(self):
        d = self.data.copy()
        d.update({
            'giveback': int(self._g('giveback')),
            'longevity': self._g('longevity'),
            'credibility': self._g('credibility'),
            'winnings': self._g('winnings'),
            'user_id': self._g('user_id'),
            'title': self._g('title'),
            'message': self._g('message'),
            'image_url': self._g('image_url'),
            'url': self._g('url'),
        })
        return d