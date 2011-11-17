var xmpp = require('node-xmpp');

module.exports = function(bot) {

	var module = new bot.Module();

	module.load = function(options) {

		var clientOptions = {
			jid: options.jid,
			password: options.password,
			keepAlive: options.keepAlive || 15000
		}
		if (options.host) {
			clientOptions.host = options.host;
		}
		if (options.port) {
			clientOptions.port = options.port;
		}

		var client = new xmpp.Client(clientOptions);

		client.on('online', function() {
			console.log('xmpp online');
			client.send(new xmpp.Element('presence', { }).c('show').t('chat').c('status').t('Available'));

			module.keepAlive = setInterval(function() {
				client.send(new xmpp.Element('iq', {
					type: 'get',
					id: (new Date).getTime()
				}).c('query', { xmlns: 'jabber:iq:roster' }));
			}, clientOptions.keepAlive);
		});

		client.on('stanza', function(stanza) {
			if (stanza.is('message') && stanza.attrs.type !== 'error') {
				if (stanza.attrs.type === 'chat') {
					var channel = module.addChannel('xmpp:' + stanza.attrs.to + ':' + stanza.attrs.from, function(response) {
						var reply = new xmpp.Element('message', {
							to: response.userID,
							type: 'chat'
						}).c('body').t(response.reply);
						client.send(reply);
					});
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
		});

	};

	module.unload = function() {
		if (module.keepAlive) {
			clearInterval(module.keepAlive);
		}
	}

	module.addChannel = function(channelID, say) {
		if (bot.channels[channelID]) {
			return bot.channels[channelID];
		}
		var channel = new bot.Channel();
		channel.module = module.name;
		channel.identifier = channelID;
		channel.say = say;
		bot.registerChannel(channel);
		return channel;
	}

	return module;

};
