class PageRouter extends Backbone.Router
	initialize: (options) ->
		super
		@app = options.app
		@route '', 'main'
		@route_page /^games\/(\d+)$/, 'game'
		@route 'games/join/', 'games_join'
		@route_page 'games/', 'games'
		@route_page 'games/mine/', 'my_games'
		@route_page 'cards/mine/', 'my_cards'
		@route 'cards/mine/create', 'create_card'

	route_page: (pattern, name) ->
		@route pattern, name, (args...) ->
			@app.show_page(name, args...)

	games_join: ->
		@app.show_page('my_games')
		@app.pages.my_games.$('a.join.btn').click()

	create_card: ->
		@app.show_page('my_cards')
		@app.pages.my_cards.$('#create-card-btn').click()

	setup: (name) ->
		$('.page').hide()
		$("#page_#{name}").show()
		$('body').attr('class', name)

	main: ->
		@navigate('games/mine/', {trigger: true, replace: true})

	go: (target) -> @navigate(target, {trigger: true})

module.exports = PageRouter