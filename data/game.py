import voluptuous as v
from tornado.ioloop import IOLoop
from datetime import datetime, timedelta
import redis

from peerdo.data import RedisData, r
from peerdo.data.card import Card
from peerdo.data.user import User
from peerdo.settings import *
from peerdo.utils import parse_datetime, datetime_to_timestamp, json_dump, now
from collections import OrderedDict

import json
import random

class Game(RedisData):
    namespace = 'peer.do:games'
    ioloop = IOLoop.current()
    schema = v.Schema({
        'status': v.Coerce(str),
        'starts': v.All(datetime, v.Coerce(str)),
        'ends': v.All(datetime, v.Coerce(str)),
        'stake': v.All(v.Coerce(int), v.Any(10,20,50)),
        'cards': dict,
        'votes': dict,
        'users': set
    })

    #def __init__(self, data)

    def get_dict(self):
        # TODO: PIPELINE THIS
        results = {}
        for card_id, vote in r.hgetall(self.key('votes')).items():
            results[vote] = results.get(vote, 0) + 1
        return {
            "starts": self._g('starts', parse_datetime),
            "ends": self._g('ends', parse_datetime),
            "card_ids": {id: Card(id, json.loads(data)).get_dict() for id, data in r.hgetall(self.key('cards')).items()},
            "users": r.smembers(self.key('users')),
            "votes": results,
            "stake": self._g("stake"),
            "status": self.status,
            "winner_id": self._g("winner_id")
        }

    def _get_card_from_user(self, user):
        return Card(r.hget(self.key('users_cards'), user.id))

    def get_card_data_for_user(self, user, card):
        data = card.dict()
        data['is_mine'] = (card.user.id == user.id)
            
        mine = self._get_card_from_user(user)
        target = r.hget(self.key('votes'), mine.id)
        data['has_my_vote'] = (card.id == target)
        return data

    def get_data_for_user(self, user):
        data = self.dict()
        data['is_mine'] = user in r.smembers(self.key('users'))
        data['voted_for_winner'] = r.hget(self.key('votes'), self._get_card_from_user(user).id) == self._g('winner_id')
        return data

    def number_of_players(self):
        return r.hlen(self.key('cards'))

    @property
    def created_timestamp(self):
        return self._g('created')

    @property
    def has_ended(self):
        return parse_datetime(self._g('ends')) < now()

    def add_card(self, card):
        assert self._g('starts') is None or parse_datetime(self._g('starts')) > now()
        assert not self.in_game(card)
        assert not self.in_game(card.user)
        assert self.number_of_players() < MAX_CARDS_PER_GAME
        with r.pipeline() as pipe:
            pipe.hsetnx(self.key('cards'), card.id, "{}")
            pipe.sadd(self.key('users'), card.user.id)
            pipe.zadd(card.key('games'), self.created_timestamp, card.id)
            pipe.zadd(card.user.key('games'), self.created_timestamp, self.id)
            pipe.hsetnx(self.key('users_cards'), card.user.id, card.id)
            pipe.execute()

        print self.number_of_players(), MIN_CARDS_PER_GAME
        if self.number_of_players() >= MIN_CARDS_PER_GAME and self.status == 'waiting_for_players':
            starts = now() + timedelta(seconds=15)
            t = datetime_to_timestamp(starts)
            self._s('starts', starts)
            self.status = 'ready'
            self.publish_event('ready', dict(starts=starts))
            self._start_timeout = self.ioloop.add_timeout(t, self.start)
        elif self.number_of_players() == MAX_CARDS_PER_GAME:
            self.start(right_now=True)
        
        try:
            print datetime.fromtimestamp(self._start_timeout.deadline)
        except AttributeError:
            pass

        self.publish_event('joined', {'card_id': card.id})

    def remove_card(self, card):
        assert self._g('starts') is None or parse_datetime(self._g('starts')) > now()
        assert self.in_game(card)
        with r.pipeline() as pipe:
            pipe.hdel(self.key('cards'), card.id)
            pipe.srem(self.key('users'), card.user.id)
            pipe.zrem(card.key('games'), card.id)
            pipe.zrem(card.user.key('games'), self.id)
            pipe.hdel(self.key('users_cards'), card.user.id)
            pipe.execute()
        if self.number_of_players() < MIN_CARDS_PER_GAME:
            self.ioloop.remove_timeout(self._start_timeout)
            del self._start_timeout
            r.delete(self.key('starts'))
            self.status = 'waiting_for_players'
            self.publish_event('not_ready')
        self.publish_event('left', {'card_id': card.id})

    def in_game(self, card_or_user):
        if isinstance(card_or_user, Card):
            card = card_or_user
            return r.hexists(self.key('cards'), card.id)
        elif isinstance(card_or_user, User):
            user = card_or_user
            return r.sismember(self.key('users'), user.id)
        else:
            raise TypeError

    @property 
    def cards(self):
        return [Card.get(int(id)) for id in r.hgetall(self.key('cards'))] # fix?

    def get_card(self, id):
        assert self.in_game(Card(id))
        return Card.get(id) # fix?
        
    def publish_event(self, name, event_info=None, pipe=None):
        if pipe is None:
            pipe = r
        data = event_info or {}
        pipe.publish(self.key('events:%s' % name), json_dump(data))

    def start(self, right_now=False):
        print 'STARTING'
        if hasattr(self, '_start_timeout'):
            self.ioloop.remove_timeout(self._start_timeout)
        stake = self._g('stake')
        with r.pipeline() as pipe:
            pipe.srem(':'.join((self.namespace,'waiting_for_players_sets', stake)), self.id)
            if right_now:
                starts = now()
                pipe.set(self.key('starts'), starts)
            else:
                starts = self._g('starts', parse_datetime)
            ends = starts + timedelta(minutes=5)
            pipe.set(self.key('ends'), ends)
            pipe.set(self.key('status'), 'started')
            pipe.sadd(':'.join((self.namespace, 'started')), self.id)
            self._end_timeout = self.ioloop.add_timeout(datetime_to_timestamp(ends), self.end)
            pipe.execute()
        self.publish_event('started', {'starts': datetime_to_timestamp(starts), 'ends': datetime_to_timestamp(ends) })

    def end(self):
        self.ioloop.remove_timeout(self._end_timeout)
        with r.pipeline() as pipe:
            ends = now()
            pipe.set(self.key('ends'), ends)
            pipe.set(self.key('status'), 'ended')
            pipe.srem(':'.join((self.namespace, 'started')), self.id)
            pipe.sadd(':'.join((self.namespace, 'finished')), self.id)
            pipe.execute()
        votes = self.count_votes()
        if not votes:
            winner = -1
        else:
            winner = votes.keys()[0]
        self._s('winner_id', winner)
        self.publish_event('ended', {'ends': ends, "results": self.count_votes(), 'winner_id': winner})

    def count_votes(self):
        assert self.has_ended
        results = {}
        for card_id, vote in r.hgetall(self.key('votes')).items():
            results[vote] = results.get(vote, 0) + 1
        return OrderedDict([(id, n) for id, n in sorted(results.items(), key=lambda (k, v): v, reverse=True)])

    def vote(self, from_card, vote_for):
        assert vote_for == -1 or r.hexists(self.key('cards'), vote_for.id)
        assert from_card.id != vote_for.id
        def transaction_vote(pipe):
            pipe.watch(self.key('votes'))
            old = pipe.hget(self.key('votes'), from_card.id)
            if old is not None:
                old = int(old)
            pipe.multi()
            pipe.hset(self.key('votes'), from_card.id, vote_for.id)
            assert parse_datetime(r.get(self.key('ends'))) >= now() >= parse_datetime(r.get(self.key('starts')))
            return old
        old = r.transaction(transaction_vote, self.key('votes'), value_from_callable=True)
        self.publish_event('vote', {+1: vote_for.id, -1: old })

    def _create_with_data(self, data, pipe):
        created = datetime_to_timestamp(now())
        pipe.zadd(self.namespace + ':all', created, self.id)
        pipe.set(self.key('created'), created)
        for k, v in data.items():
            if isinstance(v, dict):
                if v:
                    pipe.hmset(self.key(k), v)
            elif isinstance(v, set):
                if v:
                    pipe.sadd(self.key(k), *v)
            else:
                pipe.set(self.key(k), v)

    @classmethod
    def assign_to_or_create_game(cls, card, stake):
        k = ':'.join((cls.namespace,'waiting_for_players_sets', str(stake)))
        if r.scard(k) < MIN_NUMBER_WAITING_GAMES:
            game = cls.create({
                "votes": {},
                "stake": stake,
                "status": "waiting_for_players"
            })
            r.sadd(k, game.id)
            game.add_card(card)
            return game
        else:
            games = [Game(id) for id in r.smembers(k)]
            games.sort(key=lambda g: g.number_of_players())
            possible_games = [g for g in games if g.number_of_players() == games[0].number_of_players() and not g.in_game(card) and not g.in_game(card.user)]
            if len(possible_games) == 0:
                raise Exception('You already have a card in this game.')
            game = random.choice(possible_games)
            game.add_card(card)
            return game

    @classmethod
    def get_all(cls, start=None, num=None, active=None):
        return [cls(id) for id in r.zrangebyscore(cls.namespace + ':all', '-inf', 'inf', start=start, num=num)]

    @classmethod
    def get_by_user(cls, user, start=None, num=None):
        return user.get_games(start, num)

    @classmethod
    def get_by_card(cls, card, start=None, num=None):
        return [cls(id) for id in r.zrangebyscore(card.key('games'), '-inf', 'inf', start=start, num=num)]

    @property
    def status(self):
        return self._g('status')

    @status.setter
    def status(self, v):
        self._s('status', v)

