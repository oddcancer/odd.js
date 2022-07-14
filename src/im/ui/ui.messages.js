(function (odd) {
    var utils = odd.utils,
        css = utils.css,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        NetStatusEvent = events.NetStatusEvent,
        GlobalEvent = events.GlobalEvent,
        MouseEvent = events.MouseEvent,
        Level = events.Level,
        Code = events.Code,
        IM = odd.IM,
        UI = IM.UI,
        components = UI.components,

        CLASS_MESSAGES = 'im-messages',
        CLASS_SELECTOR = 'im-selector',
        CLASS_AVATAR = 'im-avatar',
        CLASS_CONTENT = 'im-content',
        CLASS_FLEX = 'im-flex',
        CLASS_TITLE = 'im-title',
        CLASS_MUTED = 'im-muted',
        CLASS_CLAMP = 'im-clamp',
        CLASS_BADGE = 'im-badge',

        _regi = /\[([a-z]+)\:([a-z]+)=([^\]]+)?\]/gi,
        _default = {
            kind: 'Messages',
            layout: '',
            dialog: components.Dialog.prototype.CONF,
            visibility: true,
        };

    function Selector(config, logger) {
        EventDispatcher.call(this, 'Selector', { logger: logger });

        var _this = this,
            _logger = logger,
            _container,
            _content,
            _line1,
            _line2,
            _title,
            _muted,
            _clamp,
            _badge;

        function _init() {
            _this.config = config;

            _container = utils.createElement('span', CLASS_SELECTOR);
            if (_this.config.avatar) {
                var avatar = utils.createElement('img', CLASS_AVATAR);
                avatar.src = _this.config.avatar;
                _container.appendChild(avatar);
            }
            _content = utils.createElement('div', CLASS_CONTENT);

            _line1 = utils.createElement('div', CLASS_FLEX);
            _title = utils.createElement('h5', CLASS_TITLE);
            _muted = utils.createElement('span', CLASS_MUTED);
            _line1.appendChild(_title);
            _line1.appendChild(_muted);

            _line2 = utils.createElement('div', CLASS_FLEX);
            _clamp = utils.createElement('div', CLASS_CLAMP);
            _badge = utils.createElement('span', CLASS_BADGE);
            _line2.appendChild(_clamp);
            _line2.appendChild(_badge);

            _content.appendChild(_line1);
            _content.appendChild(_line2);
            _container.appendChild(_content);
        }

        _this.title = function (text) {
            if (text !== undefined) {
                _title.innerHTML = text;
            }
            return _title.innerHTML;
        };

        _this.muted = function (timestamp) {
            if (timestamp !== undefined) {
                var curr = new Date();
                var date = new Date();
                date.setTime(timestamp);
                var text = utils.date2string(date);
                if (date.getFullYear() != curr.getFullYear()) {
                    var reg = /(\d+-\d+-\d+)\s\d+:\d+:\d+/gi;
                    _muted.innerHTML = reg.exec(text)[1];
                } else if (date.getMonth() != curr.getMonth() || date.getDate() != curr.getDate()) {
                    var reg = /\d+-(\d+-\d+)\s\d+:\d+:\d+/gi;
                    _muted.innerHTML = reg.exec(text)[1];
                } else {
                    var reg = /\d+-\d+-\d+\s(\d+:\d+):\d+/gi;
                    _muted.innerHTML = reg.exec(text)[1];
                }
            }
            return _muted.innerHTML;
        };

        _this.clamp = function (text) {
            if (text !== undefined) {
                _clamp.innerHTML = text;
            }
            return _clamp.innerHTML;
        };

        _this.badge = function (n) {
            if (n !== undefined) {
                _badge.innerHTML = n;
                css.style(_badge, {
                    'display': n > 1 ? 'block' : 'none',
                });
            }
            return _badge.innerHTML;
        };

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    function Messages(im, config, logger) {
        EventDispatcher.call(this, 'Messages', { logger: logger }, [MouseEvent.CLICK]);

        var _this = this,
            _im = im,
            _logger = logger,
            _container,
            _tab,
            _dialogs;

        function _init() {
            _this.config = config;
            _this.components = {};
            _dialogs = {};

            _container = utils.createElement('div', CLASS_MESSAGES);

            _tab = new UI.components.Tab('dialogs', 'Tab', _logger);
            _tab.addEventListener(GlobalEvent.CHANGE, _onChange);
            _container.appendChild(_tab.element());

            _im.addEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            _im.addEventListener(Event.CLOSE, _onClose);

            _buildComponents();
            _setupComponents();
        }

        function _buildComponents() {
            var containers = [_container];

            var layouts = _this.config.layout.split('|');
            for (var i = 1; i < layouts.length; i++) {
                var container = utils.createElement('div');
                containers.push(container);
            }
            utils.forEach(containers, function (i, container) {
                var arr;
                while ((arr = _regi.exec(layouts[i])) !== null) {
                    _buildComponent(container, arr[1], arr[2], arr[3]);
                }
            });
        }

        function _buildComponent(container, type, name, kind) {
            var component,
                element;

            try {
                component = new components[type](name, kind, _logger);
                if (utils.typeOf(component.addGlobalListener) === 'function') {
                    component.addGlobalListener(_this.forward);
                }
                element = component.element();
                container.appendChild(element);
                _this.components[name] = component;
            } catch (err) {
                _logger.error('Failed to initialize component: type=' + type + ', name=' + name + ', Error=' + err.message);
                return;
            }
        }

        function _setupComponents() {

        }

        function _onChange(e) {

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
                    _this.dialog(info.chan.id, info.chan, utils.extendz({}, _this.config.dialog, { cast: 'multi' }));
                    break;
                case Code.NETGROUP_SENDTO_NOTIFY:
                case Code.NETGROUP_POSTING_NOTIFY:
                    switch (info.Info.type) {
                        case 'text':
                            var id = info.Info.cast === 'uni' ? info.Info.user.id : info.Info.chan.id;
                            var card = info.Info.cast === 'uni' ? info.Info.user : info.Info.chan;
                            var dialog = _this.dialog(id, card, utils.extendz({}, _this.config.dialog, { cast: info.Info.cast }));
                            dialog.selector.muted(info.Timestamp * 1000);
                            dialog.selector.clamp(info.Info.text);
                            dialog.onText(info);
                            break;
                        default:
                            _logger.log(info.Info);
                            break;
                    }
                    break;
            }
            _this.forward(e);
        }

        function _onClose(e) {

        }

        _this.dialog = function (id, info, config) {
            var dialog = _dialogs[id];
            if (dialog == undefined) {
                var selector = new Selector({ avatar: info.icon }, _logger);
                selector.title(info.nick);

                dialog = new components.Dialog(_im, utils.extendz(config, { id: id }), _logger);
                dialog.addEventListener(MouseEvent.CLICK, _onClick);
                dialog.selector = selector;
                dialog.setTitle(info.nick);
                _dialogs[id] = dialog;

                _tab.insert(id, selector.element(), dialog.element());
                dialog.resize();
            }
            return dialog;
        };

        function _onClick(e) {
            switch (e.data.name) {
                case 'close':
                    _tab.active(-1);
                    break;
                case 'more':
                    break;
            }
        }

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {
            utils.forEach(_this.components, function (name, component) {
                component.resize(width, height);
            });
            utils.forEach(_dialogs, function (id, dialog) {
                dialog.resize(width, height);
            });
        };

        _init();
    }

    Messages.prototype = Object.create(EventDispatcher.prototype);
    Messages.prototype.constructor = Messages;
    Messages.prototype.kind = 'Messages';
    Messages.prototype.CONF = _default;

    UI.register(Messages);
})(odd);

