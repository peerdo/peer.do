from peerdo.handlers import APIHandler
from peerdo.data.card import Card
from peerdo.data.game import Game
from peerdo.utils import json_dump
import voluptuous as v
import tornado

class GameHandler(APIHandler):
    # get all the data for a game.
    def get(self, game_id):
        try:
            g = Game.get(game_id)
        except Game.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Game not found.')
        else:
            self.write(json_dump(g.get_data_for_user(self.current_user)))

class GameCardsHandler(APIHandler):
    # get all the cards in a game.
    def get(self, game_id):
        try:
            g = Game.get(game_id)
        except Game.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Game not found.')
        else:
            self.write(json_dump([g.get_card_data_for_user(self.get_current_user(), c) for c in g.cards]))

class GameCardHandler(APIHandler):
    # get all the cards in a game.
    def get(self, game_id, card_id):
        try:
            g = Game.get(game_id)
        except Game.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Game not found.')
        else:
            self.write(json_dump(g.get_card_data_for_user(self.get_current_user(), g.get_card(card_id))))

class GamesHandler(APIHandler):
    schema = v.Schema({
        v.Required('stake'): v.All(v.Coerce(int), v.Any(10, 20, 50)),
        v.Required('card_id'): v.Coerce(int)
    })
    def get(self):
        print self.current_user
        if self.get_argument('mine', False):
            self.write(json_dump([g.get_data_for_user(self.current_user) for g in Game.get_by_user(self.current_user, self.get_argument('active', None))]))
        else:
            self.write(json_dump([g.get_data_for_user(self.current_user) for g in Game.get_all(active=self.get_argument('active', None))]))

    def put(self):
        data = self.schema(self.json_body)
        card = Card.get(data['card_id'])
        g = Game.assign_to_or_create_game(card, data['stake'])
        self.write(g.json())

class GameVotesHandler(APIHandler):
    schema = v.Schema({
        v.Required('card_id'): v.Coerce(int)
    })
    def post(self, game_id):
        data = self.schema(self.json_body)
        try:
            g = Game.get(game_id)
        except Game.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Game not found.')
        user_card = g._get_card_from_user(self.current_user)
        g.vote(user_card, g.get_card(data['card_id']))
