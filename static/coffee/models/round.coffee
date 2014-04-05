moment.duration.fn.format = (format) -> return moment(@as('milliseconds')).format(format)

class Round extends Backbone.Epoxy.Model
	urlRoot: '/api/rounds'
	appUrl: -> "#rounds/#{@id}"
	votes_for: (deed) ->
		return (@.get('votes')? and @.get('votes')[deed.id]) or 0
	vote: (deed, cb=$.noop) ->
		u = @url() + '/votes'
		$.ajax
			url: u
			type: "POST"
			contentType: 'application/json'
			data: JSON.stringify({deed_id: deed.id})
			dataType: 'json'
			success: (data) ->
				cb()
	initialize: (data) ->
		@deeds = new RoundDeedCollection([], {round: @})
		@deeds.fetch
			success: (->
				@c().winner.get(true)
				@trigger('fetched_deeds')
			).bind(@)
		Message = require('./message.coffee').Message
		@messages = new RoundMessageCollection [
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
				c = new RoundDeed({id: e.deed_id}, {round: @})
				c.fetch
					success: =>
						@deeds.add(c)
			'server:left': (e) ->
				@deeds.remove @deeds.at(e.deed_id)

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
				@deeds.each (deed) ->
					deed.c().votes.get(true) # update=True
				return null



	computeds:
		url: -> @appUrl()
		deeds: ->
			return @deeds

		winner: ->
			return @deeds.get(@get('winner_id'))
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
			deps: ['deed_ids']
			get: -> _.size @get('deed_ids')
			
	send_message: (message) ->
		@messages.add new Message
			time: moment().format('HH:mm')
			message: message
			is_mine: true

	listen_for_round_events: ->
		window.app.sock.round_subscribe @

class RoundCollection extends Backbone.Collection
	model: Round
	url: '/api/rounds'

DeedCollection = require('./deed.coffee').DeedCollection
RoundDeed = require('./deed.coffee').RoundDeed

class RoundDeedCollection extends DeedCollection
	#view: RoundDeedListItemView
	initialize: (models, options) ->
		@round = options.round
	url: -> @round.url() + '/deeds'
	model: RoundDeed

MessageCollection = require('./message.coffee').MessageCollection
class RoundMessageCollection extends MessageCollection

module.exports =
	Round: Round
	RoundCollection: RoundCollection 
	RoundDeedCollection: RoundDeedCollection