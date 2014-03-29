class Card extends Backbone.Epoxy.Model
	computeds:
		votes: ->
			if @collection?.game?
				return @collection.game.votes_for(@)
			else
				return null
		other_votes: ->
			@get('votes') - 1

		nice_winnings: ->
			return @get('winnings') + ' mBTC'

		nice_giveback: ->
			return @get('giveback') + '%'

	defaults:
		message: ''
		title: 'Unnamed card'
		giveback: 0
		url: ''
		image_url: 'http://imgur.com/jSjxOc2'
		credibility: 0
		longevity: 0
		winnings: 0

class GameCard extends Card
	initialize: (data, options) ->
		@game = options.game or options.collection.game
	urlRoot: -> @game.url() + '/cards'
	vote: ->
		@collection.each (m) ->
			m.set('has_my_vote', false)
		@set('has_my_vote', true)
		@game.vote(@)
	computeds: _.extend Card::computeds, 
		can_vote: ->
			@get('is_mine') == false and @game.get('status') == 'started'
		game_winnings:
			deps: ['giveback'],
			get: ->
				@game?.get('winnings') * (1 - @get('giveback') / 100.0)

		giveback_per_vote: ->
			return ((@game?.get('winnings') * @get('giveback') / 100.0) / @get('votes')).toFixed(2)

		giveback_actual: ->
			return ((@game?.get('winnings') * @get('giveback') / 100.0)).toFixed(2)

		nice_giveback_actual: ->
			return @get('giveback_actual') + ' mBTC'

		nice_giveback_per_vote: ->
			return @get('giveback_per_vote') + ' mBTC'

class CardCollection extends Backbone.Collection
	model: Card
	url: '/api/cards'

module.exports = 
	GameCard: GameCard
	CardCollection: CardCollection
	Card: Card