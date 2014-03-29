moment.duration.fn.format = (format) -> return moment(@as('milliseconds')).format(format)

class Game extends Backbone.Epoxy.Model
	urlRoot: '/api/games'
	appUrl: -> "#games/#{@id}"
	votes_for: (card) ->
		return (@.get('votes')? and @.get('votes')[card.id]) or 0
	vote: (card, cb=$.noop) ->
		u = @url() + '/votes'
		$.ajax
			url: u
			type: "POST"
			contentType: 'application/json'
			data: JSON.stringify({card_id: card.id})
			dataType: 'json'
			success: (data) ->
				cb()
	initialize: (data) ->
		@cards = new GameCardCollection([], {game: @})
		@cards.fetch
			success: (->
				@c().winner.get(true)
				@trigger('fetched_cards')
			).bind(@)
		@messages = new GameMessageCollection [
				new Message
					time: "16:08"
					message: "Test"
					is_mine: false
				new Message
					time: "16:09"
					message: "Test!"
					is_mine: false
				new Message
					time: "16:10"
					message: "Test 2"
					is_mine: true
			]
		@on 
			'server:joined': (e) ->
				c = new GameCard({id: e.card_id}, {game: @})
				c.fetch
					success: =>
						@cards.add(c)
			'server:left': (e) ->
				@cards.remove @cards.at(e.card_id)

			'server:started': (e) ->
				@set('status', 'started')
				@set('starts', e.starts)
				@set('ends', e.ends)
				@trigger('start')

			'server:ended': (e) ->
				@set('status', 'ended')
				@set('ends', e.ends)
				@set('winner', e.winner)
				@set('votes', e.results)
				@trigger('end', e)

			'server:ready': (e) ->
				@set('status', 'ready')
				@set('starts', e.starts)

			'server:not_ready': (e) ->
				@unset('starts')
				@set('status', 'waiting')

			'server:vote': (e) ->
				c_new = e[1]
				c_old = e[-1] 

				if not @get('votes')[c_new]?
					@get('votes')[c_new] = 0
				@get('votes')[c_new] += 1
				

				if c_old?
					if not @get('votes')[c_old]?
						@get('votes')[c_old] = 0
					@get('votes')[c_old] -= 1

				@trigger 'change:votes'

			'change:votes': ->
				@cards.each (card) ->
					card.c().votes.get(true) # update=True
				return null



	computeds:
		url: -> @appUrl()
		cards: ->
			return @cards

		winner: ->
			return @cards.get(@get('winner_id'))
		messages: -> return @messages
		timeleft: -> 
			if @get('status') == 'waiting_for_players' or @get('status') == 'ended'
				return "00:00"
			if @get('status') == 'started'
				return moment.duration(moment.unix(@get('ends')).diff(moment())).format('mm:ss')
			if @get('status') == 'ready'
				'-' + moment.duration(moment.unix(@get('starts')).diff(moment())).format('mm:ss')
		is_active: ->
			@get('status') == 'active'

		nice_status: ->
			statuses = 
				ready: 'Starting soon',
				waiting_for_players: 'Waiting for more players'
				started: 'Started'
				ended: 'Ended'
			return statuses[@get('status')]

		nice_stake: ->
			return @get('stake') + ' mBTC'

		potential_winnings: ->
			return 0

		winnings: ->
			return @get('stake') * @get('number_of_players')

		nice_winnings: ->
			return @get('winnings') + ' mBTC'

		number_of_players: 
			deps: ['card_ids']
			get: -> _.size @get('card_ids')
			
	send_message: (message) ->
		@messages.add new Message
			time: moment().format('HH:mm')
			message: message
			is_mine: true

	listen_for_game_events: ->
		window.app.sock.game_subscribe @

class GameCollection extends Backbone.Collection
	model: Game
	url: '/api/games'

CardCollection = require('./card.coffee').CardCollection
GameCard = require('./card.coffee').GameCard

class GameCardCollection extends CardCollection
	#view: GameCardListItemView
	initialize: (models, options) ->
		@game = options.game
	url: -> @game.url() + '/cards'
	model: GameCard


module.exports =
	Game: Game
	GameCollection: GameCollection 
	GameCardCollection: GameCardCollection