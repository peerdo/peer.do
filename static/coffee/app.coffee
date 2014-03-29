class App extends Backbone.View
	el: 'body'
	add_page: (view) ->
		@pages[view.name] = view

	show_page: (page_name, args...) ->
		console.log(args...)
		@current_page.hide()
		@current_page = @pages[page_name]
		@current_page.show(args...)


	initialize: ->
		PageRouter = require './router.coffee'
		GamePage = require './views/pages/game.coffee'
		IndexPage = require './views/pages/index.coffee'
		MyGamesPage = require('./views/pages/my_games.coffee').MyGamesPage
		MyCardsPage = require('./views/pages/my_cards.coffee').MyCardsPage
		AllGamesPage = require './views/pages/all_games.coffee'
		MyGamesCollection = require('./views/pages/my_games.coffee').MyGamesCollection
		MyCardsCollection = require('./views/pages/my_cards.coffee').MyCardsCollection
		@pages = {}
		@collections = {}
		@collections.my_games = new MyGamesCollection()
		@collections.my_games.fetch(data: {mine: true}, processData: true)
		@collections.my_cards = new MyCardsCollection()
		@collections.my_cards.fetch()

		@add_page(new GamePage({app: @}))
		@add_page(new MyGamesPage({app: @, collection: @collections.my_games}))
		@add_page(new AllGamesPage({app: @}))
		@add_page(new MyCardsPage({app: @}))
		@add_page(new IndexPage({app: @}))

		@current_page = @pages['my_games']

		@router = new PageRouter
			app: @

		@sock = new SockJS("/sock")
		@sock._games = {}
		@sock.q = []
		@sock.onopen = ->
			console.log('open')

		@sock.onmessage = (e) ->
			console.log(e)
			data = JSON.parse(e.data)
			if data.type == 'request_auth'
				@send JSON.stringify
					type: 'auth'
					user_id: 1
			if data.type == 'auth' and data.data.message == 'success'
				console.log('auth!')
				console.log(@q)
				for m in @q
					@send m
			if data.type == 'game_event'
				@_games[data.game_id].trigger('server:' + data.event, data.data)
		@sock.onclose = ->
			console.log('close')

		@sock.send_data = (data) ->
			j = JSON.stringify(data)
			if @readyState == 0
				@q.push j
			else
				@send j

		@sock.game_subscribe = (game) ->
			@_games[game.id] = game
			@send_data
				type: 'game_subscribe'
				game_id: game.id

		@sock.game_unsubscribe = (game) ->
			delete @_games[game.id]
			@send_data
				type: 'game_unsubscribe'
				game_id: game.id

$(document).ready ->
	window.app = new App()
	Backbone.history.start()