(function (odd) {
    var utils = odd.utils,
        css = utils.css,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Player = odd.Player,
        UI = Player.UI,

        CLASS_LOGO = 'pe-logo',

        _default = {
            kind: 'Logo',
            file: 'https://www.oddcancer.com/image/odd-player-logo.png',
            link: 'https://www.oddcancer.com/product/player.html',
            cors: 'anonymous',   // anonymous, use-credentials
            target: '_blank',
            style: 'margin: 3% 5%; width: 36px; height: 36px; top: 0px; right: 0px;',
            visibility: true,
        };

    function Logo(config, logger) {
        EventDispatcher.call(this, 'Logo', { logger: logger });

        var _this = this,
            _logger = logger,
            _container,
            _logo,
            _img;

        function _init() {
            _this.config = config;
            _container = utils.createElement('div', CLASS_LOGO);
            _container.style = _this.config.style;
            _logo = utils.createElement('a');

            _img = new Image();
            _img.onload = _onLoad;
            _img.onabort = _onError;
            _img.onerror = _onError;
            _img.crossOrigin = _this.config.cors;
            _img.src = _this.config.file;
        }

        function _onLoad(e) {
            css.style(_container, {
                width: _img.width + 'px',
                height: _img.height + 'px',
            });
            css.style(_logo, {
                'background': 'url(' + _this.config.file + ')',
            });

            _logo.href = _this.config.link;
            _logo.target = _this.config.target;
            _container.appendChild(_logo);
        }

        function _onError(e) {
            _logger.log('Failed to load logo "' + _img.src + '".');
        }

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    Logo.prototype = Object.create(EventDispatcher.prototype);
    Logo.prototype.constructor = Logo;
    Logo.prototype.kind = 'Logo';
    Logo.prototype.CONF = _default;

    UI.register(Logo);
})(odd);

