(function (odd) {
    var utils = odd.utils,
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

    function NetStream(logger) {
        EventDispatcher.call(this, 'NetStream', { logger: logger }, Event, NetStatusEvent);

        var _this = this,
            _logger = logger,
            _id,
            _client,
            _commands,
            _controls,
            _responders,
            _transactionID,
            _readyState;

        function _init() {
            _id = 0;
            _transactionID = 0;
            _commands = {};
            _controls = {};
            _responders = {};
            _readyState = State.INITIALIZED;

            _commands[Command.STATUS] = _processCommandStatus;
        }

        _this.id = function () {
            return _id;
        };

        _this.client = function () {
            return _client;
        };

        _this.attach = async function (nc) {
            _client = nc;

            return await _client.create(_this, new Responder(function (m) {
                _id = m.Arguments.info.id;
                _readyState = State.CONNECTED;
            }, function (m) {
                _this.close(m.Arguments.description);
            }));
        };

        _this.join = async function (id) {
            var result, status;
            var ret = new Promise((resolve, reject) => {
                result = resolve;
                status = reject;
            });
            _this.call(Command.JOIN, 0, new Responder(function (m) {
                _logger.log(`Join ${id} success.`);
                result();
            }, function (m) {
                _logger.error(`Failed to join ${id}: ${m.Arguments.description}`);
                status();
            }), { chan: id });
            return await ret;
        };

        _this.leave = async function (id) {
            var result, status;
            var ret = new Promise((resolve, reject) => {
                result = resolve;
                status = reject;
            });
            _this.call(Command.LEAVE, 0, new Responder(function (m) {
                _logger.log(`Leave ${id} success.`);
                result();
            }, function (m) {
                _logger.error(`Failed to leave ${id}: ${m.Arguments.description}`);
                status();
            }), { chan: id });
            return await ret;
        };

        _this.send = async function (chan, text) {
            return await _this.sendUserControl(0, null, {
                type: UserControl.TEXT,
                cast: 'multi',
                chan: chan,
                text: text,
            }).then(() => {
                _logger.debug(`Send text success.`);
            }).catch((err) => {
                _logger.error(`Failed to send text: ${err}`);
            });
        };

        _this.sendTo = async function (to, text) {
            return await _this.sendUserControl(0, null, {
                type: UserControl.TEXT,
                cast: 'uni',
                to: to,
                text: text,
            }).then(() => {
                _logger.debug(`Send text success.`);
            }).catch((err) => {
                _logger.error(`Failed to send text: ${err}`);
            });
        };

        _this.call = function (command, transactionID, responder, args) {
            if (responder) {
                transactionID = ++_transactionID;
                _responders[transactionID] = responder;
            }
            return _client.call(command, _id, transactionID, null, args);
        };

        _this.sendUserControl = function (transactionID, responder, info, payload) {
            if (responder) {
                transactionID = ++_transactionID;
                _responders[transactionID] = responder;
            }
            return _client.sendUserControl(_id, transactionID, null, info, payload);
        };

        _this.process = function (p) {
            switch (p.Type) {
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
            _logger.warn(`No handler found: id=${_id}, command=${m.Command}, arguments=`, m.Arguments);
            return null;
        };

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
            if (handler == null) {
                handler = _processUserControlDefault;
            }
            return handler(m);
        }

        function _processUserControlDefault(m) {
            var info = m.Info;
            _this.dispatchEvent(NetStatusEvent.NET_STATUS, {
                level: Level.STATUS,
                code: info.cast === 'uni' ? Code.NETGROUP_SENDTO_NOTIFY : Code.NETGROUP_POSTING_NOTIFY,
                description: info.cast === 'uni' ? 'sendto notify' : 'posting notify',
                info: m,
            });
        }

        _this.state = function () {
            return _readyState;
        };

        _this.release = function (reason) {
            _this.close(reason);
            _this.dispatchEvent(Event.RELEASE);
        };

        _this.close = function (reason) {
            switch (_readyState) {
                case State.INITIALIZED:
                case State.CONNECTED:
                    _readyState = State.CLOSING;

                    _this.dispatchEvent(Event.CLOSE, { reason: reason });
                    _readyState = State.CLOSED;
                    break;
            }
        };

        _init();
    }

    NetStream.prototype = Object.create(EventDispatcher.prototype);
    NetStream.prototype.constructor = NetStream;
    NetStream.prototype.CONF = _default;

    IM.NetStream = NetStream;
})(odd);

