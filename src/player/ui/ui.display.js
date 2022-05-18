(function (odd) {
    var utils = odd.utils,
        css = utils.css,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        MouseEvent = events.MouseEvent,
        TimerEvent = events.TimerEvent,
        Player = odd.Player,
        UI = Player.UI,
        components = UI.components,

        CLASS_DISPLAY = 'pe-display',

        _regi = /\[([a-z]+)\:([a-z]+)=([^\]]+)?\]/gi,
        _default = {
            kind: 'Display',
            layout: '[Button:play=][Button:waiting=][Label:error=][Panel:info=][Panel:stats=]',
            ondoubleclick: 'fullscreen', // fullpage, fullscreen
            visibility: true,
        };

    function Display(config, logger) {
        EventDispatcher.call(this, 'Display', { logger: logger }, [MouseEvent.CLICK]);

        var _this = this,
            _logger = logger,
            _container,
            _content,
            _timer,
            _timestamp;

        function _init() {
            _this.config = config;
            _this.components = {};

            _container = utils.createElement('div', CLASS_DISPLAY);
            _content = utils.createElement('div');
            _content.addEventListener('click', _onClick);
            _container.appendChild(_content);
            _buildComponents();

            _timer = new utils.Timer(80, 0, _logger);
            _timer.addEventListener(TimerEvent.TIMER, _onTimer);
            _timestamp = 0;
        }

        function _buildComponents() {
            var arr;
            while ((arr = _regi.exec(_this.config.layout)) !== null) {
                _buildComponent(_content, arr[1], arr[2], arr[3]);
            }
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

        _this.state = function (state) {
            switch (state) {
                case Event.WAITING:
                    _timer.start();
                    break;
                default:
                    _timer.stop();
                    break;
            }
            if (state !== Event.ERROR) {
                _this.error();
            }
        };

        _this.error = function (err) {
            var error = _this.components['error'];
            if (error) {
                if (!err) {
                    error.text('');
                    return;
                }

                err.name = err.name || 'UnknownError';
                err.message = err.message || 'An unknown error occurred.';
                error.text(err.name + ': ' + err.message);
            }
        };

        _this.update = function (name, data) {
            var panel = _this.components[name];
            if (panel) {
                panel.update(data);
            }
        };

        _this.clear = function (name) {
            var panel = _this.components[name];
            if (panel) {
                panel.clear();
            }
        };

        _this.show = function (name) {
            utils.forEach(_this.components, function (key, component) {
                if (component.kind === 'Panel' && key !== name) {
                    component.hide();
                }
            });
            var panel = _this.components[name];
            if (panel) {
                panel.show();
            }
        };

        _this.hide = function (name) {
            var panel = _this.components[name];
            if (panel) {
                panel.hide();
            }
        };

        function _onTimer(e) {
            var angle = _timer.currentCount() * 30 % 360;
            var icon = _this.components['waiting'];
            if (icon) {
                css.style(icon.element(), {
                    filter: 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + angle * Math.PI / 180 + ')',
                    'transform': 'rotate(' + angle + 'deg)',
                    '-o-transform': 'rotate(' + angle + 'deg)',
                    '-ms-transform': 'rotate(' + angle + 'deg)',
                    '-moz-transform': 'rotate(' + angle + 'deg)',
                    '-webkit-transform': 'rotate(' + angle + 'deg)'
                });
            }
        }

        function _onClick(e) {
            var time = new Date().getTime();
            if (time <= _timestamp + 700) {
                _timestamp = 0; // Avoid triple click
                _this.dispatchEvent(MouseEvent.DOUBLE_CLICK, { name: _this.config.ondoubleclick });
                return;
            }
            _timestamp = time;
        }

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    Display.prototype = Object.create(EventDispatcher.prototype);
    Display.prototype.constructor = Display;
    Display.prototype.kind = 'Display';
    Display.prototype.CONF = _default;

    UI.register(Display);
})(odd);

