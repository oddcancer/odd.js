(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        NetStatusEvent = events.NetStatusEvent,
        Level = events.Level,
        Code = events.Code,
        RTC = odd.RTC,
        Responder = RTC.Responder,
        State = RTC.State,
        Signal = RTC.Signal,

        _default = {
            iceServers: [{
                urls: ["stun:stun.l.google.com:19302"],
            }],
            iceTransportPolicy: "all", // all, relay
        };

    function NetConnection(config, logger) {
        EventDispatcher.call(this, 'NetConnection', { logger: logger }, Event, NetStatusEvent);

        var _this = this,
            _logger = logger,
            _id,
            _conn,
            _resolve,
            _reject,
            _pipes,
            _handlers,
            _responders,
            _sn,
            _readyState;

        function _init() {
            _this.config = utils.extendz({}, _default, config);
            _this.properties = {};
            _id = 0;
            _pipes = { 0: _this };
            _responders = {};
            _sn = 0;
            _readyState = State.INITIALIZED;

            _handlers = {
                status: _processCommandStatus,
            };
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
            _this.call(Signal.CONNECT, _id, new Responder(function (m) {
                _logger.log(`RTC signaling connect success.`);
                var info = m.data.info;
                for (var key in info.user) {
                    _this.properties[key] = info.user[key];
                }
                _readyState = State.CONNECTED;
                _resolve();
                _resolve = _reject = undefined;
            }, function (m) {
                _logger.error(`Failed to connect: ${m.data.description}`);
                _reject();
                _resolve = _reject = undefined;
            }), _this.properties);
        }

        function _onMessage(e) {
            _logger.debug(`onMessage: ${e.data}`);

            var m;
            try {
                m = eval(`(${e.data})`);
            } catch (err) {
                _logger.error(`Failed to parse JSON: data=${e.data}, error=${err}`);
                return;
            }

            var pipe = _pipes[m.chan];
            if (pipe == null) {
                _logger.warn(`Channel ${m.chan} not found, should create at first.`);
                return;
            }
            pipe.process(m);
        }

        _this.process = function (m) {
            var handler = _handlers[m.type];
            if (handler != null) {
                return handler(m);
            }
            // Should not return error, just ignore.
            _logger.warn(`No handler found: signal=${m.type}, arguments=${m.data}`);
            return null;
        };

        function _processCommandStatus(m) {
            var level = m.data.level;
            var code = m.data.code;
            var description = m.data.description;
            var info = m.data.info;

            var responder = _responders[m.sn];
            if (responder != null) {
                var callback = level === Level.ERROR ? responder.status : responder.result;
                if (callback != null) {
                    callback(m);
                }
            }
            delete _responders[m.sn];

            if (code) {
                _logger.debug(`onStatus: level=${level}, code=${code}, description=${description}, info=`, info);
                _this.dispatchEvent(NetStatusEvent.NET_STATUS, m.data);
            }
            return Promise.resolve();
        }

        function _onError(e) {
            _logger.error(`onError: ${e}`);
            if (_reject) {
                _reject();
                _resolve = _reject = undefined;
            }
            _this.dispatchEvent(Event.ERROR, { name: e.name, message: e.message });
        }

        function _onClose(e) {
            _logger.log(`onClose: ${e.code} ${e.reason || 'EOF'}`);
            _this.dispatchEvent(Event.CLOSE, { reason: `${e.code} ${e.reason || 'EOF'}` });
            _readyState = State.CLOSED;
        }

        _this.create = async function (ns, responder) {
            var result, status;
            var ret = new Promise((resolve, reject) => {
                result = resolve;
                status = reject;
            });
            _this.call(Signal.CREATE, _id, new Responder(function (m) {
                _logger.log(`Create pipe success: id=${m.data.id}`);
                ns.onrelease = _onRelease; // Do not use addEventListener here, make sure this is the only listener.

                _pipes[m.data.id] = ns;
                if (responder && responder.result) {
                    responder.result(m);
                }
                result();
            }, function (m) {
                _logger.error(`Failed to create pipe: level=${m.data.level}, code=${m.data.code}, description=${m.data.description}`);
                if (responder && responder.status) {
                    responder.status(m);
                }
                _this.dispatchEvent(NetStatusEvent.NET_STATUS, m.data);
                status();
            }));
            return await ret;
        };

        function _onRelease(e) {
            var ns = e.target;
            ns.onrelease = undefined;
            delete _pipes[ns.id()];
        }

        _this.call = function (command, chan, responder, args) {
            var m = {
                type: command,
                chan: chan,
                sn: 0,
                data: args || {},
            };
            if (responder) {
                m.sn = _sn++;
                _responders[m.sn] = responder;
            }
            try {
                var b = JSON.stringify(m);
                _conn.send(b);
                _logger.debug(`Sent: ${b}`);
            } catch (err) {
                _logger.error(`Failed to call ${command}: ${err}`);
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
                    for (var i in _pipes) {
                        if (i != 0) {
                            var pipe = _pipes[i];
                            pipe.onrelease = undefined;
                            pipe.release(reason);
                        }
                    }
                    _pipes = { 0: _this };
                /* fallthrough */
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

    RTC.NetConnection = NetConnection;
})(odd);

