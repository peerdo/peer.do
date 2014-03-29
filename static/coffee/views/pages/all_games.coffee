Page = require('../page.coffee')
class GamesListView extends Backbone.Epoxy.View

class AllGamesPage extends Page
	name: 'all_games'
	initialize: (options) ->
		@listview = new GamesListView
			collection: options.games_list

module.exports = AllGamesPage