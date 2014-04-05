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
		RoundPage = require './views/pages/round.coffee'
		IndexPage = require './views/pages/index.coffee'
		MyRoundsPage = require('./views/pages/my_rounds.coffee').MyRoundsPage
		MyDeedsPage = require('./views/pages/my_deeds.coffee').MyDeedsPage
		AllRoundsPage = require './views/pages/all_rounds.coffee'
		MyRoundsCollection = require('./views/pages/my_rounds.coffee').MyRoundsCollection
		MyDeedsCollection = require('./views/pages/my_deeds.coffee').MyDeedsCollection
		@pages = {}
		@collections = {}
		@collections.my_rounds = new MyRoundsCollection()
		@collections.my_rounds.fetch(data: {mine: true}, processData: true)
		@collections.my_deeds = new MyDeedsCollection()
		@collections.my_deeds.fetch()

		@add_page(new RoundPage({app: @}))
		@add_page(new MyRoundsPage({app: @, collection: @collections.my_rounds}))
		@add_page(new AllRoundsPage({app: @}))
		@add_page(new MyDeedsPage({app: @}))
		@add_page(new IndexPage({app: @}))

		@current_page = @pages['my_rounds']

		@router = new PageRouter
			app: @

		@sock = new SockJS("/sock")
		@sock._rounds = {}
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
			if data.type == 'round_event'
				@_rounds[data.round_id].trigger('server:' + data.event, data.data)
		@sock.onclose = ->
			console.log('close')

		@sock.send_data = (data) ->
			j = JSON.stringify(data)
			if @readyState == 0
				@q.push j
			else
				@send j

		@sock.round_subscribe = (round) ->
			@_rounds[round.id] = round
			@send_data
				type: 'round_subscribe'
				round_id: round.id

		@sock.round_unsubscribe = (round) ->
			delete @_rounds[round.id]
			@send_data
				type: 'round_unsubscribe'
				round_id: round.id

$(document).ready ->
	window.app = new App()
	Backbone.history.start()