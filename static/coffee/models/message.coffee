class Message extends Backbone.Epoxy.Model

class MessageCollection extends Backbone.Collection
	model: Message

module.exports =
	Message: Message
	MessageCollection: MessageCollection