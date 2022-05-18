(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        MouseEvent = events.MouseEvent,
        Player = odd.Player,
        UI = Player.UI,
        components = UI.components,

        CLASS_TOOLTIP = 'pe-tooltip';

    function Preview(name, kind, logger) {
        EventDispatcher.call(this, 'Preview', { logger: logger }, [MouseEvent.CLICK]);

        var _this = this,
            _logger = logger,
            _container,
            _content;

        function _init() {
            _container = utils.createElement('div', CLASS_TOOLTIP + ' preview');
            _content = utils.createElement('div');
            _container.appendChild(_content);
        }

        _this.append = function (url, min, max) {
            var img = utils.createElement('img');
            img.setAttribute('min', min);
            img.setAttribute('max', max || NaN);
            img.src = url;
            _content.appendChild(img);
        };

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    Preview.prototype = Object.create(EventDispatcher.prototype);
    Preview.prototype.constructor = Preview;
    Preview.prototype.kind = 'Preview';

    components.Preview = Preview;
})(odd);

