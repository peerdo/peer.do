CardCollection = require('../../models/card.coffee').CardCollection
Page = require('../page.coffee')

class MyCardsCollection extends CardCollection

class MyCardsListItemView extends Backbone.Epoxy.View
	el: """
		<li data-bind="attr:{'data-cid': $model().cid}">
			<img data-bind="attr:{src:image_url}" />
			<div>
				<h4 data-bind="text:title"></h4>
				<div class="data">
		            <div class="credibility"><span data-bind="text:credibility">50</span>% credibility</div>
		            <div class="longevity"><span data-bind="text:longevity">6</span> games</div>
		            <div class="winnings">won <span data-bind="text:nice_winnings">501 mBTC</span></div>
		        </div>
		    </div>
	    </li>
	"""

class MyCardsListView extends Backbone.Epoxy.View
	el: 'ul#my-cards-list'
	bindings:
		':el': 'collection:$collection'
	itemView: MyCardsListItemView

class MyCardView extends Backbone.Epoxy.View
	el: """<div class="card">
	    <div class="full-card">
	    	<div class="img-container">
	    		<img data-bind="attr:{src:image_url}" />
	    		<h3 class="title" data-bind="text:title">Name</h3>
	    		<div class="giveback"><span><strong data-bind="text:giveback" class="givebackval">90</strong>%</span> giveback</div>
	    	</div>
	        <div class="message" data-bind="text:message"></div>
	        <div class="ratings">
	            <div class="credibility"><strong>Credibility</strong><span data-bind="text:credibility">50</span>%</div>
	            <div class="longevity"><strong>Longevity</strong><span data-bind="text:longevity">6</span> games</div>
	            <div class="winnings"><strong>Winnings</strong><span data-bind="text:nice_winnings">501 mBTC</span></div>
            	<div class="url"><strong>Url</strong> <span data-bind="toggle:none(url)">[no url]</span><a data-bind="text:url,attr:{href:url}">View</a></div>
	        </div>
	        <button class="btn edit">Edit</button>
	    </div>
    	 <form class="edit-card form-horizontal" style="display:none;"> 
        	<div class="form-group">
        		<label class="col-sm-2 control-label" for="id_title" style="display:none;">Title</label>
        		<div class="col-sm-12"><input type="text" id="id_title" name="title" placeholder="title" class="form-control input-lg"/></div>
        	</div>
        	<div class='form-group'>
        		<label class="col-sm-2 control-label" for="id_giveback">Giveback percentage</label>
        		<div class="col-sm-10"><input type="number" name="giveback" min="0" max="100" step="1" class="form-control" /></div>
        	</div>
        	<div class="form-group">
        		<label class="col-sm-2 control-label" for="id_url">URL</label>
        		<div class="col-sm-10"><input type="url" name="url" id="id_url" class="form-control"/></div>
        	</div>
        	<div class="form-group">
        		<label class="col-sm-2 control-label" for="id_message">Message</label>
        		<div class="col-sm-10"><textarea name="message" id="id_message" class="form-control"></textarea></div>
        	</div>
        	<div class="form-group">
        		<label class="col-sm-2 control-label" for="id_image">Image</label>
        		<div class="col-sm-10"><input type="url" name="image_url" id="id_image" class="form-control"/></div>
        	</div>
        	<button class="btn btn-success" type="submit">Save</button>
    		<button class="btn cancel" type="reset">Cancel</button>
        </form></div>
	"""
	onEdit: (e) ->
		e.preventDefault()
		@$('.full-card').hide()
		@$('form input[name=title]').val(@model.get('title'))
		@$('form input[name=image_url]').val(@model.get('image_url'))
		@$('form input[name=url]').val(@model.get('url'))
		@$('form input[name=giveback]').val(@model.get('giveback'))
		@$('form textarea[name=message]').val(@model.get('message'))
		@$('form').show()

	events:
		'click button.edit': 'onEdit'
		'submit form': 'onSubmit'
		'click button.cancel': 'onCancel'

	onSubmit: (e) ->
		e.preventDefault()
		updates = {}
		for n in "title message giveback url image_url".split(' ')
			updates[n] = @$("form *[name=#{n}]").val()

		@model.save updates, 
			patch: true
			success: (c, d, xhr) ->
				c.set('id', d.card_id)
				c.collection.trigger('change')
		#init_s2()
		@$('form').hide()
		@$('.full-card').show()

	onCancel: (e) ->
		if @model.isNew()
			@model.destroy()
		@$('form').hide()
		@$('.full-card').show()

class MyCardsPage extends Page
	name: 'my_cards'
	bindings: {'div.pane.header div.cards span': 'text:length($collection)'}
	events:
		'click ul#my-cards-list li': 'onLiClick'
		'click .pane.header .new button': 'onAdd'
			
	initialize: ->
		@collection = @app.collections.my_cards
		@listview = new MyCardsListView
			collection: @collection

	onLiClick: (e)->
		@showCard($(e.currentTarget))

	showCard: ($li) ->
		@$('ul#my-cards-list li').removeClass('active')
		$li.addClass('active')
		@view = new MyCardView
			model: @collection.get($li.attr('data-cid'))
		@$('#card-view').html(@view.$el)


	onAdd: ->
		c = new Card()
		@collection.add(c)
		@showCard $("ul#my-cards-list li[data-cid=#{c.cid}]")
		@view.$('button.edit').click()

module.exports = 
	MyCardsPage: MyCardsPage
	MyCardsCollection: MyCardsCollection