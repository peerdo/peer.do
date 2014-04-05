from tornadoredis.pubsub import SockJSSubscriber
from tornado import gen
import tornadoredis
import json 
from sockjs.tornado import SockJSConnection
from django.core import signing
from peerdo.data.user import User
from peerdo.utils import json_dump
import logging

# Create the tornadoredis.Client instance
# and use it for redis channel subscriptions
#subscriber = SockJSSubscriber(r)
class Connection(SockJSConnection):
    clients = set()
    rounds = dict()

    def __init__(self, *args, **kwargs):
        super(Connection, self).__init__(*args, **kwargs)
        self.client = tornadoredis.Client()

    def send_error(self, message, error_type=None):
        """
        Standard format for all errors
        """
        return self.send(json_dump({
            'type': 'error' if not error_type else '%s_error' % error_type,
            'data': {
                'message': message
            }
        }))

    def on_redis_message(self, msg):
        print msg
        import re
        if msg.kind == 'pmessage' and re.match(r'peer.do:rounds:(\d+):events:\*', msg.pattern) and msg.body:
            msg_type = msg.channel.split(':')[-1]
            round_id = int(msg.channel.split(':')[2])
            # ew. work out a better way of adding to the JSON message.
            self.send(json_dump({
                'type': 'round_event',
                'event': msg_type,
                'round_id': round_id,
                'data': json.loads(msg.body)
            }))

    def send_message(self, message, data_type):
        """
        Standard format for all messages
        """
        return self.send(json_dump({
            'type': data_type,
            'data': message,
        }))

    def on_open(self, request):
        """
        Request the client to authenticate and add them to client pool.
        """
        self.authenticated = False
        self.user_id = None
        self.send_message({}, 'request_auth')
        self.clients.add(self)

    @gen.engine
    def on_message(self, msg):
        """
        Handle authentication and notify the client if anything is not ok,
        but don't give too many details
        """
        try:
            message = json.loads(msg)
        except ValueError:
            self.send_error("Invalid JSON")
            return
        if message.get('type') == 'auth' and not self.authenticated:
            user_id = int(message['user_id'])
        #     try:
        #         user_id = int(signing.loads(
        #             message['data']['token'],
        #             key=SECRET_KEY,
        #             salt=message['data']['salt'],
        #             max_age=40  # Long time out for heroku idling processes.
        #             # For other cases, reduce to 10
        #         ))
        #     except (signing.BadSignature, KeyError, TypeError) as e:
        #         self.send_error("Token invalid", 'auth')
        #         return
            self.authenticated = True
            self.user = User.get(id=user_id)
            self.send_message({'message': 'success'}, 'auth')
            logging.debug("Authenticated for %s" % user_id)

        elif message.get('type') == 'round_subscribe' and self.authenticated:
            print 'SUBSCRIBING'
            yield gen.Task(self.client.psubscribe, 'peer.do:rounds:%s:events:*' % message['round_id'])
            self.client.listen(self.on_redis_message)
            print 'SUBSCRIBED'

        elif message.get('type') == 'round_unsubscribe' and self.authenticated:
            self.client.punsubscribe('peer.do:rounds:%s:events:*' % message['round_id'])


        else:
            self.send_error("Invalid data type %s" % message['type'])
            logging.debug("Invalid data type %s" % message['type'])

    def on_close(self):
        """
        Remove client from pool. Unlike Socket.IO connections are not
        re-used on e.g. browser refresh.
        """
        self.clients.remove(self)
        return super(Connection, self).on_close()

# class ConnectionHandler(SockJSConnection):
#     def __init__(self, *args, **kwargs):
#         super(ConnectionHandler, self).__init__(*args, **kwargs)

#     def on_open(self, info):
#         subscriber.listen(self.on_chan_message)

#     def on_message(self, msg):
#         data = json.loads(msg)

#         if data['action'] == 'round_subscribe':
#             subscriber.psubscribe('peer.do:rounds:%s:events' % data['round_id'], self)
#         elif data['action'] == 'round_unsubscribe':
#             subscriber.punsubscribe('peer.do:rounds:%s:events' % data['round_id'], self)

#     def on_close(self):
#         subscriber.punsubscribe('*')