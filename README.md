Peer.do
=======

Quickly-hacked-together initial prototype. Requires a clean Redis instance on localhost:6379.
Front-end is built with Coffeescript, Backbone and Epoxy - sorry about the current lack of comments or documentation, they will be coming!
CSS is compiled with compass - use `compass watch` in the `static/` directory.
Use [Coffeeify](https://github.com/jnordberg/coffeeify) with [Browserify](http://browserify.org/) to compile the coffeescript. (requires npm- no package.json set up yet, again will be coming).

Currently all data is stored on Redis; need to move it out to postgres and replace some of my backend classes with sqlalchemy. Ideally need to get something async working with tornado. Undecided on whether or not to use Redis to provide pubsub- a message queue like RabbitMQ might suit our needs better.
