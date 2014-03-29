Page = require('../page.coffee')
card = require('../../models/card.coffee')
game = require('../../models/game.coffee')
Game = game.Game
Card = card.Card
MessageCollection = require('../../models/message.coffee').MessageCollection

class GameCardListItemView extends Backbone.Epoxy.View
	el: """
	<li classes:{voted:has_my_vote, mine:is_mine}>
	    <h3 data-bind="text:title">Title</h3>
	    <img data-bind="attr:{src:image_url}" />
	    <div class="votes" data-bind="text:votes"></div>
	    <div class="full-card hidden">
	    	<div class="img-container">
	    		<img data-bind="attr:{src:image_url}" />
	    		<h3 data-bind="text:title">Name</h3>
	    		<div class="giveback"><span><strong data-bind="text:giveback">90</strong>%</span> giveback</div>
	    	</div>
	        <div class="message" data-bind="text:message"></div>
	        <div class="ratings">
	            <div class="credibility"><strong>Credibility</strong><span data-bind="text:credibility">50</span>%</div>
	            <div class="longevity"><strong>Longevity</strong><span data-bind="text:longevity">6</span> games</div>
	            <div class="winnings"><strong>Winnings</strong><span data-bind="text:winnings">501 mBTC</span></div>
            	<div class="url"><strong>Url</strong> <span data-bind="toggle:none(url)">[no url]</span><a data-bind="text:url,attr:{href:url}">View</a></div>
	        </div>
	        <button class="btn vote" data-bind="toggle:can_vote,attr:{disabled:has_my_vote},text:select(has_my_vote, 'Voted!', 'Vote')">Vote</button>
	    </div>
	</li>"""
	events:
		'click h3, img': (e) ->
			e.preventDefault()
			@$('.full-card').toggleClass('hidden')
		'click button.vote': (e) ->
			e.preventDefault()
			$(e.currentTarget).text('Voting...').attr('disabled', 'disabled')
			@model.vote()

class GameMessageListItemView extends Backbone.Epoxy.View
	el: """
	<li data-bind="classes:{mine:is_mine}">
		<time data-bind="text:time"></time>
		<span data-bind="text:message"></span>
	</li>"""

class GameCardListView extends Backbone.Epoxy.View
	bindings:
		':el': "collection:$collection"
	itemView: GameCardListItemView


class GameMessageCollection extends MessageCollection
	view: GameMessageListItemView


class GameMessageListView extends Backbone.Epoxy.View
	el: "ul#game-messages"
	bindings:
		':el': "collection:$collection"


class GameMessagesView extends Backbone.View
	initialize: (options) ->
		@list_view = new GameMessageListView
			collection: options.model.get('messages')
	events:
		'keydown .chatbox': 'onEnter'
	onEnter: (e) ->
		if e.which == 13
			e.preventDefault()
			@model.send_message(@$('.chatbox').val())
			@$('.chatbox').val('')
			@$('ul#game-messages').scrollTop(@$('ul#game-messages').height())

class GameEndedView extends Backbone.Epoxy.View
	el: '''
	<div class="ended">
		<h3>Winner: <strong data-bind="text:winner_title">Title</strong></h3>
		<img data-bind="attr:{src:winner_image_url}" />
		<div>Votes: <strong data-bind="text:winner_votes"></strong></div>
		<div>Total won: <strong data-bind="text:nice_winnings"></strong></div>
		<div>Given back: <strong data-bind="text:winner_nice_giveback_actual"></strong></div>
		<p data-bind="toggle:voted_for_winner"><span data-bind="text:winner_other_votes"></span> other people voted for this card. Since giveback was <span data-bind="text:winner_nice_giveback">50%</span>, you got <span data-bind="text:winner_nice_giveback_per_vote"></span> back!</p>
	</div>'''
	initialize: (options) ->
		@bindingSources = 
			winner: -> options.model.get('winner')

class GameView extends Backbone.Epoxy.View
	el: '#page_game'
	bindings:
		'div.status div.status-text': 'text:nice_status,attr:{"data-status":status}'
		'time.timer': 'text:timeleft'
		'div.pane div.stake span': 'text:stake'
		'div.pane div.potential span': 'text:potential_winnings'

	initialize: (options) ->
		options.model.listen_for_game_events()

		initEndedView = ->
			if @model.get('status') == 'ended'
				@GameCardListView?.destroy()
				@$('.pane.cards').hide()
				@ended_view = new GameEndedView
					model: @model
				@$('#ended-pane').html(@ended_view.$el).show()

		@model.on 'end', initEndedView.bind(@)
		if not @model.cards?
			@model.on 'fetched_cards', initEndedView.bind(@)
		else
			initEndedView.bind(@)()

		if @model.get('status') != 'ended'
			@cards_view = new GameCardListView
				collection: options.model.cards
				el: @$('#game-card-list').get()

		@messages_view = new GameMessagesView
			model: options.model
			el: @$("#game-messages-pane").get()

		if not @_timer
			@_timer = setInterval(@tick, 100)





	tick: =>
		@model.c().timeleft.get(true) # update=true	

class GamePage extends Page
	name: 'game'
	show: (id) ->
		super
		g = new Game({id: id})
		p = @
		g.fetch
			success: ->
				p.gameview = new GameView
					model: g

module.exports = GamePage