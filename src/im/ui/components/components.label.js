(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        IM = odd.IM,
        UI = IM.UI,
        components = UI.components,

        CLASS_LABEL = 'im-label';

    function Label(name, kind, logger) {
        EventDispatcher.call(this, 'Label', { logger: logger });

        var _this = this,
            _name,
            _kind,
            _logger = logger,
            _container;

        function _init() {
            _name = name;
            _kind = kind || '';
            _container = utils.createElement('span', CLASS_LABEL + ' ' + name);
            _container.innerHTML = _kind;
        }

        _this.text = function (text) {
            if (text !== undefined) {
                _container.innerHTML = text;
            }
            return _container.innerHTML;
        };

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    Label.prototype = Object.create(EventDispatcher.prototype);
    Label.prototype.constructor = Label;
    Label.prototype.kind = 'Label';

    components.Label = Label;
})(odd);

