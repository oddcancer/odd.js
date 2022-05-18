(function (odd) {
    var utils = odd.utils,
        css = utils.css,
        OS = odd.OS,
        Browser = odd.Browser,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        GlobalEvent = events.GlobalEvent,
        MouseEvent = events.MouseEvent,
        Player = odd.Player,
        UI = Player.UI,
        components = UI.components,

        CLASS_CONTROLBAR = 'pe-controlbar',
        CLASS_LEFT = 'pe-left',
        CLASS_CENTER = 'pe-center',
        CLASS_RIGHT = 'pe-right',
        CLASS_TOOLTIP = 'pe-tooltip',

        _regi = /\[([a-z]+)\:([a-z]+)=([^\]]+)?\]/gi,
        _default = {
            kind: 'Controlbar',
            layout: '[Slider:timebar=Preview]|[Button:play=Play][Button:pause=Pause][Button:reload=Reload][Button:stop=Stop][Label:quote=Live broadcast][Label:time=00:00/00:00]||[Button:report=Report][Button:capture=Capture][Button:download=Download][Button:mute=Mute][Button:unmute=Unmute][Slider:volumebar=80][Select:definition=Definition][Button:danmuoff=Danmu Off][Button:danmuon=Danmu On][Button:fullpage=Fullpage][Button:exitfullpage=Exit Fullpage][Button:fullscreen=Fullscreen][Button:exitfullscreen=Exit Fullscreen]',
            autohide: false,
            visibility: true,
        };

    function Controlbar(config, logger) {
        EventDispatcher.call(this, 'Controlbar', { logger: logger }, [GlobalEvent.CHANGE, MouseEvent.CLICK, MouseEvent.MOUSE_MOVE]);

        var _this = this,
            _logger = logger,
            _container,
            _content;

        function _init() {
            _this.config = config;
            _this.components = {};

            _container = utils.createElement('div', CLASS_CONTROLBAR);
            _content = utils.createElement('div');
            _container.appendChild(_content);
            _buildComponents();
            _setupComponents();
        }

        function _buildComponents() {
            var layouts = _this.config.layout.split('|');
            // TODO(spencer-lau): No limitation on chunk number
            if (layouts.length !== 4) {
                throw { name: 'DataError', message: 'Controlbar should have exactly 4 sections.' };
            }

            var left = utils.createElement('div', CLASS_LEFT);
            var center = utils.createElement('div', CLASS_CENTER);
            var right = utils.createElement('div', CLASS_RIGHT);

            utils.forEach([_content, left, center, right], function (i, container) {
                var arr;
                while ((arr = _regi.exec(layouts[i])) !== null) {
                    _buildComponent(container, arr[1], arr[2], arr[3]);
                }
            });

            _content.appendChild(left);
            _content.appendChild(center);
            _content.appendChild(right);
        }

        function _buildComponent(container, type, name, kind) {
            var component,
                element;

            switch (name) {
                case 'capture':
                    if (OS.isIOS && !Browser.isSafari) {
                        return;
                    }
                    break;
                case 'mute':
                case 'unmute':
                case 'volumebar':
                    if (OS.isMobile) {
                        return;
                    }
                    break;
                case 'definition':
                    if (!_this.config.sources || _this.config.sources.length < 2) {
                        return;
                    }
                    break;
                case 'download':
                    if (!window.TransformStream) {
                        return;
                    }
                    break;
            }

            try {
                component = new components[type](name, kind, _logger);
                if (utils.typeOf(component.addGlobalListener) === 'function') {
                    component.addGlobalListener(_this.forward);
                    if (type === 'Slider') {
                        component.addEventListener(MouseEvent.MOUSE_MOVE, _onMouseMove);
                    }
                }
                element = component.element();
                container.appendChild(element);
                _this.components[name] = component;
            } catch (err) {
                _logger.error('Failed to initialize component: type=' + type + ', name=' + name + ', Error=' + err.message);
                return;
            }

            switch (name) {
                case 'quote':
                case 'time':
                case 'volumebar':
                    break;
                default:
                    if (kind !== undefined) {
                        var tooltip;
                        if (utils.typeOf(components[kind]) === 'function') {
                            tooltip = new components[kind](name, kind, _logger);
                            element.insertAdjacentElement('afterbegin', tooltip.element());
                        } else {
                            tooltip = utils.createElement('span', CLASS_TOOLTIP);
                            tooltip.innerHTML = kind;
                            element.insertAdjacentElement('afterbegin', tooltip);
                        }
                        component.tooltip = tooltip;
                    }
                    break;
            }
        }

        function _setupComponents() {
            var definition = _this.components['definition'];
            if (definition) {
                utils.forEach(_this.config.sources, function (i, item) {
                    definition.append(item.label);
                    if (item['default']) {
                        definition.value(i);
                    }
                });
            }
        }

        function _onMouseMove(e) {
            var element = e.target.element();
            var tooltip = e.target.nonius();
            var offset = element.clientWidth * e.data.value / 100 - tooltip.clientWidth / 2;

            switch (e.data.name) {
                case 'timebar':
                    e.target.thumb(e.data.value);
                    if (e.target.duration) {
                        var position = e.target.duration * e.data.value / 100;
                        e.target.value(utils.formatTime(position));
                    } else {
                        e.target.value('--:--');
                    }
                    break;
                case 'volumebar':
                    e.target.value(e.data.value | 0);
                    break;
            }

            var left = offset + element.offsetLeft;
            if (left < 1 && element.offsetParent === _content) {
                css.style(tooltip, {
                    'left': 1 - element.offsetLeft + 'px',
                    'right': 'auto',
                });
                return;
            }

            var right = element.offsetParent.offsetLeft + left + tooltip.clientWidth;
            if (right > _content.clientWidth - 1) {
                css.style(tooltip, {
                    'left': 'auto',
                    'right': element.offsetParent.offsetLeft + element.offsetLeft + element.clientWidth + 1 - _content.clientWidth + 'px',
                });
            } else {
                css.style(tooltip, {
                    'left': offset + 'px',
                    'right': 'auto',
                });
            }
        }

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {
            utils.forEach(_this.components, function (name, component) {
                component.resize(width, height);

                switch (name) {
                    case 'timebar':
                        break;
                    default:
                        if (component.tooltip === undefined) {
                            break;
                        }

                        var element = component.element();
                        var tooltip = component.tooltip;
                        var offset = (element.clientWidth - tooltip.clientWidth) / 2;

                        var left = offset + element.offsetLeft;
                        if (left < 1 && element.offsetParent === _content) {
                            css.style(tooltip, {
                                'left': 1 - element.offsetLeft + 'px',
                                'right': 'auto',
                            });
                            break;
                        }

                        // Skips element whose display == none
                        if (element.offsetParent === null) {
                            break;
                        }

                        var right = element.offsetParent.offsetLeft + left + tooltip.clientWidth;
                        if (right > _content.clientWidth - 1) {
                            css.style(tooltip, {
                                'left': 'auto',
                                'right': element.offsetParent.offsetLeft + element.offsetLeft + element.clientWidth + 1 - _content.clientWidth + 'px',
                            });
                        } else {
                            css.style(tooltip, {
                                'left': offset + 'px',
                                'right': 'auto',
                            });
                        }
                        break;
                }
            });
        };

        _init();
    }

    Controlbar.prototype = Object.create(EventDispatcher.prototype);
    Controlbar.prototype.constructor = Controlbar;
    Controlbar.prototype.kind = 'Controlbar';
    Controlbar.prototype.CONF = _default;

    UI.register(Controlbar);
})(odd);

