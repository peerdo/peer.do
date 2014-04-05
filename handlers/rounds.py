from peerdo.handlers import APIHandler
from peerdo.data.deed import Deed
from peerdo.data.round import Round
from peerdo.utils import json_dump
import voluptuous as v
import tornado

class RoundHandler(APIHandler):
    # get all the data for a round.
    def get(self, round_id):
        try:
            g = Round.get(round_id)
        except Round.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Round not found.')
        else:
            self.write(json_dump(g.get_data_for_user(self.current_user)))

class RoundDeedsHandler(APIHandler):
    # get all the deeds in a round.
    def get(self, round_id):
        try:
            g = Round.get(round_id)
        except Round.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Round not found.')
        else:
            self.write(json_dump([g.get_deed_data_for_user(self.get_current_user(), c) for c in g.deeds]))

class RoundDeedHandler(APIHandler):
    # get all the deeds in a round.
    def get(self, round_id, deed_id):
        try:
            g = Round.get(round_id)
        except Round.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Round not found.')
        else:
            self.write(json_dump(g.get_deed_data_for_user(self.get_current_user(), g.get_deed(deed_id))))

class RoundsHandler(APIHandler):
    schema = v.Schema({
        v.Required('stake'): v.All(v.Coerce(int), v.Any(10, 20, 50)),
        v.Required('deed_id'): v.Coerce(int)
    })
    def get(self):
        print self.current_user
        if self.get_argument('mine', False):
            self.write(json_dump([g.get_data_for_user(self.current_user) for g in Round.get_by_user(self.current_user, self.get_argument('active', None))]))
        else:
            self.write(json_dump([g.get_data_for_user(self.current_user) for g in Round.get_all(active=self.get_argument('active', None))]))

    def put(self):
        data = self.schema(self.json_body)
        deed = Deed.get(data['deed_id'])
        g = Round.assign_to_or_create_round(deed, data['stake'])
        self.write(g.json())

class RoundVotesHandler(APIHandler):
    schema = v.Schema({
        v.Required('deed_id'): v.Coerce(int)
    })
    def post(self, round_id):
        data = self.schema(self.json_body)
        try:
            g = Round.get(round_id)
        except Round.DoesNotExist:
            raise tornado.web.HTTPError(404, 'Round not found.')
        user_deed = g._get_deed_from_user(self.current_user)
        g.vote(user_deed, g.get_deed(data['deed_id']))
