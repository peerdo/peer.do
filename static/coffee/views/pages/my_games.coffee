Page = require('../page.coffee')
card = require('../../models/card.coffee')
game = require('../../models/game.coffee')
Game = game.Game
Card = card.Card
GameCollection = game.GameCollection

class JoinGameOptionView
	el: """
	<option name="value">"""


class JoinGameItemView extends Backbone.Epoxy.View
	el: '#join-game-form #select-card'
	bindings: 
		el: 'collection:$collection'
		itemView: JoinGameOptionView

class JoinGameView extends Backbone.Epoxy.View
	el: '#join-game-form'
	events:
		'submit': 'onSubmit'
	initialize: (options) ->
		@cards = options.cards
		getData = (collection) -> 
			l = collection.map (c) ->
				id: c.id
				text: c.get('title')
				model: c
			l.push({id: '', text: 'Create card'})
			return l
		format = (card) ->
			t = ''
			if card.model
				t = """<img style="height:80px; padding:5px 5px 5px 0; vertical-align:middle;" src="#{card.model.get('image_url')}" /> """
			t += card.text
			return t

		init_s2 = (->
			@$('#select-card').select2
				data: getData(@cards)
				formatResult: format
				formatSelection: format
				escapeMarkup: (m) -> m).bind(@)

		@cards.on 'add reset remove change', ->
			init_s2()
		window.init_s2 = init_s2
		init_s2()

	onSubmit: (e) ->
		e.preventDefault()
		data = 
			stake: @$("input[name=stake]:checked" ).val()
			card_id: @$('input#select-card').val()
		if not data.card_id
			app.router.go('#cards/mine/create')
			$('#joinGameModal button.close').click()
			return false

		@$('button[type=submit]').html("Joining...").addClass('active')
		$.ajax
			type: 'PUT'
			url: Game.prototype.urlRoot
			contentType: 'application/json'
			data: JSON.stringify(data)
			dataType: 'json'
			success: (data) ->
				g = new Game(data)
				app.collections.my_games.add(g)
				app.router.go(g.appUrl())
				$('#joinGameModal button.close').click()

class MyGamesListView extends Backbone.Epoxy.View
	bindings:
		':el': "collection:$collection"
	initialize: (options) -> 
		console.log options
		console.log @

class MyGamesListItemView extends Backbone.Epoxy.View
	el: """
	<li>
		<a data-bind="attr:{href:url, class:status}">
			<div class="info">
				<div class="cards"><span data-bind="text:number_of_players"></span> cards</div>
				<div class="stake" data-bind="text:nice_stake"></div>
				<div class="status" data-bind="text:nice_status"></div>
			</div>
			<div class="time" data-bind="toggle:is_active,text:timeleft"></div>
		</a>
	</li>"""
	events:
		'click a': (e) ->
			e.preventDefault()
			app.router.go $(e.currentTarget).attr('href')

class MyGamesCollection extends GameCollection
	view: MyGamesListItemView

class MyGamesPage extends Page
	name: 'my_games'
	events:
		'click #join-game-button': (e) ->
			e.preventDefault()
			$('#joinGameModal').modal()

	initialize: (options) ->
		@listview = new MyGamesListView
			collection: @app.collections.my_games
			el: @$('ul#my-games-grid')
		@joingameview = new JoinGameView
			cards: @app.collections.my_cards

module.exports = 
	MyGamesPage: MyGamesPage
	MyGamesCollection: MyGamesCollection