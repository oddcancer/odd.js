(function (odd) {
    var utils = odd.utils,
        css = utils.css,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        MouseEvent = events.MouseEvent,
        IM = odd.IM,
        UI = IM.UI,

        CLASS_INPUT = 'im-input',
        CLASS_BUTTON = 'im-button'

    _default = {
        kind: 'Input',
        label: 'Send',
        maxlength: 500,
        visibility: true,
    };

    function Input(config, logger) {
        EventDispatcher.call(this, 'Input', { logger: logger });

        var _this = this,
            _logger = logger,
            _container,
            _textarea,
            _button;

        function _init() {
            _this.config = config;
            _this.components = {};

            _container = utils.createElement('div', CLASS_INPUT);

            _textarea = utils.createElement('textarea');
            if (_this.config.maxlength) {
                _textarea.setAttribute('maxlength', _this.config.maxlength);
            }
            _textarea.addEventListener('keypress', _onKeyPress);
            _container.appendChild(_textarea);
            _this.components['textarea'] = _textarea;

            _button = utils.createElement('span', CLASS_BUTTON);
            _button.addEventListener('click', _onClick);
            _button.innerHTML = _this.config.label;
            _container.appendChild(_button);
            _this.components['send'] = _button;
        }

        function _onKeyPress(e) {
            if (e.keyCode === 13) {
                if (e.ctrlKey) {
                    _this.insert('\r\n');
                    return;
                }
                _this.dispatchEvent(MouseEvent.CLICK, { name: 'send' });
                if (window.event) {
                    e.returnValue = false;
                } else {
                    e.preventDefault();
                }
            }
        }

        function _onClick(e) {
            _this.dispatchEvent(MouseEvent.CLICK, { name: 'send' });
        }

        _this.insert = function (data) {
            var scrollTop = _textarea.scrollTop;
            var start = _textarea.selectionStart;
            var end = _textarea.selectionEnd;
            _textarea.value = _textarea.value.substring(0, start) + data + _textarea.value.substring(end, _textarea.value.length);
            if (scrollTop) {
                _textarea.scrollTop = scrollTop;
            }
            _textarea.focus();
            _textarea.selectionStart = start + data.length;
            _textarea.selectionEnd = start + data.length;
        };

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    Input.prototype = Object.create(EventDispatcher.prototype);
    Input.prototype.constructor = Input;
    Input.prototype.kind = 'Input';
    Input.prototype.CONF = _default;

    UI.register(Input);
})(odd);

