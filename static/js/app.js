(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var App,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

App = (function(_super) {
  __extends(App, _super);

  function App() {
    return App.__super__.constructor.apply(this, arguments);
  }

  App.prototype.el = 'body';

  App.prototype.add_page = function(view) {
    return this.pages[view.name] = view;
  };

  App.prototype.show_page = function() {
    var args, page_name, _ref;
    page_name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    console.log.apply(console, args);
    this.current_page.hide();
    this.current_page = this.pages[page_name];
    return (_ref = this.current_page).show.apply(_ref, args);
  };

  App.prototype.initialize = function() {
    var AllGamesPage, GamePage, IndexPage, MyCardsCollection, MyCardsPage, MyGamesCollection, MyGamesPage, PageRouter;
    PageRouter = require('./router.coffee');
    GamePage = require('./views/pages/game.coffee');
    IndexPage = require('./views/pages/index.coffee');
    MyGamesPage = require('./views/pages/my_games.coffee').MyGamesPage;
    MyCardsPage = require('./views/pages/my_cards.coffee').MyCardsPage;
    AllGamesPage = require('./views/pages/all_games.coffee');
    MyGamesCollection = require('./views/pages/my_games.coffee').MyGamesCollection;
    MyCardsCollection = require('./views/pages/my_cards.coffee').MyCardsCollection;
    this.pages = {};
    this.collections = {};
    this.collections.my_games = new MyGamesCollection();
    this.collections.my_games.fetch({
      data: {
        mine: true
      },
      processData: true
    });
    this.collections.my_cards = new MyCardsCollection();
    this.collections.my_cards.fetch();
    this.add_page(new GamePage({
      app: this
    }));
    this.add_page(new MyGamesPage({
      app: this,
      collection: this.collections.my_games
    }));
    this.add_page(new AllGamesPage({
      app: this
    }));
    this.add_page(new MyCardsPage({
      app: this
    }));
    this.add_page(new IndexPage({
      app: this
    }));
    this.current_page = this.pages['my_games'];
    this.router = new PageRouter({
      app: this
    });
    this.sock = new SockJS("/sock");
    this.sock._games = {};
    this.sock.q = [];
    this.sock.onopen = function() {
      return console.log('open');
    };
    this.sock.onmessage = function(e) {
      var data, m, _i, _len, _ref;
      console.log(e);
      data = JSON.parse(e.data);
      if (data.type === 'request_auth') {
        this.send(JSON.stringify({
          type: 'auth',
          user_id: 1
        }));
      }
      if (data.type === 'auth' && data.data.message === 'success') {
        console.log('auth!');
        console.log(this.q);
        _ref = this.q;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          m = _ref[_i];
          this.send(m);
        }
      }
      if (data.type === 'game_event') {
        return this._games[data.game_id].trigger('server:' + data.event, data.data);
      }
    };
    this.sock.onclose = function() {
      return console.log('close');
    };
    this.sock.send_data = function(data) {
      var j;
      j = JSON.stringify(data);
      if (this.readyState === 0) {
        return this.q.push(j);
      } else {
        return this.send(j);
      }
    };
    this.sock.game_subscribe = function(game) {
      this._games[game.id] = game;
      return this.send_data({
        type: 'game_subscribe',
        game_id: game.id
      });
    };
    return this.sock.game_unsubscribe = function(game) {
      delete this._games[game.id];
      return this.send_data({
        type: 'game_unsubscribe',
        game_id: game.id
      });
    };
  };

  return App;

})(Backbone.View);

$(document).ready(function() {
  window.app = new App();
  return Backbone.history.start();
});


},{"./router.coffee":5,"./views/pages/all_games.coffee":7,"./views/pages/game.coffee":8,"./views/pages/index.coffee":9,"./views/pages/my_cards.coffee":10,"./views/pages/my_games.coffee":11}],2:[function(require,module,exports){
var Card, CardCollection, GameCard,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Card = (function(_super) {
  __extends(Card, _super);

  function Card() {
    return Card.__super__.constructor.apply(this, arguments);
  }

  Card.prototype.computeds = {
    votes: function() {
      var _ref;
      if (((_ref = this.collection) != null ? _ref.game : void 0) != null) {
        return this.collection.game.votes_for(this);
      } else {
        return null;
      }
    },
    other_votes: function() {
      return this.get('votes') - 1;
    },
    nice_winnings: function() {
      return this.get('winnings') + ' mBTC';
    },
    nice_giveback: function() {
      return this.get('giveback') + '%';
    }
  };

  Card.prototype.defaults = {
    message: '',
    title: 'Unnamed card',
    giveback: 0,
    url: '',
    image_url: 'http://imgur.com/jSjxOc2',
    credibility: 0,
    longevity: 0,
    winnings: 0
  };

  return Card;

})(Backbone.Epoxy.Model);

GameCard = (function(_super) {
  __extends(GameCard, _super);

  function GameCard() {
    return GameCard.__super__.constructor.apply(this, arguments);
  }

  GameCard.prototype.initialize = function(data, options) {
    return this.game = options.game || options.collection.game;
  };

  GameCard.prototype.urlRoot = function() {
    return this.game.url() + '/cards';
  };

  GameCard.prototype.vote = function() {
    this.collection.each(function(m) {
      return m.set('has_my_vote', false);
    });
    this.set('has_my_vote', true);
    return this.game.vote(this);
  };

  GameCard.prototype.computeds = _.extend(Card.prototype.computeds, {
    can_vote: function() {
      return this.get('is_mine') === false && this.game.get('status') === 'started';
    },
    game_winnings: {
      deps: ['giveback'],
      get: function() {
        var _ref;
        return ((_ref = this.game) != null ? _ref.get('winnings') : void 0) * (1 - this.get('giveback') / 100.0);
      }
    },
    giveback_per_vote: function() {
      var _ref;
      return ((((_ref = this.game) != null ? _ref.get('winnings') : void 0) * this.get('giveback') / 100.0) / this.get('votes')).toFixed(2);
    },
    giveback_actual: function() {
      var _ref;
      return (((_ref = this.game) != null ? _ref.get('winnings') : void 0) * this.get('giveback') / 100.0).toFixed(2);
    },
    nice_giveback_actual: function() {
      return this.get('giveback_actual') + ' mBTC';
    },
    nice_giveback_per_vote: function() {
      return this.get('giveback_per_vote') + ' mBTC';
    }
  });

  return GameCard;

})(Card);

CardCollection = (function(_super) {
  __extends(CardCollection, _super);

  function CardCollection() {
    return CardCollection.__super__.constructor.apply(this, arguments);
  }

  CardCollection.prototype.model = Card;

  CardCollection.prototype.url = '/api/cards';

  return CardCollection;

})(Backbone.Collection);

module.exports = {
  GameCard: GameCard,
  CardCollection: CardCollection,
  Card: Card
};


},{}],3:[function(require,module,exports){
var CardCollection, Game, GameCard, GameCardCollection, GameCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

moment.duration.fn.format = function(format) {
  return moment(this.as('milliseconds')).format(format);
};

Game = (function(_super) {
  __extends(Game, _super);

  function Game() {
    return Game.__super__.constructor.apply(this, arguments);
  }

  Game.prototype.urlRoot = '/api/games';

  Game.prototype.appUrl = function() {
    return "#games/" + this.id;
  };

  Game.prototype.votes_for = function(card) {
    return ((this.get('votes') != null) && this.get('votes')[card.id]) || 0;
  };

  Game.prototype.vote = function(card, cb) {
    var u;
    if (cb == null) {
      cb = $.noop;
    }
    u = this.url() + '/votes';
    return $.ajax({
      url: u,
      type: "POST",
      contentType: 'application/json',
      data: JSON.stringify({
        card_id: card.id
      }),
      dataType: 'json',
      success: function(data) {
        return cb();
      }
    });
  };

  Game.prototype.initialize = function(data) {
    this.cards = new GameCardCollection([], {
      game: this
    });
    this.cards.fetch({
      success: (function() {
        this.c().winner.get(true);
        return this.trigger('fetched_cards');
      }).bind(this)
    });
    this.messages = new GameMessageCollection([
      new Message({
        time: "16:08",
        message: "Test",
        is_mine: false
      }), new Message({
        time: "16:09",
        message: "Test!",
        is_mine: false
      }), new Message({
        time: "16:10",
        message: "Test 2",
        is_mine: true
      })
    ]);
    return this.on({
      'server:joined': function(e) {
        var c;
        c = new GameCard({
          id: e.card_id
        }, {
          game: this
        });
        return c.fetch({
          success: (function(_this) {
            return function() {
              return _this.cards.add(c);
            };
          })(this)
        });
      },
      'server:left': function(e) {
        return this.cards.remove(this.cards.at(e.card_id));
      },
      'server:started': function(e) {
        this.set('status', 'started');
        this.set('starts', e.starts);
        this.set('ends', e.ends);
        return this.trigger('start');
      },
      'server:ended': function(e) {
        this.set('status', 'ended');
        this.set('ends', e.ends);
        this.set('winner', e.winner);
        this.set('votes', e.results);
        return this.trigger('end', e);
      },
      'server:ready': function(e) {
        this.set('status', 'ready');
        return this.set('starts', e.starts);
      },
      'server:not_ready': function(e) {
        this.unset('starts');
        return this.set('status', 'waiting');
      },
      'server:vote': function(e) {
        var c_new, c_old;
        c_new = e[1];
        c_old = e[-1];
        if (this.get('votes')[c_new] == null) {
          this.get('votes')[c_new] = 0;
        }
        this.get('votes')[c_new] += 1;
        if (c_old != null) {
          if (this.get('votes')[c_old] == null) {
            this.get('votes')[c_old] = 0;
          }
          this.get('votes')[c_old] -= 1;
        }
        return this.trigger('change:votes');
      },
      'change:votes': function() {
        this.cards.each(function(card) {
          return card.c().votes.get(true);
        });
        return null;
      }
    });
  };

  Game.prototype.computeds = {
    url: function() {
      return this.appUrl();
    },
    cards: function() {
      return this.cards;
    },
    winner: function() {
      return this.cards.get(this.get('winner_id'));
    },
    messages: function() {
      return this.messages;
    },
    timeleft: function() {
      if (this.get('status') === 'waiting_for_players' || this.get('status') === 'ended') {
        return "00:00";
      }
      if (this.get('status') === 'started') {
        return moment.duration(moment.unix(this.get('ends')).diff(moment())).format('mm:ss');
      }
      if (this.get('status') === 'ready') {
        return '-' + moment.duration(moment.unix(this.get('starts')).diff(moment())).format('mm:ss');
      }
    },
    is_active: function() {
      return this.get('status') === 'active';
    },
    nice_status: function() {
      var statuses;
      statuses = {
        ready: 'Starting soon',
        waiting_for_players: 'Waiting for more players',
        started: 'Started',
        ended: 'Ended'
      };
      return statuses[this.get('status')];
    },
    nice_stake: function() {
      return this.get('stake') + ' mBTC';
    },
    potential_winnings: function() {
      return 0;
    },
    winnings: function() {
      return this.get('stake') * this.get('number_of_players');
    },
    nice_winnings: function() {
      return this.get('winnings') + ' mBTC';
    },
    number_of_players: {
      deps: ['card_ids'],
      get: function() {
        return _.size(this.get('card_ids'));
      }
    }
  };

  Game.prototype.send_message = function(message) {
    return this.messages.add(new Message({
      time: moment().format('HH:mm'),
      message: message,
      is_mine: true
    }));
  };

  Game.prototype.listen_for_game_events = function() {
    return window.app.sock.game_subscribe(this);
  };

  return Game;

})(Backbone.Epoxy.Model);

GameCollection = (function(_super) {
  __extends(GameCollection, _super);

  function GameCollection() {
    return GameCollection.__super__.constructor.apply(this, arguments);
  }

  GameCollection.prototype.model = Game;

  GameCollection.prototype.url = '/api/games';

  return GameCollection;

})(Backbone.Collection);

CardCollection = require('./card.coffee').CardCollection;

GameCard = require('./card.coffee').GameCard;

GameCardCollection = (function(_super) {
  __extends(GameCardCollection, _super);

  function GameCardCollection() {
    return GameCardCollection.__super__.constructor.apply(this, arguments);
  }

  GameCardCollection.prototype.initialize = function(models, options) {
    return this.game = options.game;
  };

  GameCardCollection.prototype.url = function() {
    return this.game.url() + '/cards';
  };

  GameCardCollection.prototype.model = GameCard;

  return GameCardCollection;

})(CardCollection);

module.exports = {
  Game: Game,
  GameCollection: GameCollection,
  GameCardCollection: GameCardCollection
};


},{"./card.coffee":2}],4:[function(require,module,exports){
var Message, MessageCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Message = (function(_super) {
  __extends(Message, _super);

  function Message() {
    return Message.__super__.constructor.apply(this, arguments);
  }

  return Message;

})(Backbone.Epoxy.Model);

MessageCollection = (function(_super) {
  __extends(MessageCollection, _super);

  function MessageCollection() {
    return MessageCollection.__super__.constructor.apply(this, arguments);
  }

  MessageCollection.prototype.model = Message;

  return MessageCollection;

})(Backbone.Collection);

module.exports = {
  Message: Message,
  MessageCollection: MessageCollection
};


},{}],5:[function(require,module,exports){
var PageRouter,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

PageRouter = (function(_super) {
  __extends(PageRouter, _super);

  function PageRouter() {
    return PageRouter.__super__.constructor.apply(this, arguments);
  }

  PageRouter.prototype.initialize = function(options) {
    PageRouter.__super__.initialize.apply(this, arguments);
    this.app = options.app;
    this.route('', 'main');
    this.route_page(/^games\/(\d+)$/, 'game');
    this.route('games/join/', 'games_join');
    this.route_page('games/', 'games');
    this.route_page('games/mine/', 'my_games');
    this.route_page('cards/mine/', 'my_cards');
    return this.route('cards/mine/create', 'create_card');
  };

  PageRouter.prototype.route_page = function(pattern, name) {
    return this.route(pattern, name, function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.app).show_page.apply(_ref, [name].concat(__slice.call(args)));
    });
  };

  PageRouter.prototype.games_join = function() {
    this.app.show_page('my_games');
    return this.app.pages.my_games.$('a.join.btn').click();
  };

  PageRouter.prototype.create_card = function() {
    this.app.show_page('my_cards');
    return this.app.pages.my_cards.$('#create-card-btn').click();
  };

  PageRouter.prototype.setup = function(name) {
    $('.page').hide();
    $("#page_" + name).show();
    return $('body').attr('class', name);
  };

  PageRouter.prototype.main = function() {
    return this.navigate('games/mine/', {
      trigger: true,
      replace: true
    });
  };

  PageRouter.prototype.go = function(target) {
    return this.navigate(target, {
      trigger: true
    });
  };

  return PageRouter;

})(Backbone.Router);

module.exports = PageRouter;


},{}],6:[function(require,module,exports){
var Page,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Page = (function(_super) {
  __extends(Page, _super);

  Page.prototype.name = '';

  function Page(options) {
    this.app = options.app;
    options.el = this.app.$('div#page_' + this.name);
    Page.__super__.constructor.call(this, options);
  }

  Page.prototype.show = function() {
    $('body').addClass("page_" + this.name);
    this.$el.show();
    return $("nav a[data-page='" + this.name + "']").addClass('active');
  };

  Page.prototype.hide = function() {
    this.$el.hide();
    $("nav a[data-page='" + this.name + "']").removeClass('active');
    return $('body').removeClass("page_" + this.name);
  };

  return Page;

})(Backbone.Epoxy.View);

module.exports = Page;


},{}],7:[function(require,module,exports){
var AllGamesPage, GamesListView, Page,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Page = require('../page.coffee');

GamesListView = (function(_super) {
  __extends(GamesListView, _super);

  function GamesListView() {
    return GamesListView.__super__.constructor.apply(this, arguments);
  }

  return GamesListView;

})(Backbone.Epoxy.View);

AllGamesPage = (function(_super) {
  __extends(AllGamesPage, _super);

  function AllGamesPage() {
    return AllGamesPage.__super__.constructor.apply(this, arguments);
  }

  AllGamesPage.prototype.name = 'all_games';

  AllGamesPage.prototype.initialize = function(options) {
    return this.listview = new GamesListView({
      collection: options.games_list
    });
  };

  return AllGamesPage;

})(Page);

module.exports = AllGamesPage;


},{"../page.coffee":6}],8:[function(require,module,exports){
var Card, Game, GameCardListItemView, GameCardListView, GameEndedView, GameMessageCollection, GameMessageListItemView, GameMessageListView, GameMessagesView, GamePage, GameView, MessageCollection, Page, card, game,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Page = require('../page.coffee');

card = require('../../models/card.coffee');

game = require('../../models/game.coffee');

Game = game.Game;

Card = card.Card;

MessageCollection = require('../../models/message.coffee').MessageCollection;

GameCardListItemView = (function(_super) {
  __extends(GameCardListItemView, _super);

  function GameCardListItemView() {
    return GameCardListItemView.__super__.constructor.apply(this, arguments);
  }

  GameCardListItemView.prototype.el = "<li classes:{voted:has_my_vote, mine:is_mine}>\n    <h3 data-bind=\"text:title\">Tarquin</h3>\n    <img data-bind=\"attr:{src:image_url}\" />\n    <div class=\"votes\" data-bind=\"text:votes\"></div>\n    <div class=\"full-card hidden\">\n    	<div class=\"img-container\">\n    		<img data-bind=\"attr:{src:image_url}\" />\n    		<h3 data-bind=\"text:title\">Name</h3>\n    		<div class=\"giveback\"><span><strong data-bind=\"text:giveback\">90</strong>%</span> giveback</div>\n    	</div>\n        <div class=\"message\" data-bind=\"text:message\">\n        	<strong>Message</strong>\n        	This message should be under 160 chars and can include links. :D</div>\n        <div class=\"ratings\">\n            <div class=\"credibility\"><strong>Credibility</strong><span data-bind=\"text:credibility\">50</span>%</div>\n            <div class=\"longevity\"><strong>Longevity</strong><span data-bind=\"text:longevity\">6</span> games</div>\n            <div class=\"winnings\"><strong>Winnings</strong><span data-bind=\"text:winnings\">501 mBTC</span></div>\n            	<div class=\"url\"><strong>Url</strong> <span data-bind=\"toggle:none(url)\">[no url]</span><a data-bind=\"text:url,attr:{href:url}\">View</a></div>\n        </div>\n        <button class=\"btn vote\" data-bind=\"toggle:can_vote,attr:{disabled:has_my_vote},text:select(has_my_vote, 'Voted!', 'Vote')\">Vote</button>\n    </div>\n</li>";

  GameCardListItemView.prototype.events = {
    'click h3, img': function(e) {
      e.preventDefault();
      return this.$('.full-card').toggleClass('hidden');
    },
    'click button.vote': function(e) {
      e.preventDefault();
      $(e.currentTarget).text('Voting...').attr('disabled', 'disabled');
      return this.model.vote();
    }
  };

  return GameCardListItemView;

})(Backbone.Epoxy.View);

GameMessageListItemView = (function(_super) {
  __extends(GameMessageListItemView, _super);

  function GameMessageListItemView() {
    return GameMessageListItemView.__super__.constructor.apply(this, arguments);
  }

  GameMessageListItemView.prototype.el = "<li data-bind=\"classes:{mine:is_mine}\">\n	<time data-bind=\"text:time\"></time>\n	<span data-bind=\"text:message\"></span>\n</li>";

  return GameMessageListItemView;

})(Backbone.Epoxy.View);

GameCardListView = (function(_super) {
  __extends(GameCardListView, _super);

  function GameCardListView() {
    return GameCardListView.__super__.constructor.apply(this, arguments);
  }

  GameCardListView.prototype.bindings = {
    ':el': "collection:$collection"
  };

  GameCardListView.prototype.itemView = GameCardListItemView;

  return GameCardListView;

})(Backbone.Epoxy.View);

GameMessageCollection = (function(_super) {
  __extends(GameMessageCollection, _super);

  function GameMessageCollection() {
    return GameMessageCollection.__super__.constructor.apply(this, arguments);
  }

  GameMessageCollection.prototype.view = GameMessageListItemView;

  return GameMessageCollection;

})(MessageCollection);

GameMessageListView = (function(_super) {
  __extends(GameMessageListView, _super);

  function GameMessageListView() {
    return GameMessageListView.__super__.constructor.apply(this, arguments);
  }

  GameMessageListView.prototype.el = "ul#game-messages";

  GameMessageListView.prototype.bindings = {
    ':el': "collection:$collection"
  };

  return GameMessageListView;

})(Backbone.Epoxy.View);

GameMessagesView = (function(_super) {
  __extends(GameMessagesView, _super);

  function GameMessagesView() {
    return GameMessagesView.__super__.constructor.apply(this, arguments);
  }

  GameMessagesView.prototype.initialize = function(options) {
    return this.list_view = new GameMessageListView({
      collection: options.model.get('messages')
    });
  };

  GameMessagesView.prototype.events = {
    'keydown .chatbox': 'onEnter'
  };

  GameMessagesView.prototype.onEnter = function(e) {
    if (e.which === 13) {
      e.preventDefault();
      this.model.send_message(this.$('.chatbox').val());
      this.$('.chatbox').val('');
      return this.$('ul#game-messages').scrollTop(this.$('ul#game-messages').height());
    }
  };

  return GameMessagesView;

})(Backbone.View);

GameEndedView = (function(_super) {
  __extends(GameEndedView, _super);

  function GameEndedView() {
    return GameEndedView.__super__.constructor.apply(this, arguments);
  }

  GameEndedView.prototype.el = '<div class="ended">\n	<h3>Winner: <strong data-bind="text:winner_title">Title</strong></h3>\n	<img data-bind="attr:{src:winner_image_url}" />\n	<div>Votes: <strong data-bind="text:winner_votes"></strong></div>\n	<div>Total won: <strong data-bind="text:nice_winnings"></strong></div>\n	<div>Given back: <strong data-bind="text:winner_nice_giveback_actual"></strong></div>\n	<p data-bind="toggle:voted_for_winner"><span data-bind="text:winner_other_votes"></span> other people voted for this card. Since giveback was <span data-bind="text:winner_nice_giveback">50%</span>, you got <span data-bind="text:winner_nice_giveback_per_vote"></span> back!</p>\n</div>';

  GameEndedView.prototype.initialize = function(options) {
    return this.bindingSources = {
      winner: function() {
        return options.model.get('winner');
      }
    };
  };

  return GameEndedView;

})(Backbone.Epoxy.View);

GameView = (function(_super) {
  __extends(GameView, _super);

  function GameView() {
    this.tick = __bind(this.tick, this);
    return GameView.__super__.constructor.apply(this, arguments);
  }

  GameView.prototype.el = '#page_game';

  GameView.prototype.bindings = {
    'div.status div.status-text': 'text:nice_status,attr:{"data-status":status}',
    'time.timer': 'text:timeleft',
    'div.pane div.stake span': 'text:stake',
    'div.pane div.potential span': 'text:potential_winnings'
  };

  GameView.prototype.initialize = function(options) {
    var initEndedView;
    options.model.listen_for_game_events();
    initEndedView = function() {
      var _ref;
      if (this.model.get('status') === 'ended') {
        if ((_ref = this.GameCardListView) != null) {
          _ref.destroy();
        }
        this.$('.pane.cards').hide();
        this.ended_view = new GameEndedView({
          model: this.model
        });
        return this.$('#ended-pane').html(this.ended_view.$el).show();
      }
    };
    this.model.on('end', initEndedView.bind(this));
    if (this.model.cards == null) {
      this.model.on('fetched_cards', initEndedView.bind(this));
    } else {
      initEndedView.bind(this)();
    }
    if (this.model.get('status') !== 'ended') {
      this.cards_view = new GameCardListView({
        collection: options.model.cards,
        el: this.$('#game-card-list').get()
      });
    }
    this.messages_view = new GameMessagesView({
      model: options.model,
      el: this.$("#game-messages-pane").get()
    });
    if (!this._timer) {
      return this._timer = setInterval(this.tick, 100);
    }
  };

  GameView.prototype.tick = function() {
    return this.model.c().timeleft.get(true);
  };

  return GameView;

})(Backbone.Epoxy.View);

GamePage = (function(_super) {
  __extends(GamePage, _super);

  function GamePage() {
    return GamePage.__super__.constructor.apply(this, arguments);
  }

  GamePage.prototype.name = 'game';

  GamePage.prototype.show = function(id) {
    var g, p;
    GamePage.__super__.show.apply(this, arguments);
    g = new Game({
      id: id
    });
    p = this;
    return g.fetch({
      success: function() {
        return p.gameview = new GameView({
          model: g
        });
      }
    });
  };

  return GamePage;

})(Page);

module.exports = GamePage;


},{"../../models/card.coffee":2,"../../models/game.coffee":3,"../../models/message.coffee":4,"../page.coffee":6}],9:[function(require,module,exports){
var IndexPage, Page,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Page = require('../page.coffee');

IndexPage = (function(_super) {
  __extends(IndexPage, _super);

  function IndexPage() {
    return IndexPage.__super__.constructor.apply(this, arguments);
  }

  IndexPage.prototype.name = 'index';

  return IndexPage;

})(Page);

module.exports = IndexPage;


},{"../page.coffee":6}],10:[function(require,module,exports){
var CardCollection, MyCardView, MyCardsCollection, MyCardsListItemView, MyCardsListView, MyCardsPage, Page,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

CardCollection = require('../../models/card.coffee').CardCollection;

Page = require('../page.coffee');

MyCardsCollection = (function(_super) {
  __extends(MyCardsCollection, _super);

  function MyCardsCollection() {
    return MyCardsCollection.__super__.constructor.apply(this, arguments);
  }

  return MyCardsCollection;

})(CardCollection);

MyCardsListItemView = (function(_super) {
  __extends(MyCardsListItemView, _super);

  function MyCardsListItemView() {
    return MyCardsListItemView.__super__.constructor.apply(this, arguments);
  }

  MyCardsListItemView.prototype.el = "<li data-bind=\"attr:{'data-cid': $model().cid}\">\n	<img data-bind=\"attr:{src:image_url}\" />\n	<div>\n		<h4 data-bind=\"text:title\"></h4>\n		<div class=\"data\">\n            <div class=\"credibility\"><span data-bind=\"text:credibility\">50</span>% credibility</div>\n            <div class=\"longevity\"><span data-bind=\"text:longevity\">6</span> games</div>\n            <div class=\"winnings\">won <span data-bind=\"text:nice_winnings\">501 mBTC</span></div>\n        </div>\n    </div>\n	    </li>";

  return MyCardsListItemView;

})(Backbone.Epoxy.View);

MyCardsListView = (function(_super) {
  __extends(MyCardsListView, _super);

  function MyCardsListView() {
    return MyCardsListView.__super__.constructor.apply(this, arguments);
  }

  MyCardsListView.prototype.el = 'ul#my-cards-list';

  MyCardsListView.prototype.bindings = {
    ':el': 'collection:$collection'
  };

  MyCardsListView.prototype.itemView = MyCardsListItemView;

  return MyCardsListView;

})(Backbone.Epoxy.View);

MyCardView = (function(_super) {
  __extends(MyCardView, _super);

  function MyCardView() {
    return MyCardView.__super__.constructor.apply(this, arguments);
  }

  MyCardView.prototype.el = "<div class=\"card\">\n<div class=\"full-card\">\n	<div class=\"img-container\">\n		<img data-bind=\"attr:{src:image_url}\" />\n		<h3 class=\"title\" data-bind=\"text:title\">Name</h3>\n		<div class=\"giveback\"><span><strong data-bind=\"text:giveback\" class=\"givebackval\">90</strong>%</span> giveback</div>\n	</div>\n    <div class=\"message\" data-bind=\"text:message\"></div>\n    <div class=\"ratings\">\n        <div class=\"credibility\"><strong>Credibility</strong><span data-bind=\"text:credibility\">50</span>%</div>\n        <div class=\"longevity\"><strong>Longevity</strong><span data-bind=\"text:longevity\">6</span> games</div>\n        <div class=\"winnings\"><strong>Winnings</strong><span data-bind=\"text:nice_winnings\">501 mBTC</span></div>\n            	<div class=\"url\"><strong>Url</strong> <span data-bind=\"toggle:none(url)\">[no url]</span><a data-bind=\"text:url,attr:{href:url}\">View</a></div>\n    </div>\n    <button class=\"btn edit\">Edit</button>\n</div>\n    	 <form class=\"edit-card form-horizontal\" style=\"display:none;\"> \n        	<div class=\"form-group\">\n        		<label class=\"col-sm-2 control-label\" for=\"id_title\" style=\"display:none;\">Title</label>\n        		<div class=\"col-sm-12\"><input type=\"text\" id=\"id_title\" name=\"title\" placeholder=\"title\" class=\"form-control input-lg\"/></div>\n        	</div>\n        	<div class='form-group'>\n        		<label class=\"col-sm-2 control-label\" for=\"id_giveback\">Giveback percentage</label>\n        		<div class=\"col-sm-10\"><input type=\"number\" name=\"giveback\" min=\"0\" max=\"100\" step=\"1\" class=\"form-control\" /></div>\n        	</div>\n        	<div class=\"form-group\">\n        		<label class=\"col-sm-2 control-label\" for=\"id_url\">URL</label>\n        		<div class=\"col-sm-10\"><input type=\"url\" name=\"url\" id=\"id_url\" class=\"form-control\"/></div>\n        	</div>\n        	<div class=\"form-group\">\n        		<label class=\"col-sm-2 control-label\" for=\"id_message\">Message</label>\n        		<div class=\"col-sm-10\"><textarea name=\"message\" id=\"id_message\" class=\"form-control\"></textarea></div>\n        	</div>\n        	<div class=\"form-group\">\n        		<label class=\"col-sm-2 control-label\" for=\"id_image\">Image</label>\n        		<div class=\"col-sm-10\"><input type=\"url\" name=\"image_url\" id=\"id_image\" class=\"form-control\"/></div>\n        	</div>\n        	<button class=\"btn btn-success\" type=\"submit\">Save</button>\n    		<button class=\"btn cancel\" type=\"reset\">Cancel</button>\n        </form></div>";

  MyCardView.prototype.onEdit = function(e) {
    e.preventDefault();
    this.$('.full-card').hide();
    this.$('form input[name=title]').val(this.model.get('title'));
    this.$('form input[name=image_url]').val(this.model.get('image_url'));
    this.$('form input[name=url]').val(this.model.get('url'));
    this.$('form input[name=giveback]').val(this.model.get('giveback'));
    this.$('form textarea[name=message]').val(this.model.get('message'));
    return this.$('form').show();
  };

  MyCardView.prototype.events = {
    'click button.edit': 'onEdit',
    'submit form': 'onSubmit',
    'click button.cancel': 'onCancel'
  };

  MyCardView.prototype.onSubmit = function(e) {
    var n, updates, _i, _len, _ref;
    e.preventDefault();
    updates = {};
    _ref = "title message giveback url image_url".split(' ');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      n = _ref[_i];
      updates[n] = this.$("form *[name=" + n + "]").val();
    }
    this.model.save(updates, {
      patch: true,
      success: function(c, d, xhr) {
        c.set('id', d.card_id);
        return c.collection.trigger('change');
      }
    });
    this.$('form').hide();
    return this.$('.full-card').show();
  };

  MyCardView.prototype.onCancel = function(e) {
    if (this.model.isNew()) {
      this.model.destroy();
    }
    this.$('form').hide();
    return this.$('.full-card').show();
  };

  return MyCardView;

})(Backbone.Epoxy.View);

MyCardsPage = (function(_super) {
  __extends(MyCardsPage, _super);

  function MyCardsPage() {
    return MyCardsPage.__super__.constructor.apply(this, arguments);
  }

  MyCardsPage.prototype.name = 'my_cards';

  MyCardsPage.prototype.bindings = {
    'div.pane.header div.cards span': 'text:length($collection)'
  };

  MyCardsPage.prototype.events = {
    'click ul#my-cards-list li': 'onLiClick',
    'click .pane.header .new button': 'onAdd'
  };

  MyCardsPage.prototype.initialize = function() {
    this.collection = this.app.collections.my_cards;
    return this.listview = new MyCardsListView({
      collection: this.collection
    });
  };

  MyCardsPage.prototype.onLiClick = function(e) {
    return this.showCard($(e.currentTarget));
  };

  MyCardsPage.prototype.showCard = function($li) {
    this.$('ul#my-cards-list li').removeClass('active');
    $li.addClass('active');
    this.view = new MyCardView({
      model: this.collection.get($li.attr('data-cid'))
    });
    return this.$('#card-view').html(this.view.$el);
  };

  MyCardsPage.prototype.onAdd = function() {
    var c;
    c = new Card();
    this.collection.add(c);
    this.showCard($("ul#my-cards-list li[data-cid=" + c.cid + "]"));
    return this.view.$('button.edit').click();
  };

  return MyCardsPage;

})(Page);

module.exports = {
  MyCardsPage: MyCardsPage,
  MyCardsCollection: MyCardsCollection
};


},{"../../models/card.coffee":2,"../page.coffee":6}],11:[function(require,module,exports){
var Card, Game, GameCollection, JoinGameItemView, JoinGameOptionView, JoinGameView, MyGamesCollection, MyGamesListItemView, MyGamesListView, MyGamesPage, Page, card, game,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Page = require('../page.coffee');

card = require('../../models/card.coffee');

game = require('../../models/game.coffee');

Game = game.Game;

Card = card.Card;

GameCollection = game.GameCollection;

JoinGameOptionView = (function() {
  function JoinGameOptionView() {}

  JoinGameOptionView.prototype.el = "<option name=\"value\">";

  return JoinGameOptionView;

})();

JoinGameItemView = (function(_super) {
  __extends(JoinGameItemView, _super);

  function JoinGameItemView() {
    return JoinGameItemView.__super__.constructor.apply(this, arguments);
  }

  JoinGameItemView.prototype.el = '#join-game-form #select-card';

  JoinGameItemView.prototype.bindings = {
    el: 'collection:$collection',
    itemView: JoinGameOptionView
  };

  return JoinGameItemView;

})(Backbone.Epoxy.View);

JoinGameView = (function(_super) {
  __extends(JoinGameView, _super);

  function JoinGameView() {
    return JoinGameView.__super__.constructor.apply(this, arguments);
  }

  JoinGameView.prototype.el = '#join-game-form';

  JoinGameView.prototype.events = {
    'submit': 'onSubmit'
  };

  JoinGameView.prototype.initialize = function(options) {
    var format, getData, init_s2;
    this.cards = options.cards;
    getData = function(collection) {
      var l;
      l = collection.map(function(c) {
        return {
          id: c.id,
          text: c.get('title'),
          model: c
        };
      });
      l.push({
        id: '',
        text: 'Create card'
      });
      return l;
    };
    format = function(card) {
      var t;
      t = '';
      if (card.model) {
        t = "<img style=\"height:80px; padding:5px 5px 5px 0; vertical-align:middle;\" src=\"" + (card.model.get('image_url')) + "\" /> ";
      }
      t += card.text;
      return t;
    };
    init_s2 = (function() {
      return this.$('#select-card').select2({
        data: getData(this.cards),
        formatResult: format,
        formatSelection: format,
        escapeMarkup: function(m) {
          return m;
        }
      });
    }).bind(this);
    this.cards.on('add reset remove change', function() {
      return init_s2();
    });
    window.init_s2 = init_s2;
    return init_s2();
  };

  JoinGameView.prototype.onSubmit = function(e) {
    var data;
    e.preventDefault();
    data = {
      stake: this.$("input[name=stake]:checked").val(),
      card_id: this.$('input#select-card').val()
    };
    if (!data.card_id) {
      app.router.go('#cards/mine/create');
      $('#joinGameModal button.close').click();
      return false;
    }
    this.$('button[type=submit]').html("Joining...").addClass('active');
    return $.ajax({
      type: 'PUT',
      url: Game.prototype.urlRoot,
      contentType: 'application/json',
      data: JSON.stringify(data),
      dataType: 'json',
      success: function(data) {
        var g;
        g = new Game(data);
        app.collections.my_games.add(g);
        app.router.go(g.appUrl());
        return $('#joinGameModal button.close').click();
      }
    });
  };

  return JoinGameView;

})(Backbone.Epoxy.View);

MyGamesListView = (function(_super) {
  __extends(MyGamesListView, _super);

  function MyGamesListView() {
    return MyGamesListView.__super__.constructor.apply(this, arguments);
  }

  MyGamesListView.prototype.bindings = {
    ':el': "collection:$collection"
  };

  MyGamesListView.prototype.initialize = function(options) {
    console.log(options);
    return console.log(this);
  };

  return MyGamesListView;

})(Backbone.Epoxy.View);

MyGamesListItemView = (function(_super) {
  __extends(MyGamesListItemView, _super);

  function MyGamesListItemView() {
    return MyGamesListItemView.__super__.constructor.apply(this, arguments);
  }

  MyGamesListItemView.prototype.el = "<li>\n	<a data-bind=\"attr:{href:url, class:status}\">\n		<div class=\"info\">\n			<div class=\"cards\"><span data-bind=\"text:number_of_players\"></span> cards</div>\n			<div class=\"stake\" data-bind=\"text:nice_stake\"></div>\n			<div class=\"status\" data-bind=\"text:nice_status\"></div>\n		</div>\n		<div class=\"time\" data-bind=\"toggle:is_active,text:timeleft\"></div>\n	</a>\n</li>";

  MyGamesListItemView.prototype.events = {
    'click a': function(e) {
      e.preventDefault();
      return app.router.go($(e.currentTarget).attr('href'));
    }
  };

  return MyGamesListItemView;

})(Backbone.Epoxy.View);

MyGamesCollection = (function(_super) {
  __extends(MyGamesCollection, _super);

  function MyGamesCollection() {
    return MyGamesCollection.__super__.constructor.apply(this, arguments);
  }

  MyGamesCollection.prototype.view = MyGamesListItemView;

  return MyGamesCollection;

})(GameCollection);

MyGamesPage = (function(_super) {
  __extends(MyGamesPage, _super);

  function MyGamesPage() {
    return MyGamesPage.__super__.constructor.apply(this, arguments);
  }

  MyGamesPage.prototype.name = 'my_games';

  MyGamesPage.prototype.events = {
    'click #join-game-button': function(e) {
      e.preventDefault();
      return $('#joinGameModal').modal();
    }
  };

  MyGamesPage.prototype.initialize = function(options) {
    this.listview = new MyGamesListView({
      collection: this.app.collections.my_games,
      el: this.$('ul#my-games-grid')
    });
    return this.joingameview = new JoinGameView({
      cards: this.app.collections.my_cards
    });
  };

  return MyGamesPage;

})(Page);

module.exports = {
  MyGamesPage: MyGamesPage,
  MyGamesCollection: MyGamesCollection
};


},{"../../models/card.coffee":2,"../../models/game.coffee":3,"../page.coffee":6}]},{},[1])