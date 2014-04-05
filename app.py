import tornadoredis
import tornado.web
import redis
import tornado.ioloop
import tornado.web
import json
import re
import random
import voluptuous as v 
import sys
import struct
from dateutil.parser import parse as parse_datetime

sys.path.append('..')

from peerdo.handlers.rounds import RoundHandler, RoundsHandler, RoundDeedsHandler, RoundDeedHandler, RoundVotesHandler
from peerdo.handlers.deeds import DeedHandler, DeedsHandler
from peerdo.handlers.main import MainHandler
from peerdo.conn import Connection
from peerdo.utils import RedisSessionStore
from peerdo.data import r
from sockjs.tornado import SockJSRouter

sock_router = SockJSRouter(Connection, '/sock')
application = tornado.web.Application([
    (r'/', MainHandler),
    (r"/api/rounds/([0-9]+)", RoundHandler),
    (r"/api/rounds/([0-9]+)/deeds", RoundDeedsHandler),
    (r"/api/rounds/([0-9]+)/votes", RoundVotesHandler),
    (r"/api/rounds/([0-9]+)/deeds/([0-9]+)", RoundDeedHandler),
    (r"/api/rounds", RoundsHandler),
    (r"/api/deeds", DeedsHandler),
    (r"/api/deeds/([0-9]+)", DeedHandler),
    (r"/static/(.*)", tornado.web.StaticFileHandler, {"path": "static"}),
] + sock_router.urls, debug=True, cookie_secret="bspXHYciVieZwOYu3yaFP2315llKNB5efRwtJsyvIAeWT20dhza3yKUrWR7dUShqicRs9IEeOd8ZaaM9")
application.session_store = RedisSessionStore(r, key_prefix='peer.do:session', expire=3*24*60*60)

def testseq():
    r.flushdb()
    from peerdo.data.round import Round
    from peerdo.data.deed import Deed
    from peerdo.data.user import User
    users = [User.create({'username': unicode(x), 'password': unicode(x) + u'   '}) for x in xrange(1, 7)]
    deeds = [Deed.create({'title': u'Deed %d' % u.id, 'message': 'test', 'user_id': u.id}) for u in users]
    for c in deeds:
        round = Round.assign_to_or_create_round(c, 10)
    import pprint
    round.start(right_now=True)
    pprint.pprint(round.dict())
    round.vote(deeds[2], deeds[3])
    round.vote(deeds[5], deeds[1])
    round.vote(deeds[4], deeds[3])
    round.end()
    print round.count_votes()

if __name__ == "__main__":
    r.flushdb()
    from peerdo.data.round import Round
    from peerdo.data.deed import Deed
    from peerdo.data.user import User
    user = User.create({'username': u'donald', 'password': u'donald'})
    from peerdo.data.round import Round
    from peerdo.data.deed import Deed
    from peerdo.data.user import User
    users = [User.create({'username': unicode(x), 'password': unicode(x) + u'   '}) for x in xrange(1, 5)]
    def im():
        return random.choice([
            "http://i.imgur.com/iDmqUMK.jpg",
            "http://i.imgur.com/ekmuddB.jpg",
            "http://i.imgur.com/n0yfX0Bb.jpg",
            "http://i.imgur.com/TulRgpyb.jpg",
        ])
    deeds = [Deed.create({'title': u'Deed %d' % u.id, 'message': 'test', 'user_id': u.id, 'giveback': random.choice([10, 50, 0, 12, 23, 63, 5]), 'image_url': im()}) for u in users]
    for c in deeds:
        Round.assign_to_or_create_round(c, 10)
        Round.assign_to_or_create_round(c, 20)
        Round.assign_to_or_create_round(c, 50)

    #deed = Deed.create({'title': 'My deed', 'message': 'test', 'user_id': user.id, 'giveback': 80, 'title': 'My deed', 'image_url': "http://i.imgur.com/Z63Kloa.jpg"})
    #round = Round.assign_to_or_create_round(deed, 10)
    #from peerdo.handlers import BaseHandler
    #BaseHandler.get_current_user = lambda s: user
    
    application.listen(5000)
    tornado.ioloop.IOLoop.instance().start()