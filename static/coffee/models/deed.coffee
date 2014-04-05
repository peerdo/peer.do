class Deed extends Backbone.Epoxy.Model
	computeds:
		votes: ->
			if @collection?.round?
				return @collection.round.votes_for(@)
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
		title: 'Unnamed deed'
		giveback: 0
		url: ''
		image_url: 'http://imgur.com/jSjxOc2'
		credibility: 0
		longevity: 0
		winnings: 0

class RoundDeed extends Deed
	initialize: (data, options) ->
		@round = options.round or options.collection.round
	urlRoot: -> @round.url() + '/deeds'
	vote: ->
		@collection.each (m) ->
			m.set('has_my_vote', false)
		@set('has_my_vote', true)
		@round.vote(@)
	computeds: _.extend Deed::computeds, 
		can_vote: ->
			@get('is_mine') == false and @round.get('status') == 'started'
		round_winnings:
			deps: ['giveback'],
			get: ->
				@round?.get('winnings') * (1 - @get('giveback') / 100.0)

		giveback_per_vote: ->
			return ((@round?.get('winnings') * @get('giveback') / 100.0) / @get('votes')).toFixed(2)

		giveback_actual: ->
			return ((@round?.get('winnings') * @get('giveback') / 100.0)).toFixed(2)

		nice_giveback_actual: ->
			return @get('giveback_actual') + ' mBTC'

		nice_giveback_per_vote: ->
			return @get('giveback_per_vote') + ' mBTC'

class DeedCollection extends Backbone.Collection
	model: Deed
	url: '/api/deeds'

module.exports = 
	RoundDeed: RoundDeed
	DeedCollection: DeedCollection
	Deed: Deed