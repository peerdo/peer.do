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
    var AllRoundsPage, IndexPage, MyDeedsCollection, MyDeedsPage, MyRoundsCollection, MyRoundsPage, PageRouter, RoundPage;
    PageRouter = require('./router.coffee');
    RoundPage = require('./views/pages/round.coffee');
    IndexPage = require('./views/pages/index.coffee');
    MyRoundsPage = require('./views/pages/my_rounds.coffee').MyRoundsPage;
    MyDeedsPage = require('./views/pages/my_deeds.coffee').MyDeedsPage;
    AllRoundsPage = require('./views/pages/all_rounds.coffee');
    MyRoundsCollection = require('./views/pages/my_rounds.coffee').MyRoundsCollection;
    MyDeedsCollection = require('./views/pages/my_deeds.coffee').MyDeedsCollection;
    this.pages = {};
    this.collections = {};
    this.collections.my_rounds = new MyRoundsCollection();
    this.collections.my_rounds.fetch({
      data: {
        mine: true
      },
      processData: true
    });
    this.collections.my_deeds = new MyDeedsCollection();
    this.collections.my_deeds.fetch();
    this.add_page(new RoundPage({
      app: this
    }));
    this.add_page(new MyRoundsPage({
      app: this,
      collection: this.collections.my_rounds
    }));
    this.add_page(new AllRoundsPage({
      app: this
    }));
    this.add_page(new MyDeedsPage({
      app: this
    }));
    this.add_page(new IndexPage({
      app: this
    }));
    this.current_page = this.pages['my_rounds'];
    this.router = new PageRouter({
      app: this
    });
    this.sock = new SockJS("/sock");
    this.sock._rounds = {};
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
      if (data.type === 'round_event') {
        return this._rounds[data.round_id].trigger('server:' + data.event, data.data);
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
    this.sock.round_subscribe = function(round) {
      this._rounds[round.id] = round;
      return this.send_data({
        type: 'round_subscribe',
        round_id: round.id
      });
    };
    return this.sock.round_unsubscribe = function(round) {
      delete this._rounds[round.id];
      return this.send_data({
        type: 'round_unsubscribe',
        round_id: round.id
      });
    };
  };

  return App;

})(Backbone.View);

$(document).ready(function() {
  window.app = new App();
  return Backbone.history.start();
});


},{"./router.coffee":5,"./views/pages/all_rounds.coffee":7,"./views/pages/index.coffee":8,"./views/pages/my_deeds.coffee":9,"./views/pages/my_rounds.coffee":10,"./views/pages/round.coffee":11}],2:[function(require,module,exports){
var Deed, DeedCollection, RoundDeed,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Deed = (function(_super) {
  __extends(Deed, _super);

  function Deed() {
    return Deed.__super__.constructor.apply(this, arguments);
  }

  Deed.prototype.computeds = {
    votes: function() {
      var _ref;
      if (((_ref = this.collection) != null ? _ref.round : void 0) != null) {
        return this.collection.round.votes_for(this);
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

  Deed.prototype.defaults = {
    message: '',
    title: 'Unnamed deed',
    giveback: 0,
    url: '',
    image_url: 'http://imgur.com/jSjxOc2',
    credibility: 0,
    longevity: 0,
    winnings: 0
  };

  return Deed;

})(Backbone.Epoxy.Model);

RoundDeed = (function(_super) {
  __extends(RoundDeed, _super);

  function RoundDeed() {
    return RoundDeed.__super__.constructor.apply(this, arguments);
  }

  RoundDeed.prototype.initialize = function(data, options) {
    return this.round = options.round || options.collection.round;
  };

  RoundDeed.prototype.urlRoot = function() {
    return this.round.url() + '/deeds';
  };

  RoundDeed.prototype.vote = function() {
    this.collection.each(function(m) {
      return m.set('has_my_vote', false);
    });
    this.set('has_my_vote', true);
    return this.round.vote(this);
  };

  RoundDeed.prototype.computeds = _.extend(Deed.prototype.computeds, {
    can_vote: function() {
      return this.get('is_mine') === false && this.round.get('status') === 'started';
    },
    round_winnings: {
      deps: ['giveback'],
      get: function() {
        var _ref;
        return ((_ref = this.round) != null ? _ref.get('winnings') : void 0) * (1 - this.get('giveback') / 100.0);
      }
    },
    giveback_per_vote: function() {
      var _ref;
      return ((((_ref = this.round) != null ? _ref.get('winnings') : void 0) * this.get('giveback') / 100.0) / this.get('votes')).toFixed(2);
    },
    giveback_actual: function() {
      var _ref;
      return (((_ref = this.round) != null ? _ref.get('winnings') : void 0) * this.get('giveback') / 100.0).toFixed(2);
    },
    nice_giveback_actual: function() {
      return this.get('giveback_actual') + ' mBTC';
    },
    nice_giveback_per_vote: function() {
      return this.get('giveback_per_vote') + ' mBTC';
    }
  });

  return RoundDeed;

})(Deed);

DeedCollection = (function(_super) {
  __extends(DeedCollection, _super);

  function DeedCollection() {
    return DeedCollection.__super__.constructor.apply(this, arguments);
  }

  DeedCollection.prototype.model = Deed;

  DeedCollection.prototype.url = '/api/deeds';

  return DeedCollection;

})(Backbone.Collection);

module.exports = {
  RoundDeed: RoundDeed,
  DeedCollection: DeedCollection,
  Deed: Deed
};


},{}],3:[function(require,module,exports){
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


},{}],4:[function(require,module,exports){
var DeedCollection, MessageCollection, Round, RoundCollection, RoundDeed, RoundDeedCollection, RoundMessageCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

moment.duration.fn.format = function(format) {
  return moment(this.as('milliseconds')).format(format);
};

Round = (function(_super) {
  __extends(Round, _super);

  function Round() {
    return Round.__super__.constructor.apply(this, arguments);
  }

  Round.prototype.urlRoot = '/api/rounds';

  Round.prototype.appUrl = function() {
    return "#rounds/" + this.id;
  };

  Round.prototype.votes_for = function(deed) {
    return ((this.get('votes') != null) && this.get('votes')[deed.id]) || 0;
  };

  Round.prototype.vote = function(deed, cb) {
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
        deed_id: deed.id
      }),
      dataType: 'json',
      success: function(data) {
        return cb();
      }
    });
  };

  Round.prototype.initialize = function(data) {
    var Message;
    this.deeds = new RoundDeedCollection([], {
      round: this
    });
    this.deeds.fetch({
      success: (function() {
        this.c().winner.get(true);
        return this.trigger('fetched_deeds');
      }).bind(this)
    });
    Message = require('./message.coffee').Message;
    this.messages = new RoundMessageCollection([
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
        c = new RoundDeed({
          id: e.deed_id
        }, {
          round: this
        });
        return c.fetch({
          success: (function(_this) {
            return function() {
              return _this.deeds.add(c);
            };
          })(this)
        });
      },
      'server:left': function(e) {
        return this.deeds.remove(this.deeds.at(e.deed_id));
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
        this.deeds.each(function(deed) {
          return deed.c().votes.get(true);
        });
        return null;
      }
    });
  };

  Round.prototype.computeds = {
    url: function() {
      return this.appUrl();
    },
    deeds: function() {
      return this.deeds;
    },
    winner: function() {
      return this.deeds.get(this.get('winner_id'));
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
      deps: ['deed_ids'],
      get: function() {
        return _.size(this.get('deed_ids'));
      }
    }
  };

  Round.prototype.send_message = function(message) {
    return this.messages.add(new Message({
      time: moment().format('HH:mm'),
      message: message,
      is_mine: true
    }));
  };

  Round.prototype.listen_for_round_events = function() {
    return window.app.sock.round_subscribe(this);
  };

  return Round;

})(Backbone.Epoxy.Model);

RoundCollection = (function(_super) {
  __extends(RoundCollection, _super);

  function RoundCollection() {
    return RoundCollection.__super__.constructor.apply(this, arguments);
  }

  RoundCollection.prototype.model = Round;

  RoundCollection.prototype.url = '/api/rounds';

  return RoundCollection;

})(Backbone.Collection);

DeedCollection = require('./deed.coffee').DeedCollection;

RoundDeed = require('./deed.coffee').RoundDeed;

RoundDeedCollection = (function(_super) {
  __extends(RoundDeedCollection, _super);

  function RoundDeedCollection() {
    return RoundDeedCollection.__super__.constructor.apply(this, arguments);
  }

  RoundDeedCollection.prototype.initialize = function(models, options) {
    return this.round = options.round;
  };

  RoundDeedCollection.prototype.url = function() {
    return this.round.url() + '/deeds';
  };

  RoundDeedCollection.prototype.model = RoundDeed;

  return RoundDeedCollection;

})(DeedCollection);

MessageCollection = require('./message.coffee').MessageCollection;

RoundMessageCollection = (function(_super) {
  __extends(RoundMessageCollection, _super);

  function RoundMessageCollection() {
    return RoundMessageCollection.__super__.constructor.apply(this, arguments);
  }

  return RoundMessageCollection;

})(MessageCollection);

module.exports = {
  Round: Round,
  RoundCollection: RoundCollection,
  RoundDeedCollection: RoundDeedCollection
};


},{"./deed.coffee":2,"./message.coffee":3}],5:[function(require,module,exports){
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
    this.route_page(/^rounds\/(\d+)$/, 'round');
    this.route('rounds/join/', 'rounds_join');
    this.route_page('rounds/', 'rounds');
    this.route_page('rounds/mine/', 'my_rounds');
    this.route_page('deeds/mine/', 'my_deeds');
    return this.route('deeds/mine/create', 'create_deed');
  };

  PageRouter.prototype.route_page = function(pattern, name) {
    return this.route(pattern, name, function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.app).show_page.apply(_ref, [name].concat(__slice.call(args)));
    });
  };

  PageRouter.prototype.rounds_join = function() {
    this.app.show_page('my_rounds');
    return this.app.pages.my_rounds.$('a.join.btn').click();
  };

  PageRouter.prototype.create_deed = function() {
    this.app.show_page('my_deeds');
    return this.app.pages.my_deeds.$('#create-deed-btn').click();
  };

  PageRouter.prototype.setup = function(name) {
    $('.page').hide();
    $("#page_" + name).show();
    return $('body').attr('class', name);
  };

  PageRouter.prototype.main = function() {
    return this.navigate('rounds/mine/', {
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
var AllRoundsPage, Page, RoundsListView,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Page = require('../page.coffee');

RoundsListView = (function(_super) {
  __extends(RoundsListView, _super);

  function RoundsListView() {
    return RoundsListView.__super__.constructor.apply(this, arguments);
  }

  return RoundsListView;

})(Backbone.Epoxy.View);

AllRoundsPage = (function(_super) {
  __extends(AllRoundsPage, _super);

  function AllRoundsPage() {
    return AllRoundsPage.__super__.constructor.apply(this, arguments);
  }

  AllRoundsPage.prototype.name = 'all_rounds';

  AllRoundsPage.prototype.initialize = function(options) {
    return this.listview = new RoundsListView({
      collection: options.rounds_list
    });
  };

  return AllRoundsPage;

})(Page);

module.exports = AllRoundsPage;


},{"../page.coffee":6}],8:[function(require,module,exports){
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


},{"../page.coffee":6}],9:[function(require,module,exports){
var Deed, DeedCollection, MyDeedView, MyDeedsCollection, MyDeedsListItemView, MyDeedsListView, MyDeedsPage, Page,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Deed = require('../../models/deed.coffee').Deed;

DeedCollection = require('../../models/deed.coffee').DeedCollection;

Page = require('../page.coffee');

MyDeedsCollection = (function(_super) {
  __extends(MyDeedsCollection, _super);

  function MyDeedsCollection() {
    return MyDeedsCollection.__super__.constructor.apply(this, arguments);
  }

  return MyDeedsCollection;

})(DeedCollection);

MyDeedsListItemView = (function(_super) {
  __extends(MyDeedsListItemView, _super);

  function MyDeedsListItemView() {
    return MyDeedsListItemView.__super__.constructor.apply(this, arguments);
  }

  MyDeedsListItemView.prototype.el = "<li data-bind=\"attr:{'data-cid': $model().cid}\">\n	<img data-bind=\"attr:{src:image_url}\" />\n	<div>\n		<h4 data-bind=\"text:title\"></h4>\n		<div class=\"data\">\n            <div class=\"credibility\"><span data-bind=\"text:credibility\">50</span>% credibility</div>\n            <div class=\"longevity\"><span data-bind=\"text:longevity\">6</span> rounds</div>\n            <div class=\"winnings\">won <span data-bind=\"text:nice_winnings\">501 mBTC</span></div>\n        </div>\n    </div>\n	    </li>";

  return MyDeedsListItemView;

})(Backbone.Epoxy.View);

MyDeedsListView = (function(_super) {
  __extends(MyDeedsListView, _super);

  function MyDeedsListView() {
    return MyDeedsListView.__super__.constructor.apply(this, arguments);
  }

  MyDeedsListView.prototype.el = 'ul#my-deeds-list';

  MyDeedsListView.prototype.bindings = {
    ':el': 'collection:$collection'
  };

  MyDeedsListView.prototype.itemView = MyDeedsListItemView;

  return MyDeedsListView;

})(Backbone.Epoxy.View);

MyDeedView = (function(_super) {
  __extends(MyDeedView, _super);

  function MyDeedView() {
    return MyDeedView.__super__.constructor.apply(this, arguments);
  }

  MyDeedView.prototype.el = "<div class=\"deed\">\n<div class=\"full-deed\">\n	<div class=\"img-container\">\n		<img data-bind=\"attr:{src:image_url}\" />\n		<h3 class=\"title\" data-bind=\"text:title\">Name</h3>\n		<div class=\"giveback\"><span><strong data-bind=\"text:giveback\" class=\"givebackval\">90</strong>%</span> giveback</div>\n	</div>\n    <div class=\"message\" data-bind=\"text:message\"></div>\n    <div class=\"ratings\">\n        <div class=\"credibility\"><strong>Credibility</strong><span data-bind=\"text:credibility\">50</span>%</div>\n        <div class=\"longevity\"><strong>Longevity</strong><span data-bind=\"text:longevity\">6</span> rounds</div>\n        <div class=\"winnings\"><strong>Winnings</strong><span data-bind=\"text:nice_winnings\">501 mBTC</span></div>\n            	<div class=\"url\"><strong>Url</strong> <span data-bind=\"toggle:none(url)\">[no url]</span><a data-bind=\"text:url,attr:{href:url}\">View</a></div>\n    </div>\n    <button class=\"btn edit\">Edit</button>\n</div>\n    	 <form class=\"edit-deed form-horizontal\" style=\"display:none;\"> \n        	<div class=\"form-group\">\n        		<label class=\"col-sm-2 control-label\" for=\"id_title\" style=\"display:none;\">Title</label>\n        		<div class=\"col-sm-12\"><input type=\"text\" id=\"id_title\" name=\"title\" placeholder=\"title\" class=\"form-control input-lg\"/></div>\n        	</div>\n        	<div class='form-group'>\n        		<label class=\"col-sm-2 control-label\" for=\"id_giveback\">Giveback percentage</label>\n        		<div class=\"col-sm-10\"><input type=\"number\" name=\"giveback\" min=\"0\" max=\"100\" step=\"1\" class=\"form-control\" /></div>\n        	</div>\n        	<div class=\"form-group\">\n        		<label class=\"col-sm-2 control-label\" for=\"id_url\">URL</label>\n        		<div class=\"col-sm-10\"><input type=\"url\" name=\"url\" id=\"id_url\" class=\"form-control\"/></div>\n        	</div>\n        	<div class=\"form-group\">\n        		<label class=\"col-sm-2 control-label\" for=\"id_message\">Message</label>\n        		<div class=\"col-sm-10\"><textarea name=\"message\" id=\"id_message\" class=\"form-control\"></textarea></div>\n        	</div>\n        	<div class=\"form-group\">\n        		<label class=\"col-sm-2 control-label\" for=\"id_image\">Image</label>\n        		<div class=\"col-sm-10\"><input type=\"url\" name=\"image_url\" id=\"id_image\" class=\"form-control\"/></div>\n        	</div>\n        	<button class=\"btn btn-success\" type=\"submit\">Save</button>\n    		<button class=\"btn cancel\" type=\"reset\">Cancel</button>\n        </form></div>";

  MyDeedView.prototype.onEdit = function(e) {
    e.preventDefault();
    this.$('.full-deed').hide();
    this.$('form input[name=title]').val(this.model.get('title'));
    this.$('form input[name=image_url]').val(this.model.get('image_url'));
    this.$('form input[name=url]').val(this.model.get('url'));
    this.$('form input[name=giveback]').val(this.model.get('giveback'));
    this.$('form textarea[name=message]').val(this.model.get('message'));
    return this.$('form').show();
  };

  MyDeedView.prototype.events = {
    'click button.edit': 'onEdit',
    'submit form': 'onSubmit',
    'click button.cancel': 'onCancel'
  };

  MyDeedView.prototype.onSubmit = function(e) {
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
        c.set('id', d.deed_id);
        return c.collection.trigger('change');
      }
    });
    this.$('form').hide();
    return this.$('.full-deed').show();
  };

  MyDeedView.prototype.onCancel = function(e) {
    if (this.model.isNew()) {
      this.model.destroy();
    }
    this.$('form').hide();
    return this.$('.full-deed').show();
  };

  return MyDeedView;

})(Backbone.Epoxy.View);

MyDeedsPage = (function(_super) {
  __extends(MyDeedsPage, _super);

  function MyDeedsPage() {
    return MyDeedsPage.__super__.constructor.apply(this, arguments);
  }

  MyDeedsPage.prototype.name = 'my_deeds';

  MyDeedsPage.prototype.bindings = {
    'div.pane.header div.deeds span': 'text:length($collection)'
  };

  MyDeedsPage.prototype.events = {
    'click ul#my-deeds-list li': 'onLiClick',
    'click .pane.header .new button': 'onAdd'
  };

  MyDeedsPage.prototype.initialize = function() {
    this.collection = this.app.collections.my_deeds;
    return this.listview = new MyDeedsListView({
      collection: this.collection
    });
  };

  MyDeedsPage.prototype.onLiClick = function(e) {
    return this.showDeed($(e.currentTarget));
  };

  MyDeedsPage.prototype.showDeed = function($li) {
    this.$('ul#my-deeds-list li').removeClass('active');
    $li.addClass('active');
    this.view = new MyDeedView({
      model: this.collection.get($li.attr('data-cid'))
    });
    return this.$('#deed-view').html(this.view.$el);
  };

  MyDeedsPage.prototype.onAdd = function() {
    var c;
    c = new Deed();
    this.collection.add(c);
    this.showDeed($("ul#my-deeds-list li[data-cid=" + c.cid + "]"));
    return this.view.$('button.edit').click();
  };

  return MyDeedsPage;

})(Page);

module.exports = {
  MyDeedsPage: MyDeedsPage,
  MyDeedsCollection: MyDeedsCollection
};


},{"../../models/deed.coffee":2,"../page.coffee":6}],10:[function(require,module,exports){
var Deed, JoinRoundItemView, JoinRoundOptionView, JoinRoundView, MyRoundsCollection, MyRoundsListItemView, MyRoundsListView, MyRoundsPage, Page, Round, RoundCollection, deed, round,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Page = require('../page.coffee');

deed = require('../../models/deed.coffee');

round = require('../../models/round.coffee');

Round = round.Round;

Deed = deed.Deed;

RoundCollection = round.RoundCollection;

JoinRoundOptionView = (function() {
  function JoinRoundOptionView() {}

  JoinRoundOptionView.prototype.el = "<option name=\"value\">";

  return JoinRoundOptionView;

})();

JoinRoundItemView = (function(_super) {
  __extends(JoinRoundItemView, _super);

  function JoinRoundItemView() {
    return JoinRoundItemView.__super__.constructor.apply(this, arguments);
  }

  JoinRoundItemView.prototype.el = '#join-round-form #select-deed';

  JoinRoundItemView.prototype.bindings = {
    el: 'collection:$collection',
    itemView: JoinRoundOptionView
  };

  return JoinRoundItemView;

})(Backbone.Epoxy.View);

JoinRoundView = (function(_super) {
  __extends(JoinRoundView, _super);

  function JoinRoundView() {
    return JoinRoundView.__super__.constructor.apply(this, arguments);
  }

  JoinRoundView.prototype.el = '#join-round-form';

  JoinRoundView.prototype.events = {
    'submit': 'onSubmit'
  };

  JoinRoundView.prototype.initialize = function(options) {
    var format, getData, init_s2;
    this.deeds = options.deeds;
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
        text: 'Create deed'
      });
      return l;
    };
    format = function(deed) {
      var t;
      t = '';
      if (deed.model) {
        t = "<img style=\"height:80px; padding:5px 5px 5px 0; vertical-align:middle;\" src=\"" + (deed.model.get('image_url')) + "\" /> ";
      }
      t += deed.text;
      return t;
    };
    init_s2 = (function() {
      return this.$('#select-deed').select2({
        data: getData(this.deeds),
        formatResult: format,
        formatSelection: format,
        escapeMarkup: function(m) {
          return m;
        }
      });
    }).bind(this);
    this.deeds.on('add reset remove change', function() {
      return init_s2();
    });
    window.init_s2 = init_s2;
    return init_s2();
  };

  JoinRoundView.prototype.onSubmit = function(e) {
    var data;
    e.preventDefault();
    data = {
      stake: this.$("input[name=stake]:checked").val(),
      deed_id: this.$('input#select-deed').val()
    };
    if (!data.deed_id) {
      app.router.go('#deeds/mine/create');
      $('#joinRoundModal button.close').click();
      return false;
    }
    this.$('button[type=submit]').html("Joining...").addClass('active');
    return $.ajax({
      type: 'PUT',
      url: Round.prototype.urlRoot,
      contentType: 'application/json',
      data: JSON.stringify(data),
      dataType: 'json',
      success: function(data) {
        var g;
        g = new Round(data);
        app.collections.my_rounds.add(g);
        app.router.go(g.appUrl());
        return $('#joinRoundModal button.close').click();
      }
    });
  };

  return JoinRoundView;

})(Backbone.Epoxy.View);

MyRoundsListView = (function(_super) {
  __extends(MyRoundsListView, _super);

  function MyRoundsListView() {
    return MyRoundsListView.__super__.constructor.apply(this, arguments);
  }

  MyRoundsListView.prototype.bindings = {
    ':el': "collection:$collection"
  };

  MyRoundsListView.prototype.initialize = function(options) {
    console.log(options);
    return console.log(this);
  };

  return MyRoundsListView;

})(Backbone.Epoxy.View);

MyRoundsListItemView = (function(_super) {
  __extends(MyRoundsListItemView, _super);

  function MyRoundsListItemView() {
    return MyRoundsListItemView.__super__.constructor.apply(this, arguments);
  }

  MyRoundsListItemView.prototype.el = "<li>\n	<a data-bind=\"attr:{href:url, class:status}\">\n		<div class=\"info\">\n			<div class=\"deeds\"><span data-bind=\"text:number_of_players\"></span> deeds</div>\n			<div class=\"stake\" data-bind=\"text:nice_stake\"></div>\n			<div class=\"status\" data-bind=\"text:nice_status\"></div>\n		</div>\n		<div class=\"time\" data-bind=\"toggle:is_active,text:timeleft\"></div>\n	</a>\n</li>";

  MyRoundsListItemView.prototype.events = {
    'click a': function(e) {
      e.preventDefault();
      return app.router.go($(e.currentTarget).attr('href'));
    }
  };

  return MyRoundsListItemView;

})(Backbone.Epoxy.View);

MyRoundsCollection = (function(_super) {
  __extends(MyRoundsCollection, _super);

  function MyRoundsCollection() {
    return MyRoundsCollection.__super__.constructor.apply(this, arguments);
  }

  MyRoundsCollection.prototype.view = MyRoundsListItemView;

  return MyRoundsCollection;

})(RoundCollection);

MyRoundsPage = (function(_super) {
  __extends(MyRoundsPage, _super);

  function MyRoundsPage() {
    return MyRoundsPage.__super__.constructor.apply(this, arguments);
  }

  MyRoundsPage.prototype.name = 'my_rounds';

  MyRoundsPage.prototype.events = {
    'click #join-round-button': function(e) {
      e.preventDefault();
      return $('#joinRoundModal').modal();
    }
  };

  MyRoundsPage.prototype.initialize = function(options) {
    this.listview = new MyRoundsListView({
      collection: this.app.collections.my_rounds,
      el: this.$('ul#my-rounds-grid')
    });
    return this.joinroundview = new JoinRoundView({
      deeds: this.app.collections.my_deeds
    });
  };

  return MyRoundsPage;

})(Page);

module.exports = {
  MyRoundsPage: MyRoundsPage,
  MyRoundsCollection: MyRoundsCollection
};


},{"../../models/deed.coffee":2,"../../models/round.coffee":4,"../page.coffee":6}],11:[function(require,module,exports){
var Deed, MessageCollection, Page, Round, RoundDeedListItemView, RoundDeedListView, RoundEndedView, RoundMessageCollection, RoundMessageListItemView, RoundMessageListView, RoundMessagesView, RoundPage, RoundView, deed, round,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Page = require('../page.coffee');

deed = require('../../models/deed.coffee');

round = require('../../models/round.coffee');

Round = round.Round;

Deed = deed.Deed;

MessageCollection = require('../../models/message.coffee').MessageCollection;

RoundDeedListItemView = (function(_super) {
  __extends(RoundDeedListItemView, _super);

  function RoundDeedListItemView() {
    return RoundDeedListItemView.__super__.constructor.apply(this, arguments);
  }

  RoundDeedListItemView.prototype.el = "<li classes:{voted:has_my_vote, mine:is_mine}>\n    <h3 data-bind=\"text:title\">Title</h3>\n    <img data-bind=\"attr:{src:image_url}\" />\n    <div class=\"votes\" data-bind=\"text:votes\"></div>\n    <div class=\"full-deed hidden\">\n    	<div class=\"img-container\">\n    		<img data-bind=\"attr:{src:image_url}\" />\n    		<h3 data-bind=\"text:title\">Name</h3>\n    		<div class=\"giveback\"><span><strong data-bind=\"text:giveback\">90</strong>%</span> giveback</div>\n    	</div>\n        <div class=\"message\" data-bind=\"text:message\"></div>\n        <div class=\"ratings\">\n            <div class=\"credibility\"><strong>Credibility</strong><span data-bind=\"text:credibility\">50</span>%</div>\n            <div class=\"longevity\"><strong>Longevity</strong><span data-bind=\"text:longevity\">6</span> rounds</div>\n            <div class=\"winnings\"><strong>Winnings</strong><span data-bind=\"text:winnings\">501 mBTC</span></div>\n            	<div class=\"url\"><strong>Url</strong> <span data-bind=\"toggle:none(url)\">[no url]</span><a data-bind=\"text:url,attr:{href:url}\">View</a></div>\n        </div>\n        <button class=\"btn vote\" data-bind=\"toggle:can_vote,attr:{disabled:has_my_vote},text:select(has_my_vote, 'Voted!', 'Vote')\">Vote</button>\n    </div>\n</li>";

  RoundDeedListItemView.prototype.events = {
    'click h3, img': function(e) {
      e.preventDefault();
      return this.$('.full-deed').toggleClass('hidden');
    },
    'click button.vote': function(e) {
      e.preventDefault();
      $(e.currentTarget).text('Voting...').attr('disabled', 'disabled');
      return this.model.vote();
    }
  };

  return RoundDeedListItemView;

})(Backbone.Epoxy.View);

RoundMessageListItemView = (function(_super) {
  __extends(RoundMessageListItemView, _super);

  function RoundMessageListItemView() {
    return RoundMessageListItemView.__super__.constructor.apply(this, arguments);
  }

  RoundMessageListItemView.prototype.el = "<li data-bind=\"classes:{mine:is_mine}\">\n	<time data-bind=\"text:time\"></time>\n	<span data-bind=\"text:message\"></span>\n</li>";

  return RoundMessageListItemView;

})(Backbone.Epoxy.View);

RoundDeedListView = (function(_super) {
  __extends(RoundDeedListView, _super);

  function RoundDeedListView() {
    return RoundDeedListView.__super__.constructor.apply(this, arguments);
  }

  RoundDeedListView.prototype.bindings = {
    ':el': "collection:$collection"
  };

  RoundDeedListView.prototype.itemView = RoundDeedListItemView;

  return RoundDeedListView;

})(Backbone.Epoxy.View);

RoundMessageCollection = (function(_super) {
  __extends(RoundMessageCollection, _super);

  function RoundMessageCollection() {
    return RoundMessageCollection.__super__.constructor.apply(this, arguments);
  }

  RoundMessageCollection.prototype.view = RoundMessageListItemView;

  return RoundMessageCollection;

})(MessageCollection);

RoundMessageListView = (function(_super) {
  __extends(RoundMessageListView, _super);

  function RoundMessageListView() {
    return RoundMessageListView.__super__.constructor.apply(this, arguments);
  }

  RoundMessageListView.prototype.el = "ul#round-messages";

  RoundMessageListView.prototype.bindings = {
    ':el': "collection:$collection"
  };

  RoundMessageListView.prototype.itemView = RoundMessageListItemView;

  return RoundMessageListView;

})(Backbone.Epoxy.View);

RoundMessagesView = (function(_super) {
  __extends(RoundMessagesView, _super);

  function RoundMessagesView() {
    return RoundMessagesView.__super__.constructor.apply(this, arguments);
  }

  RoundMessagesView.prototype.initialize = function(options) {
    return this.list_view = new RoundMessageListView({
      collection: options.model.get('messages')
    });
  };

  RoundMessagesView.prototype.events = {
    'keydown .chatbox': 'onEnter'
  };

  RoundMessagesView.prototype.onEnter = function(e) {
    if (e.which === 13) {
      e.preventDefault();
      this.model.send_message(this.$('.chatbox').val());
      this.$('.chatbox').val('');
      return this.$('ul#round-messages').scrollTop(this.$('ul#round-messages').height());
    }
  };

  return RoundMessagesView;

})(Backbone.View);

RoundEndedView = (function(_super) {
  __extends(RoundEndedView, _super);

  function RoundEndedView() {
    return RoundEndedView.__super__.constructor.apply(this, arguments);
  }

  RoundEndedView.prototype.el = '<div class="ended">\n	<h3>Winner: <strong data-bind="text:winner_title">Title</strong></h3>\n	<img data-bind="attr:{src:winner_image_url}" />\n	<div>Votes: <strong data-bind="text:winner_votes"></strong></div>\n	<div>Total won: <strong data-bind="text:nice_winnings"></strong></div>\n	<div>Given back: <strong data-bind="text:winner_nice_giveback_actual"></strong></div>\n	<p data-bind="toggle:voted_for_winner"><span data-bind="text:winner_other_votes"></span> other people voted for this deed. Since giveback was <span data-bind="text:winner_nice_giveback">50%</span>, you got <span data-bind="text:winner_nice_giveback_per_vote"></span> back!</p>\n</div>';

  RoundEndedView.prototype.initialize = function(options) {
    return this.bindingSources = {
      winner: function() {
        return options.model.get('winner');
      }
    };
  };

  return RoundEndedView;

})(Backbone.Epoxy.View);

RoundView = (function(_super) {
  __extends(RoundView, _super);

  function RoundView() {
    this.tick = __bind(this.tick, this);
    return RoundView.__super__.constructor.apply(this, arguments);
  }

  RoundView.prototype.el = '#page_round';

  RoundView.prototype.bindings = {
    'div.status div.status-text': 'text:nice_status,attr:{"data-status":status}',
    'time.timer': 'text:timeleft',
    'div.pane div.stake span': 'text:stake',
    'div.pane div.potential span': 'text:potential_winnings'
  };

  RoundView.prototype.initialize = function(options) {
    var initEndedView;
    options.model.listen_for_round_events();
    initEndedView = function() {
      var _ref;
      if (this.model.get('status') === 'ended') {
        if ((_ref = this.RoundDeedListView) != null) {
          _ref.destroy();
        }
        this.$('.pane.deeds').hide();
        this.ended_view = new RoundEndedView({
          model: this.model
        });
        return this.$('#ended-pane').html(this.ended_view.$el).show();
      }
    };
    this.model.on('end', initEndedView.bind(this));
    if (this.model.deeds == null) {
      this.model.on('fetched_deeds', initEndedView.bind(this));
    } else {
      initEndedView.bind(this)();
    }
    if (this.model.get('status') !== 'ended') {
      this.deeds_view = new RoundDeedListView({
        collection: options.model.deeds,
        el: this.$('#round-deed-list').get()
      });
    }
    this.messages_view = new RoundMessagesView({
      model: options.model,
      el: this.$("#round-messages-pane").get()
    });
    if (!this._timer) {
      return this._timer = setInterval(this.tick, 100);
    }
  };

  RoundView.prototype.tick = function() {
    return this.model.c().timeleft.get(true);
  };

  return RoundView;

})(Backbone.Epoxy.View);

RoundPage = (function(_super) {
  __extends(RoundPage, _super);

  function RoundPage() {
    return RoundPage.__super__.constructor.apply(this, arguments);
  }

  RoundPage.prototype.name = 'round';

  RoundPage.prototype.show = function(id) {
    var g, p;
    RoundPage.__super__.show.apply(this, arguments);
    g = new Round({
      id: id
    });
    p = this;
    return g.fetch({
      success: function() {
        return p.roundview = new RoundView({
          model: g
        });
      }
    });
  };

  return RoundPage;

})(Page);

module.exports = RoundPage;


},{"../../models/deed.coffee":2,"../../models/message.coffee":3,"../../models/round.coffee":4,"../page.coffee":6}]},{},[1])