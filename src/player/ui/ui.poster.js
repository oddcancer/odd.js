(function (odd) {
    var utils = odd.utils,
        css = utils.css,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Player = odd.Player,
        UI = Player.UI,

        CLASS_POSTER = 'pe-poster',

        _default = {
            kind: 'Poster',
            file: 'image/poster.png',
            cors: 'anonymous',   // anonymous, use-credentials
            objectfit: 'fill',   // fill, contain, cover, none, scale-down
            visibility: true,
        };

    function Poster(config, logger) {
        EventDispatcher.call(this, 'Poster', { logger: logger });

        var _this = this,
            _logger = logger,
            _container,
            _img;

        function _init() {
            _this.config = config;
            _container = utils.createElement('div', CLASS_POSTER);

            _img = new Image();
            _img.onload = _onLoad;
            _img.onabort = _onError;
            _img.onerror = _onError;
            if (_this.config.objectfit) {
                css.style(_img, {
                    'object-fit': _this.config.objectfit,
                });
            }
            _img.crossOrigin = _this.config.cors;
            _img.src = _this.config.file;
        }

        function _onLoad(e) {
            _container.appendChild(_img);
        }

        function _onError(e) {
            _logger.log('Failed to load poster "' + _img.src + '".');
        }

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    Poster.prototype = Object.create(EventDispatcher.prototype);
    Poster.prototype.constructor = Poster;
    Poster.prototype.kind = 'Poster';
    Poster.prototype.CONF = _default;

    UI.register(Poster);
})(odd);

