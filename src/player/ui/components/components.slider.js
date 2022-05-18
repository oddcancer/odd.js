(function (odd) {
    var utils = odd.utils,
        Browser = odd.Browser,
        css = utils.css,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        GlobalEvent = events.GlobalEvent,
        MouseEvent = events.MouseEvent,
        Player = odd.Player,
        UI = Player.UI,
        components = UI.components,

        CLASS_SLIDER = 'pe-slider',
        CLASS_SLIDER_CONTENT = 'pe-slider-content',
        CLASS_TOOLTIP = 'pe-tooltip',
        CLASS_SLIDER_RAIL = 'pe-slider-rail',
        CLASS_SLIDER_THUMB = 'pe-slider-thumb',

        HORIZONTAL = 'horizontal',
        VERTICAL = 'vertical';

    function Slider(name, kind, logger) {
        EventDispatcher.call(this, 'Slider', { logger: logger }, [GlobalEvent.CHANGE, MouseEvent.MOUSE_MOVE]);

        var _this = this,
            _name,
            _logger = logger,
            _direction,
            _active,
            _container,
            _content,
            _tooltip,
            _background,
            _progress,
            _position,
            _thumb;

        function _init() {
            _name = name;
            _direction = HORIZONTAL;
            _active = false;

            _container = utils.createElement('div', CLASS_SLIDER + ' ' + _name);
            _content = utils.createElement('div', CLASS_SLIDER_CONTENT);
            _tooltip = utils.createElement('span', CLASS_TOOLTIP + ' value');
            _background = utils.createElement('span', CLASS_SLIDER_RAIL + ' background');
            _progress = utils.createElement('span', CLASS_SLIDER_RAIL + ' progress');
            _position = utils.createElement('span', CLASS_SLIDER_RAIL + ' position');
            _thumb = utils.createElement('span', CLASS_SLIDER_THUMB);
            _thumb.innerHTML = '<span></span>';
            _content.appendChild(_tooltip);
            _content.appendChild(_background);
            _content.appendChild(_progress);
            _content.appendChild(_position);
            _content.appendChild(_thumb);
            _container.appendChild(_content);

            switch (name) {
                case 'timebar':
                    _this.value('--:--');
                    break;
                case 'volumebar':
                    _this.value(kind);
                    _this.position(kind);
                    _this.thumb(kind);
                    break;
            }

            try {
                document.addEventListener('mousedown', _onMouseDown);
                document.addEventListener('mousemove', _onMouseMove);
                document.addEventListener('mouseup', _onMouseUp);
            } catch (err) {
                document.attachEvent('onmousedown', _onMouseDown);
                document.attachEvent('onmousemove', _onMouseMove);
                document.attachEvent('onmouseup', _onMouseUp);
            }
        }

        _this.value = function (value) {
            if (value !== undefined) {
                _tooltip.innerHTML = value;
            }

            return _tooltip.innerHTML;
        };

        _this.progress = function (value) {
            css.style(_progress, {
                'width': value + '%',
            });
        };

        _this.position = function (value) {
            _container.setAttribute('value', value);
            css.style(_position, {
                'width': value + '%',
            });
        };

        _this.thumb = function (value) {
            css.style(_thumb, {
                'left': value + '%',
            });
        };

        function _onMouseDown(e) {
            if (e.button !== (Browser.isIE8 ? 1 : 0)) {
                return;
            }

            if (!e.target) {
                e.target = e.srcElement;
            }
            if (_content !== e.target &&
                _content !== e.target.parentNode &&
                _content !== e.target.parentNode.parentNode) {
                return;
            }

            var value = _getValue(e.clientX, e.clientY);
            if (value !== _container.getAttribute('value')) {
                _this.dispatchEvent(GlobalEvent.CHANGE, { name: _name, value: value });
            }

            _active = true;
        }

        function _onMouseMove(e) {
            var value = _getValue(e.clientX, e.clientY);
            if (_content === e.target ||
                _content === e.target.parentNode ||
                _content === e.target.parentNode.parentNode) {
                _this.dispatchEvent(MouseEvent.MOUSE_MOVE, { name: _name, value: value });
            }

            if (!_active) {
                return;
            }

            if (value !== _container.getAttribute('value')) {
                _this.dispatchEvent(GlobalEvent.CHANGE, { name: _name, value: value });
            }
        }

        function _onMouseUp(e) {
            if (!_active) {
                return;
            }

            var value = _getValue(e.clientX, e.clientY);
            if (value !== _container.getAttribute('value')) {
                _this.dispatchEvent(GlobalEvent.CHANGE, { name: _name, value: value });
            }

            _active = false;
        }

        function _getValue(x, y) {
            var offsetX, offsetY, value;

            offsetX = x;
            offsetY = y;
            for (var node = _content; node; node = node.offsetParent) {
                offsetX -= node.offsetLeft;
                offsetY -= node.offsetTop;
            }

            if (_direction === HORIZONTAL) {
                value = (offsetX / _content.clientWidth * 100).toFixed(3);
            } else {
                value = (offsetY / _content.clientHeight * 100).toFixed(3);
            }

            value = Math.max(0, Math.min(value, 100));
            return value;
        }

        _this.element = function () {
            return _container;
        };

        _this.nonius = function () {
            return _tooltip;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    Slider.prototype = Object.create(EventDispatcher.prototype);
    Slider.prototype.constructor = Slider;
    Slider.prototype.kind = 'Slider';
    Slider.HORIZONTAL = HORIZONTAL;
    Slider.VERTICAL = VERTICAL;

    components.Slider = Slider;
})(odd);

