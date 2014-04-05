Page = require('../page.coffee')
deed = require('../../models/deed.coffee')
round = require('../../models/round.coffee')
Round = round.Round
Deed = deed.Deed
RoundCollection = round.RoundCollection

class JoinRoundOptionView
	el: """
	<option name="value">"""


class JoinRoundItemView extends Backbone.Epoxy.View
	el: '#join-round-form #select-deed'
	bindings: 
		el: 'collection:$collection'
		itemView: JoinRoundOptionView

class JoinRoundView extends Backbone.Epoxy.View
	el: '#join-round-form'
	events:
		'submit': 'onSubmit'
	initialize: (options) ->
		@deeds = options.deeds
		getData = (collection) -> 
			l = collection.map (c) ->
				id: c.id
				text: c.get('title')
				model: c
			l.push({id: '', text: 'Create deed'})
			return l
		format = (deed) ->
			t = ''
			if deed.model
				t = """<img style="height:80px; padding:5px 5px 5px 0; vertical-align:middle;" src="#{deed.model.get('image_url')}" /> """
			t += deed.text
			return t

		init_s2 = (->
			@$('#select-deed').select2
				data: getData(@deeds)
				formatResult: format
				formatSelection: format
				escapeMarkup: (m) -> m).bind(@)

		@deeds.on 'add reset remove change', ->
			init_s2()
		window.init_s2 = init_s2
		init_s2()

	onSubmit: (e) ->
		e.preventDefault()
		data = 
			stake: @$("input[name=stake]:checked" ).val()
			deed_id: @$('input#select-deed').val()
		if not data.deed_id
			app.router.go('#deeds/mine/create')
			$('#joinRoundModal button.close').click()
			return false

		@$('button[type=submit]').html("Joining...").addClass('active')
		$.ajax
			type: 'PUT'
			url: Round.prototype.urlRoot
			contentType: 'application/json'
			data: JSON.stringify(data)
			dataType: 'json'
			success: (data) ->
				g = new Round(data)
				app.collections.my_rounds.add(g)
				app.router.go(g.appUrl())
				$('#joinRoundModal button.close').click()

class MyRoundsListView extends Backbone.Epoxy.View
	bindings:
		':el': "collection:$collection"
	initialize: (options) -> 
		console.log options
		console.log @

class MyRoundsListItemView extends Backbone.Epoxy.View
	el: """
	<li>
		<a data-bind="attr:{href:url, class:status}">
			<div class="info">
				<div class="deeds"><span data-bind="text:number_of_players"></span> deeds</div>
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

class MyRoundsCollection extends RoundCollection
	view: MyRoundsListItemView

class MyRoundsPage extends Page
	name: 'my_rounds'
	events:
		'click #join-round-button': (e) ->
			e.preventDefault()
			$('#joinRoundModal').modal()

	initialize: (options) ->
		@listview = new MyRoundsListView
			collection: @app.collections.my_rounds
			el: @$('ul#my-rounds-grid')
		@joinroundview = new JoinRoundView
			deeds: @app.collections.my_deeds

module.exports = 
	MyRoundsPage: MyRoundsPage
	MyRoundsCollection: MyRoundsCollection