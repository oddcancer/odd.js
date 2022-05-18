(function (odd) {
    var utils = odd.utils,
        crypt = utils.crypt,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        NetStatusEvent = events.NetStatusEvent,
        Level = events.Level,
        Code = events.Code,
        IM = odd.IM,
        Responder = IM.Responder,
        State = IM.State,
        Type = IM.Message.Type,
        Command = IM.Message.Command,
        UserControl = IM.Message.UserControl,

        _default = {
        };

    function NetConnection(config, logger) {
        EventDispatcher.call(this, 'NetConnection', { logger: logger }, Event, NetStatusEvent);

        var _this = this,
            _logger = logger,
            _id,
            _conn,
            _resolve,
            _reject,
            _channels,
            _messages,
            _commands,
            _controls,
            _responders,
            _transactionID,
            _sn,
            _farAckWindowSize,
            _nearAckWindowSize,
            _lastBytesIn,
            _lastBytesOut,
            _readyState;

        function _init() {
            _this.config = utils.extendz({}, _default, config);
            _this.properties = {};
            _id = 0;
            _channels = { 0: _this };
            _messages = {};
            _commands = {};
            _controls = {};
            _responders = {};
            _transactionID = 0;
            _sn = 0;
            _readyState = State.INITIALIZED;

            _commands[Command.STATUS] = _processCommandStatus;
        }

        _this.id = function () {
            return _id;
        };

        _this.connect = async function (url) {
            if (_readyState === State.CONNECTED) {
                _logger.warn(`Already connected.`);
                return Promise.reject('already connected');
            }
            _conn = new WebSocket(url);
            _conn.onopen = _onOpen;
            _conn.onmessage = _onMessage;
            _conn.onerror = _onError;
            _conn.onclose = _onClose;
            _conn.binaryType = 'arraybuffer';
            return await new Promise((resolve, reject) => {
                _resolve = resolve;
                _reject = reject;
            });
        };

        function _onOpen(e) {
            _this.call(Command.CONNECT, _id, 0, new Responder(function (m) {
                _logger.log(`Connect success.`);
                var info = m.Arguments.info;
                for (var key in info.user) {
                    _this.properties[key] = info.user[key];
                }
                _readyState = State.CONNECTED;
                _resolve();
                _resolve = _reject = undefined;
            }, function (m) {
                _logger.error(`Failed to connect: ${m.Arguments.description}`);
                _reject();
                _resolve = _reject = undefined;
            }));
        }

        function _onMessage(e) {
            _logger.debug(`onMessage: ${e.data}`);

            var p = new IM.Message();
            try {
                p.parse(e.data, 0);
            } catch (err) {
                _logger.error(`Failed to parse im message: data=${e.data}, error=${err}`);
                return;
            }

            var channel = _channels[p.StreamID];
            if (channel == null) {
                _logger.warn(`Channel ${p.StreamID} not found, should create at first.`);
                return;
            }
            try {
                channel.process(p);
            } catch (err) {
                _logger.error(`Failed to process message: type=${p.Type}, channel=${p.StreamID}, error=${err}`);
                _this.close(err.message);
            }
        }

        _this.process = function (p) {
            switch (p.Type) {
                case Type.ABORT:
                    var m = new IM.AbortMessage(p);
                    m.parse(p.Payload.buffer, p.Payload.byteOffset);
                    delete _messages[m.Payload];
                    _logger.log(`Abort chunk stream: ${m.Payload}`);
                    break;

                case Type.ACK_WINDOW_SIZE:
                    var m = new IM.AckWindowSizeMessage(p);
                    m.parse(p.Payload.buffer, p.Payload.byteOffset);
                    _farAckWindowSize = m.Payload;
                    _logger.log(`Set farAckWindowSize to ${_farAckWindowSize}`);
                    break;

                case Type.ACK:
                    var m = new IM.AckMessage(p);
                    m.parse(p.Payload.buffer, p.Payload.byteOffset);
                    _logger.log(`ACK sequence number: ${m.Payload}/${_lastBytesOut}`);
                    break;

                case Type.COMMAND:
                    var m = new IM.CommandMessage(p);
                    m.parse(p.Payload.buffer, p.Payload.byteOffset);
                    _processCommand(m);
                    break;

                case Type.USER_CONTROL:
                    var m = new IM.UserControlMessage(p);
                    m.parse(p.Payload.buffer, p.Payload.byteOffset);
                    _processUserControl(m);
                    break;

                default:
                    throw { name: 'DataError', message: `unrecognized message type ${p.Type}` };
            }
        };

        function _processCommand(m) {
            var handler = _commands[m.Command];
            if (handler) {
                return handler(m);
            }
            // Should not return error, just ignore.
            _logger.warn(`No handler found: command=${m.Command}, arguments=`, m.Arguments);
            return null;
        }

        function _processCommandStatus(m) {
            var level = m.Arguments.level;
            var code = m.Arguments.code;
            var description = m.Arguments.description;
            var info = m.Arguments.info;

            var responder = _responders[m.TransactionID];
            if (responder != null) {
                var callback = level === Level.ERROR ? responder.status : responder.result;
                if (callback != null) {
                    callback(m);
                }
            }
            delete _responders[m.TransactionID];

            if (code) {
                _logger.debug(`onStatus: id=${_id}, level=${level}, code=${code}, description=${description}, info=`, info);
                _this.dispatchEvent(NetStatusEvent.NET_STATUS, m.Arguments);
            }
            return null;
        }

        function _processUserControl(m) {
            var handler = _controls[m.Info.type];
            if (handler) {
                return handler(m);
            }
            // Should not return error, just ignore.
            _logger.warn(`No handler found: control=${m.Info.type}, info=${m.Info}`);
            return null;
        }

        function _onError(e) {
            _logger.error(`onError: name=${e.name}, message=${e.message}`);
            if (_reject) {
                _reject();
                _resolve = _reject = undefined;
            }
            _this.dispatchEvent(Event.ERROR, { name: e.name, message: e.message });
        }

        function _onClose(e) {
            _logger.log(`onClose: ${e.reason || 'EOF'}`);
            _this.close(e.reason || 'EOF');
        }

        _this.create = async function (ns, responder) {
            var result, status;
            var ret = new Promise((resolve, reject) => {
                result = resolve;
                status = reject;
            });
            _this.call(Command.CREATE, _id, 0, new Responder(function (m) {
                _logger.log(`Create channel success: id=${m.Arguments.info.id}`);
                ns.onrelease = _onRelease; // Do not use addEventListener here, make sure this is the only listener.

                _channels[m.Arguments.info.id] = ns;
                if (responder && responder.result) {
                    responder.result(m);
                }
                result();
            }, function (m) {
                _logger.error(`Failed to create channel: level=${m.Arguments.level}, code=${m.Arguments.code}, description=${m.Arguments.description}`);
                if (responder && responder.status) {
                    responder.status(m);
                }
                _this.dispatchEvent(NetStatusEvent.NET_STATUS, m.Arguments);
                status();
            }));
            return await ret;
        };

        function _onRelease(e) {
            var ns = e.target;
            ns.onrelease = undefined;
            delete _channels[ns.id()];

            _this.call(Command.RELEASE, _id, 0, null, {
                id: ns.id(),
            });
        }

        _this.call = function (command, channel, transactionID, responder, args) {
            if (responder) {
                transactionID = ++_transactionID;
                _responders[transactionID] = responder;
            }

            var text = JSON.stringify(args || {});
            var byte = crypt.StringToUTF8ByteArray(text);

            var i = 0;
            var data = new Uint8Array(7 + byte.length);
            var view = new DataView(data.buffer);

            view.setUint32(i, new Date().getTime());
            i += 4;
            view.setUint16(i, transactionID);
            i += 2;
            view.setUint8(i, command);
            i++;
            data.set(byte, i);

            return _this.write(Type.COMMAND, channel, data);
        };

        _this.sendUserControl = function (channel, transactionID, responder, info, payload) {
            if (responder) {
                transactionID = ++_transactionID;
                _responders[transactionID] = responder;
            }

            var text = JSON.stringify(info);
            var byte = crypt.StringToUTF8ByteArray(text);
            var size = 8 + byte.length;
            if (payload) {
                size += payload.byteLength;
            }

            var i = 0;
            var data = new Uint8Array(size);
            var view = new DataView(data.buffer);

            view.setUint32(i, new Date().getTime());
            i += 4;
            view.setUint16(i, transactionID);
            i += 2;
            view.setUint16(i, byte.length);
            i += 2;
            data.set(byte, i);
            i += byte.length;
            if (payload) {
                data.set(payload, i);
                i += payload.byteLength;
            }
            return _this.write(Type.USER_CONTROL, channel, data);
        };

        _this.write = function (type, channel, payload) {
            var i = 0;
            var data = new Uint8Array(7 + payload.byteLength);
            var view = new DataView(data.buffer);

            view.setUint8(i, 0x80 | type);
            i++;
            view.setUint16(i, ++_sn);
            i += 2;
            view.setUint32(i, channel);
            i += 4;
            data.set(payload, i);
            i += payload.byteLength;

            try {
                _conn.send(view);
            } catch (err) {
                _logger.error(`Failed to send: type=${type}, channle=${channel}, error=${err}`);
                return Promise.reject(err);
            }
            return Promise.resolve();
        };

        _this.state = function () {
            return _readyState;
        };

        _this.close = function (reason) {
            switch (_readyState) {
                case State.CONNECTED:
                    _readyState = State.CLOSING;
                    for (var i in _channels) {
                        if (i != 0) {
                            var ns = _channels[i];
                            // Can I call release instead?
                            ns.onrelease = undefined;
                            ns.close(reason);
                        }
                    }
                    _channels = { 0: _this };
                    if (_conn && (_conn.readyState == WebSocket.CONNECTING || _conn.readyState == WebSocket.OPEN)) {
                        _conn.close();
                        _conn = undefined;
                    }
                    _this.dispatchEvent(Event.CLOSE, { reason: reason });
                    _readyState = State.CLOSED;
                    break;

                case State.INITIALIZED:
                    _readyState = State.CLOSING;
                    if (_conn && (_conn.readyState == WebSocket.CONNECTING || _conn.readyState == WebSocket.OPEN)) {
                        _conn.close();
                        _conn = undefined;
                    }
                    _this.dispatchEvent(Event.CLOSE, { reason: reason });
                    _readyState = State.CLOSED;
                    break;
            }
        };

        _init();
    }

    NetConnection.prototype = Object.create(EventDispatcher.prototype);
    NetConnection.prototype.constructor = NetConnection;
    NetConnection.prototype.CONF = _default;

    IM.NetConnection = NetConnection;
})(odd);

