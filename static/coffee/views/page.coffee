class Page extends Backbone.Epoxy.View
	name: ''
	constructor: (options)->
		@app = options.app
		options.el = @app.$('div#page_' + @name)
		super(options)

	show: ->
		$('body').addClass("page_#{@name}")
		@$el.show()
		$("nav a[data-page='#{@name}']").addClass('active')

	hide: ->
		@$el.hide()
		$("nav a[data-page='#{@name}']").removeClass('active')
		$('body').removeClass("page_#{@name}")

module.exports = Page