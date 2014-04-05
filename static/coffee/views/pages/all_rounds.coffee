Page = require('../page.coffee')
class RoundsListView extends Backbone.Epoxy.View

class AllRoundsPage extends Page
	name: 'all_rounds'
	initialize: (options) ->
		@listview = new RoundsListView
			collection: options.rounds_list

module.exports = AllRoundsPage