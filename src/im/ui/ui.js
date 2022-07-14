(function (odd) {
    var utils = odd.utils,
        OS = odd.OS,
        css = utils.css,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        NetStatusEvent = events.NetStatusEvent,
        Level = events.Level,
        Code = events.Code,
        UIEvent = events.UIEvent,
        GlobalEvent = events.GlobalEvent,
        MouseEvent = events.MouseEvent,
        IM = odd.IM,
        Command = IM.Message.Command,
        UserControl = IM.Message.UserControl,

        CLASS_WRAPPER = 'im-wrapper',

        _id = 0,
        _instances = {},
        _default = {
            skin: 'classic',
            plugins: [],
        };

    function UI(id, option) {
        var _this = this,
            _logger = new utils.Logger(id, option),
            _plugins,
            _container,
            _wrapper,
            _nav,
            _im,
            _channels;

        EventDispatcher.call(this, 'UI', { id: id, logger: _logger }, utils.extendz({}, Event, NetStatusEvent, UIEvent, GlobalEvent, MouseEvent));

        function _init() {
            _this.id = id;
            _this.logger = _logger;
            _channels = {};
            _plugins = {};
        }

        _this.setup = async function (container, config) {
            _container = container;
            _parseConfig(config);

            _nav = new UI.components.Tab('nav', 'Tab', _logger);
            _nav.addGlobalListener(_this.forward);

            _wrapper = utils.createElement('div', CLASS_WRAPPER + ' im-ui-' + _this.config.skin);
            _wrapper.appendChild(_nav.element());
            _container.appendChild(_wrapper);

            _im = IM.get(_this.id, _logger);
            _im.addEventListener(Event.BIND, _onBind);
            _im.addEventListener(Event.READY, _onReady);
            _im.addEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            _im.addEventListener(Event.CLOSE, _onClose);

            _buildPlugins();
            _setupPlugins();
            _this.resize();

            try {
                await _im.setup(_this.config);
            } catch (err) {
                _logger.error(`Failed to setup: ${err}`);
                return Promise.reject(err);
            }
            window.addEventListener('resize', _this.resize);
            return Promise.resolve();
        };

        function _onBind(e) {
            _this.config = _im.config;
            _this.join = _im.join;
            _this.leave = _im.leave;
            _this.send = _im.send;
            _this.call = _im.call;
            _this.sendUserControl = _im.sendUserControl;
            _this.state = _im.state;
            _this.close = _im.close;
            _this.forward(e);
        }

        function _onReady(e) {
            _onStateChange(e);
        }

        function _parseConfig(config) {
            if (utils.typeOf(config.plugins) !== 'array') {
                config.plugins = [];
            }

            var plugins = [];
            for (var i = 0; i < _default.plugins.length; i++) {
                var plugin = _default.plugins[i];
                var def = plugin.prototype.CONF;
                var cfg = (function (kind) {
                    for (var j = 0; j < config.plugins.length; j++) {
                        var item = config.plugins[j];
                        if (item.kind === kind) {
                            return item;
                        }
                    }
                    return null;
                })(plugin.prototype.kind);
                plugins.push(utils.extendz({}, def, cfg));
            }

            _this.config = utils.extendz({ id: _this.id }, IM.prototype.CONF, _default, config);
            _this.config.plugins = plugins;
        }

        function _buildPlugins() {
            utils.forEach(_this.config.plugins, function (i, config) {
                if (utils.typeOf(UI[config.kind]) !== 'function') {
                    _logger.error('Unrecognized plugin: index=' + i + ', kind=' + config.kind + '.');
                    return;
                }
                if (config.visibility === false) {
                    _logger.log('Component ' + config.kind + ' is disabled.');
                    return;
                }

                try {
                    var plugin = new UI[config.kind](_im, config, _logger);
                    if (utils.typeOf(plugin.addGlobalListener) === 'function') {
                        plugin.addGlobalListener(_onPluginEvent);
                    }
                    _nav.insert(config.kind.toLowerCase(), '', plugin.element());
                    _plugins[config.kind] = plugin;
                } catch (err) {
                    _logger.error('Failed to initialize plugin: index=' + i + ', kind=' + config.kind + '. Error=' + err.message);
                }
            });
        }

        function _setupPlugins() {
            _wrapper.setAttribute('state', '');
        }

        function _onPluginEvent(e) {
            switch (e.type) {
                case GlobalEvent.CHANGE:
                    _onChange(e);
                    break;
                default:
                    _this.forward(e);
                    break;
            }
        }

        function _onChange(e) {
            _this.forward(e);
        }

        function _onStatus(e) {
            var level = e.data.level;
            var code = e.data.code;
            var description = e.data.description;
            var info = e.data.info;
            var method = { status: 'debug', warning: 'warn', error: 'error' }[level] || 'debug';
            _logger[method](`onStatus: level=${level}, code=${code}, description=${description}, info=`, info);

            switch (code) {
                case Code.NETCONNECTION_CONNECT_SUCCESS:
                    break;
                case Code.NETGROUP_CONNECT_SUCCESS:
                    _channels[info.chan.id] = info.chan;
                    break;
                case Code.NETGROUP_SENDTO_NOTIFY:
                case Code.NETGROUP_POSTING_NOTIFY:
                    break;
            }
            _this.forward(e);
        }

        function _onClose(e) {
            _logger.log(`onClose: ${e.data.reason}`);
            _this.close(e.data.reason);
            _this.forward(e);
        }

        function _onStateChange(e) {
            _wrapper.setAttribute('state', e.type);

            _this.resize();
            _this.forward(e);
        }

        _this.resize = function () {
            var width = _wrapper.clientWidth;
            var height = _wrapper.clientHeight;
            utils.forEach(_plugins, function (kind, plugin) {
                plugin.resize(width, height);
            });
            _this.dispatchEvent(UIEvent.RESIZE, { width: width, height: height });
        };

        _this.destroy = function () {
            if (_im) {
                _im.close();
                _im.removeEventListener(Event.BIND, _onBind);
                _im.removeEventListener(Event.READY, _onReady);
                _im.removeEventListener(NetStatusEvent.NET_STATUS, _onStatus);
                _im.removeEventListener(Event.CLOSE, _onClose);
                _container.innerHTML = '';
            }
            delete _instances[_this.id];
        };

        _init();
    }

    UI.prototype = Object.create(EventDispatcher.prototype);
    UI.prototype.constructor = UI;
    UI.prototype.CONF = _default;

    UI.register = function (plugin, index) {
        try {
            _default.plugins.splice(index || _default.plugins.length, 0, plugin);
            UI[plugin.prototype.kind] = plugin;
        } catch (err) {
            _logger.error('Failed to register plugin ' + plugin.prototype.kind + ', Error=' + err.message);
        }
    };

    UI.get = function (id, option) {
        if (id == null) {
            id = 0;
        }

        var ui = _instances[id];
        if (ui === undefined) {
            ui = new UI(id, option);
            _instances[id] = ui;
        }
        return ui;
    };

    UI.create = function (option) {
        return UI.get(_id++, option);
    };

    odd.im.ui = UI.get;
    odd.im.ui.create = UI.create;
    IM.UI = UI;
})(odd);

