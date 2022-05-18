(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Player = odd.Player,
        UI = Player.UI,

        CLASS_AD = 'pe-ad',

        _default = {
            kind: 'AD',
            visibility: true,
        };

    function AD(config, logger) {
        EventDispatcher.call(this, 'AD', { logger: logger });

        var _this = this,
            _logger = logger,
            _container;

        function _init() {
            _this.config = config;
            _container = utils.createElement('div', CLASS_AD);
        }

        _this.display = function (element) {
            _container.innerHTML = '';
            _container.appendChild(element);
        };

        _this.remove = function () {
            _container.innerHTML = '';
        };

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    AD.prototype = Object.create(EventDispatcher.prototype);
    AD.prototype.constructor = AD;
    AD.prototype.kind = 'AD';
    AD.prototype.CONF = _default;

    UI.register(AD);
})(odd);

