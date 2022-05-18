(function (odd) {
    var utils = odd.utils,
        css = utils.css,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        UIEvent = events.UIEvent,
        Player = odd.Player,
        UI = Player.UI,

        CLASS_DANMU = 'pe-danmu',
        CLASS_DANMU_ITEM = 'pe-danmu-item',

        _default = {
            kind: 'Danmu',
            speed: 100,
            lineHeight: 32,
            enable: true,
            visibility: true,
        };

    function Danmu(config, logger) {
        EventDispatcher.call(this, 'Danmu', { logger: logger }, [UIEvent.SHOOTING]);

        var _this = this,
            _logger = logger,
            _container,
            _content;

        function _init() {
            _this.config = config;

            _container = utils.createElement('div', CLASS_DANMU);
            _content = utils.createElement('div');
            _container.appendChild(_content);
        }

        _this.enable = function (enable) {
            if (utils.typeOf(enable) === 'boolean') {
                _this.config.enable = enable;
            }
            return _this.config.enable;
        };

        _this.shoot = function (text, data) {
            if (!_this.config.enable) {
                return;
            }

            var item = utils.createElement('div', CLASS_DANMU_ITEM);
            item.addEventListener('transitionend', _onTransitionEnd);
            item.innerHTML = text;
            _content.appendChild(item);

            var offset = _container.clientWidth + item.clientWidth;
            css.style(item, utils.extendz({}, data, {
                top: _getRowIndex(item.clientWidth) * _this.config.lineHeight + 'px',
                left: _container.clientWidth + 'px',
                transform: 'translateX(-' + offset + 'px)',
                transition: 'transform ' + (offset / _this.config.speed) + 's linear 0s',
            }));
        };

        function _onTransitionEnd(e) {
            _content.removeChild(e.target);
        }

        function _getRowIndex(width) {
            var rows = Math.floor(_container.clientHeight / _this.config.lineHeight);
            var index = Math.floor(Math.random() * rows);
            return index;
        }

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    Danmu.prototype = Object.create(EventDispatcher.prototype);
    Danmu.prototype.constructor = Danmu;
    Danmu.prototype.kind = 'Danmu';
    Danmu.prototype.CONF = _default;

    UI.register(Danmu);
})(odd);

