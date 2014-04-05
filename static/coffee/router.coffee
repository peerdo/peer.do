class PageRouter extends Backbone.Router
	initialize: (options) ->
		super
		@app = options.app
		@route '', 'main'
		@route_page /^rounds\/(\d+)$/, 'round'
		@route 'rounds/join/', 'rounds_join'
		@route_page 'rounds/', 'rounds'
		@route_page 'rounds/mine/', 'my_rounds'
		@route_page 'deeds/mine/', 'my_deeds'
		@route 'deeds/mine/create', 'create_deed'

	route_page: (pattern, name) ->
		@route pattern, name, (args...) ->
			@app.show_page(name, args...)

	rounds_join: ->
		@app.show_page('my_rounds')
		@app.pages.my_rounds.$('a.join.btn').click()

	create_deed: ->
		@app.show_page('my_deeds')
		@app.pages.my_deeds.$('#create-deed-btn').click()

	setup: (name) ->
		$('.page').hide()
		$("#page_#{name}").show()
		$('body').attr('class', name)

	main: ->
		@navigate('rounds/mine/', {trigger: true, replace: true})

	go: (target) -> @navigate(target, {trigger: true})

module.exports = PageRouter