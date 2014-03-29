import redis
from peerdo.utils import json_dump

r = redis.StrictRedis()

class RedisData(object):
    def __init__(self, id):
        self.id = id

    @classmethod
    def get(cls, id):
        assert int(id) > 0
        if not r.exists(':'.join((cls.namespace, str(id)))):
            raise cls.DoesNotExist
        return cls(id)

    @classmethod
    def create(cls, data={}):
        k = ':'.join((cls.namespace, '_ID'))
        data = cls.schema(data) if hasattr(cls, 'schema') else data
        with r.pipeline() as pipe:
            pipe.incr(k)
            pipe.get(k)
            id = int(pipe.execute()[1])
            inst = cls(id)
            pipe.set(inst.key(), 1)
            inst._create_with_data(data, pipe=pipe)
            print pipe.execute()
        return inst

    def update(self, data={}):
        pass


    def key(self, name=''):
        if name:
            return ':'.join([self.namespace, str(self.id), name])
        else:
            return ':'.join([self.namespace, str(self.id)])

    def dict(self):
        d = {'id': self.id}
        d.update(self.get_dict())
        return d

    def json(self):
        return json_dump(self.dict())

    def _g(self, name, type=None):
        return type(r.get(self.key(name))) if type else r.get(self.key(name))

    def _s(self, name, value):
        return r.set(self.key(name), value)

    def _create_with_data(self, data, pipe):
        pass

    class DoesNotExist(KeyError):
        pass