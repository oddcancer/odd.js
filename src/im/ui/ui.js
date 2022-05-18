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
        MouseEvent = events.MouseEvent,
        TimerEvent = events.TimerEvent,
        IM = odd.IM,
        Command = IM.Message.Command,
        UserControl = IM.Message.UserControl,

        CLASS_WRAPPER = 'im-wrapper',
        CLASS_CONTENT = 'im-content',
        CLASS_CONTENT_TIME = 'im-content-time',
        CLASS_CONTENT_ITEM = 'im-content-item',
        CLASS_LEVEL = 'im-level',
        CLASS_BADGE = 'im-badge',
        CLASS_NICK = 'im-nick',
        CLASS_SEPARATOR = 'im-separator',
        CLASS_BODY = 'im-body',

        _id = 0,
        _instances = {},
        // &#x1F000;-&#x1F3FF; | &#x1F400;-&#x1F64F;&#x1F680;-&#x1F6FF; | &#x1F900;-&#x1F9FF; | &#x231A;-&#x3299;
        _regi = /(\uD83C[\uDC00-\uDFFF])|(\uD83D[\uDC00-\uDE4F\uDE80-\uDEFF])|(\uD83E[\uDD00-\uDDFF])|([\u231A-\u3299])/gi,
        _default = {
            chan: '001',
            maxRetries: 0, // maximum number of retries while some types of error occurs. -1 means always
            retryIn: 1000 + Math.random() * 2000, // ms. retrying interval
            skin: 'classic',
            plugins: [],
        };

    function UI(id, option) {
        var _this = this,
            _logger = new utils.Logger(id, option),
            _plugins,
            _container,
            _wrapper,
            _content,
            _im,
            _timestamp,
            _timer,
            _retried;

        EventDispatcher.call(this, 'UI', { id: id, logger: _logger }, utils.extendz({}, Event, NetStatusEvent, UIEvent, MouseEvent));

        function _init() {
            _this.id = id;
            _this.logger = _logger;
            _timestamp = 0;
            _retried = 0;
            _plugins = {};
        }

        _this.setup = async function (container, config) {
            _container = container;
            _parseConfig(config);

            _wrapper = utils.createElement('div', CLASS_WRAPPER + ' im-ui-' + _this.config.skin);
            _content = utils.createElement('div', CLASS_CONTENT);
            _wrapper.appendChild(_content);
            _container.appendChild(_wrapper);

            _im = IM.get(_this.id, _logger);
            _im.addEventListener(Event.BIND, _onBind);
            _im.addEventListener(Event.READY, _onReady);
            _im.addEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            _im.addEventListener(Event.CLOSE, _onClose);

            _timer = new utils.Timer(_this.config.retryIn, 1, _logger);
            _timer.addEventListener(TimerEvent.TIMER, _onTimer);

            _buildPlugins();
            _setupPlugins();
            _this.resize();
            return await _connect();
        };

        function _onBind(e) {
            _this.config = _im.config;
            _this.join = _im.join;
            _this.leave = _im.leave;
            _this.send = _im.send;
            _this.sendTo = _im.sendTo;
            _this.call = _im.call;
            _this.sendUserControl = _im.sendUserControl;
            _this.state = _im.state;
            _this.close = _im.close;
            _this.forward(e);
        }

        function _onReady(e) {
            _onStateChange(e);
        }

        async function _connect() {
            try {
                await _im.setup(_this.config);
            } catch (err) {
                _logger.error(`Failed to setup: ${err}`);
                return Promise.reject(err);
            }
            return await _im.join(_this.config.chan);
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
                if (config.kind === 'Controlbar' && !_this.config.file) {
                    config.sources = _this.config.sources;
                }

                try {
                    var plugin = new UI[config.kind](config, _logger);
                    if (utils.typeOf(plugin.addGlobalListener) === 'function') {
                        plugin.addGlobalListener(_onPluginEvent);
                    }
                    _wrapper.appendChild(plugin.element());
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
                case MouseEvent.CLICK:
                    _onClick(e);
                    break;
                default:
                    _this.forward(e);
                    break;
            }
        }

        function _onClick(e) {
            var h = {
                'emojipicker': _onEmojiPickerClick,
                'send': _onSendClick,
            }[e.data.name];
            if (h) {
                h(e);
            } else {
                _this.forward(e);
            }
        }

        function _onEmojiPickerClick(e) {
            var input = _plugins['Input'];
            if (input) {
                input.insert(e.data.value);
            }
        }

        function _onSendClick(e) {
            var input = _plugins['Input'];
            if (input) {
                var textarea = input.components['textarea'];
                var data = utils.trim(textarea.value);
                if (data) {
                    _im.send(_this.config.chan, data);
                }
                textarea.value = '';
            }
            var toolbar = _plugins['Toolbar'];
            if (toolbar) {
                var emojipicker = toolbar.components['emojipicker'];
                if (emojipicker) {
                    emojipicker.visibility('hidden');
                }
            }
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
                    _onTime(new Date().getTime());
                    break;
                case Code.NETGROUP_SENDTO_NOTIFY:
                case Code.NETGROUP_POSTING_NOTIFY:
                    switch (info.Info.type) {
                        case 'text':
                            _onText(info);
                            break;
                        default:
                            _logger.log(info.Info);
                            break;
                    }
                    break;
            }
            _this.forward(e);
        }

        function _onTime(timestamp) {
            var date = new Date();
            date.setTime(timestamp);
            var time = utils.date2string(date);

            var last = _content.lastChild;
            if (last && last.className === CLASS_CONTENT_TIME) {
                last.innerHTML = time;
                return;
            }
            var item = utils.createElement('div', CLASS_CONTENT_TIME);
            item.innerHTML = time;
            _content.appendChild(item);
        }

        function _onText(m) {
            if (m.Timestamp - _timestamp >= 300) { // 5 minutes
                _onTime(m.Timestamp * 1000);
                _timestamp = m.Timestamp;
            }

            var info = m.Info;
            var user = info.user;
            _logger.log(`[${info.chan}] ${user.nick}: ${info.text}`);

            var item = utils.createElement('div', CLASS_CONTENT_ITEM);
            if (info.user.level) {
                var span = utils.createElement('span', CLASS_LEVEL + ' ' + info.user.level);
                span.innerHTML = info.user.level;
                item.appendChild(span);
            }
            if (info.user.badges) {
                for (var i = 0; i < info.user.badges.length; i++) {
                    var span = utils.createElement('span', CLASS_BADGE);
                    span.innerHTML = info.user.badges[i];
                    item.appendChild(span);
                }
            }
            var nick = utils.createElement('span', CLASS_NICK);
            nick.innerHTML = info.user.nick;
            item.appendChild(nick);

            var separator = utils.createElement('span', CLASS_SEPARATOR);
            separator.innerHTML = ':';
            item.appendChild(separator);

            var body = utils.createElement('span', CLASS_BODY);
            body.innerHTML = info.text.replace(_regi, '<span class="im-emoji">$&</span>');
            item.appendChild(body);
            _content.appendChild(item);
        }

        function _onClose(e) {
            _logger.log(`onClose: ${e.data.reason}`);
            _this.close(e.data.reason);
            _this.forward(e);

            if (_retried++ < _this.config.maxRetries || _this.config.maxRetries === -1) {
                _logger.debug('Retrying...');
                _timer.start();
            }
        }

        async function _onTimer(e) {
            await _connect();
        }

        function _onStateChange(e) {
            _wrapper.setAttribute('state', e.type);

            _this.resize();
            _this.forward(e);
        }

        _this.resize = function () {
            var width = _content.clientWidth;
            var height = _content.clientHeight;
            utils.forEach(_plugins, function (kind, plugin) {
                plugin.resize(width, height);
            });
            _this.dispatchEvent(UIEvent.RESIZE, { width: width, height: height });
        };

        _this.destroy = function () {
            _timer.reset();
            if (_im) {
                _im.destroy();
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

