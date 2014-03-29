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

from peerdo.handlers.games import GameHandler, GamesHandler, GameCardsHandler, GameCardHandler, GameVotesHandler
from peerdo.handlers.cards import CardHandler, CardsHandler
from peerdo.handlers.main import MainHandler
from peerdo.conn import Connection
from peerdo.utils import RedisSessionStore
from peerdo.data import r
from sockjs.tornado import SockJSRouter

sock_router = SockJSRouter(Connection, '/sock')
application = tornado.web.Application([
    (r'/', MainHandler),
    (r"/api/games/([0-9]+)", GameHandler),
    (r"/api/games/([0-9]+)/cards", GameCardsHandler),
    (r"/api/games/([0-9]+)/votes", GameVotesHandler),
    (r"/api/games/([0-9]+)/cards/([0-9]+)", GameCardHandler),
    (r"/api/games", GamesHandler),
    (r"/api/cards", CardsHandler),
    (r"/api/cards/([0-9]+)", CardHandler),
    (r"/static/(.*)", tornado.web.StaticFileHandler, {"path": "static"}),
] + sock_router.urls, debug=True, cookie_secret="bspXHYciVieZwOYu3yaFP2315llKNB5efRwtJsyvIAeWT20dhza3yKUrWR7dUShqicRs9IEeOd8ZaaM9")
application.session_store = RedisSessionStore(r, key_prefix='peer.do:session', expire=3*24*60*60)

def testseq():
    r.flushdb()
    from peerdo.data.game import Game
    from peerdo.data.card import Card
    from peerdo.data.user import User
    users = [User.create({'username': unicode(x), 'password': unicode(x) + u'   '}) for x in xrange(1, 7)]
    cards = [Card.create({'title': u'Card %d' % u.id, 'message': 'test', 'user_id': u.id}) for u in users]
    for c in cards:
        game = Game.assign_to_or_create_game(c, 10)
    import pprint
    game.start(right_now=True)
    pprint.pprint(game.dict())
    game.vote(cards[2], cards[3])
    game.vote(cards[5], cards[1])
    game.vote(cards[4], cards[3])
    game.end()
    print game.count_votes()

if __name__ == "__main__":
    r.flushdb()
    from peerdo.data.game import Game
    from peerdo.data.card import Card
    from peerdo.data.user import User
    user = User.create({'username': u'donald', 'password': u'donald'})
    from peerdo.data.game import Game
    from peerdo.data.card import Card
    from peerdo.data.user import User
    users = [User.create({'username': unicode(x), 'password': unicode(x) + u'   '}) for x in xrange(1, 5)]
    def im():
        return random.choice([
            "http://i.imgur.com/iDmqUMK.jpg",
            "http://i.imgur.com/ekmuddB.jpg",
            "http://i.imgur.com/n0yfX0Bb.jpg",
            "http://i.imgur.com/TulRgpyb.jpg",
        ])
    cards = [Card.create({'title': u'Card %d' % u.id, 'message': 'test', 'user_id': u.id, 'giveback': random.choice([10, 50, 0, 12, 23, 63, 5]), 'image_url': im()}) for u in users]
    for c in cards:
        Game.assign_to_or_create_game(c, 10)
        Game.assign_to_or_create_game(c, 20)
        Game.assign_to_or_create_game(c, 50)

    #card = Card.create({'title': 'My card', 'message': 'test', 'user_id': user.id, 'giveback': 80, 'title': 'My card', 'image_url': "http://i.imgur.com/Z63Kloa.jpg"})
    #game = Game.assign_to_or_create_game(card, 10)
    #from peerdo.handlers import BaseHandler
    #BaseHandler.get_current_user = lambda s: user
    
    application.listen(5000)
    tornado.ioloop.IOLoop.instance().start()