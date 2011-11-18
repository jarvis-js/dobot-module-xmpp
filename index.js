var xmpp = require('node-xmpp');

module.exports = function(bot, module) {

	module.load = function(options) {
		module.adaptors = [];
		if (options.connection) {
			if(!Array.isArray(options.connection)) {
				options.connection = [ options.connection ];
			}
			for (var i = 0; i < options.connection.length; i++) {
				module.adaptors.push(new XMPPAdaptor(bot, options.connection[i]));
			}
		}
	};

	module.unload = function() {
		for (var i = 0; i < module.adaptors.length; i++) {
			module.adaptors[i].end();
		}
	};

};

function XMPPAdaptor(bot, options) {
	this.bot = bot;
	this.options = {
		keepAlive: 15000
	};
	for (var key in options) {
		this.options[key] = options[key];
	}
	this.client = new xmpp.Client(this.options);
	var _this = this;
	this.client.on('online', function() { _this.online() });
	this.client.on('stanza', function(stanza) { _this.handleStanza(stanza) });
};

XMPPAdaptor.prototype.online = function() {
	var _this = this;
	this.client.send(new xmpp.Element('presence', { }).c('show').t('chat').c('status').t('Available'));
	this.keepAlive = setInterval(function() { _this.rosterQuery(); }, this.options.keepAlive);
};

XMPPAdaptor.prototype.rosterQuery = function() {
	this.client.send(new xmpp.Element('iq', {
		type: 'get',
		id: (new Date).getTime()
	}).c('query', { xmlns: 'jabber:iq:roster' }));
};

XMPPAdaptor.prototype.handleStanza = function(stanza) {
	if (stanza.is('message') && stanza.attrs.type !== 'error') {
		if (stanza.attrs.type === 'chat') {
			var _this = this;
			var channel = this.getChannel('xmpp:' + stanza.attrs.to + ':' + stanza.attrs.from, function(response) { _this.send(response) });
			var body = stanza.getChild('body');
			if (body) {
				var messageData = {
					message: body.getText(),
					userID: stanza.attrs.from
				};
				channel.emit('message', messageData);
				channel.emit('command', messageData);
			}
		}
	}
};

XMPPAdaptor.prototype.send = function(response) {
	var reply = new xmpp.Element('message', {
		to: response.userID,
		type: 'chat'
	}).c('body').t(response.reply);
	this.client.send(reply);
};

XMPPAdaptor.prototype.end = function() {
	if (this.keepAlive) {
		clearInterval(this.keepAlive);
	}
	this.client.end();
};

XMPPAdaptor.prototype.getChannel = function(channelID, multiuser, say) {
	if (say === undefined) {
		say = multiuser;
		multiuser = false;
	}
	if (this.bot.channels[channelID]) {
		return this.bot.channels[channelID];
	}
	var channel = new this.bot.Channel();
	channel.module = module.name;
	channel.identifier = channelID;
	channel.multiuser = multiuser;
	channel.say = say;
	this.bot.registerChannel(channel);
	return channel;
};
