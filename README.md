# XMPP

Provides channels for chatting to the bot over the XMPP protocol.

## Configuration

An example configuration can be seen below.

	xmpp: {
		connection: {
			jid: 'jid@host.com',
			password: 'password',
			host: 'server.hostname.com',
			port: 5222
		}
	}

### connection

Can be a single server definition or an array or server definitions.

#### jid

Jabber ID to connect with.

#### password

Password for Jabber ID.

#### [host]

Hostname of the chat server.  Only required if the hostname isn't part of the Jabber ID.

#### [port]

Port of the chat server.  Defaults to 5222.

#### [keepAlive]

The interval in milliseconds to ping the chat server.  Defaults to 15 seconds.
