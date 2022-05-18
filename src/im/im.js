(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        NetStatusEvent = events.NetStatusEvent,
        Level = events.Level,
        Code = events.Code,

        _id = 0,
        _instances = {},
        _default = {
            url: 'wss://' + location.host + '/im',
        };

    function IM(id, option) {
        var _this = this,
            _id = id,
            _logger = option instanceof utils.Logger ? option : new utils.Logger(id, option),
            _nc,
            _ns;

        EventDispatcher.call(this, 'IM', { id: id, logger: _logger }, Event, NetStatusEvent);

        function _init() {
            _this.logger = _logger;
        }

        _this.id = function () {
            return _id;
        };

        _this.setup = async function (config) {
            _this.config = utils.extendz({ id: _id }, _default, config);

            _nc = new IM.NetConnection({}, _logger);
            _nc.addEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            _nc.addEventListener(Event.CLOSE, _onClose);

            _ns = new IM.NetStream(_logger);
            _ns.addEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            _ns.addEventListener(Event.CLOSE, _onCloseStream);
            _bind();

            try {
                await _nc.connect(_this.config.url);
            } catch (err) {
                _logger.error(`Failed to connect: ${err}`);
                return Promise.reject(err);
            }
            return await _ns.attach(_nc);
        };

        function _bind() {
            _this.join = _ns.join;
            _this.leave = _ns.leave;
            _this.send = _ns.send;
            _this.sendTo = _ns.sendTo;
            _this.call = _ns.call;
            _this.sendUserControl = _ns.sendUserControl;
            _this.state = _nc.state;
            _this.dispatchEvent(Event.BIND);
            _this.dispatchEvent(Event.READY);
        }

        function _onStatus(e) {
            var level = e.data.level;
            var code = e.data.code;
            var description = e.data.description;
            var info = e.data.info;
            var method = { status: 'debug', warning: 'warn', error: 'error' }[level] || 'debug';
            _logger[method](`onStatus: level=${level}, code=${code}, description=${description}, info=`, info);
            _this.forward(e);
        }

        function _onCloseStream(e) {
            _logger.log(`onCloseStream: ${e.data.reason}`);
            _ns.removeEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            _ns.removeEventListener(Event.CLOSE, _onCloseStream);
        }

        function _onClose(e) {
            _logger.log(`onClose: ${e.data.reason}`);
            _this.close(e.data.reason);
            _this.forward(e);
        }

        _this.close = function (reason) {
            switch (_this.state()) {
                case IM.State.CONNECTED:
                case IM.State.INITIALIZED:
                    if (_nc) {
                        _nc.close(reason);
                        _nc.removeEventListener(NetStatusEvent.NET_STATUS, _this.forward);
                        _nc.removeEventListener(Event.CLOSE, _onClose);
                    }
                    delete _instances[_id];
                    break;
            }
        };

        _init();
    }

    IM.prototype = Object.create(EventDispatcher.prototype);
    IM.prototype.constructor = IM;
    IM.prototype.CONF = _default;

    IM.get = function (id, option) {
        if (id == null) {
            id = 0;
        }
        var im = _instances[id];
        if (im === undefined) {
            im = new IM(id, option);
            _instances[id] = im;
        }
        return im;
    };

    IM.create = function (option) {
        return IM.get(_id++, option);
    };

    odd.im = IM.get;
    odd.im.create = IM.create;
    odd.IM = IM;
})(odd);

