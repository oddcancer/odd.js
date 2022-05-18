(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        MouseEvent = events.MouseEvent,
        Player = odd.Player,
        UI = Player.UI,
        components = UI.components,

        CLASS_BUTTON = 'pe-button';

    function Button(name, kind, logger) {
        EventDispatcher.call(this, 'Button', { logger: logger }, [MouseEvent.CLICK]);

        var _this = this,
            _name,
            _logger = logger,
            _container;

        function _init() {
            _name = name;
            _container = utils.createElement('span', CLASS_BUTTON + ' ' + name);
            _container.addEventListener('click', _onClick);
        }

        function _onClick(e) {
            _this.dispatchEvent(MouseEvent.CLICK, { name: _name });
        }

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    Button.prototype = Object.create(EventDispatcher.prototype);
    Button.prototype.constructor = Button;
    Button.prototype.kind = 'Button';

    components.Button = Button;
})(odd);

