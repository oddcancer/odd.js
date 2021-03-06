(function (odd) {
    var utils = odd.utils,
        css = utils.css,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        MouseEvent = events.MouseEvent,
        IM = odd.IM,
        UI = IM.UI,
        components = UI.components,

        CLASS_TOOLBAR = 'im-toolbar',

        _regi = /\[([a-z]+)\:([a-z]+)=([^\]]+)?\]/gi,
        _default = {
            kind: 'Toolbar',
            layout: '[Select:emojipicker=]',
            emojis: [
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐ ', '๐ก', '๐ข', '๐ฃ', '๐ค', '๐ฅ', '๐ฆ', '๐ง',
                '๐จ', '๐ฉ', '๐ช', '๐ซ', '๐ฌ', '๐ญ', '๐ฎ', '๐ฏ',
                '๐ฐ', '๐ฑ', '๐ฒ', '๐ณ', '๐ด', '๐ต', '๐ถ', '๐ท',
                '๐ธ', '๐น', '๐บ', '๐ป', '๐ผ', '๐ฝ', '๐พ', '๐ฟ',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐ข', '๐ฒ',

                '๐ค', '๐ค', '๐ค', '๐ค', '๐ค', '๐ค', '๐ค', '๐ค',
                '๐ค', '๐ค', '๐ค', '๐ค', '๐ค ', '๐คก', '๐คข', '๐คฃ',
                '๐คค', '๐คฅ', '๐คฆ', '๐คง', '๐คจ', '๐คฉ', '๐คช', '๐คซ',
                '๐คฌ', '๐คญ', '๐คฎ', '๐คฏ', '๐ฅ', '๐ฅ', '๐ฅ', '๐ฅ',
                '๐ฅ', '๐ฅค', '๐ฆ', '๐ฆ', '๐ฆ', '๐ง',

                'โ', 'โก', 'โฝ', 'โพ', 'โ', 'โจ',

                '๐', '๐ถ', '๐ท', '๐ธ', '๐น', '๐บ', '๐ป', '๐ผ',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐ก', '๐ข', '๐ฃ', '๐ค', '๐ฆ', '๐ฉ', '๐ฌ',
                '๐ญ', '๐ฎ', '๐ฐ', '๐ถ', '๐ท', '๐ธ', '๐น', '๐บ',
                '๐ป', '๐ผ', '๐พ', '๐ฟ', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐ง',
                '๐ฉ', '๐ฌ', '๐ฎ', '๐ฑ', '๐ฒ', '๐ณ', '๐ต', '๐ถ',
                '๐ท', '๐ธ', '๐น', '๐บ', '๐ป', '๐ผ', '๐ฝ', '๐พ',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐ ', '๐ก',

                '๐ฃ', '๐จ', '๐ญ', '๐ฎ', '๐ฏ', '๐ฐ', '๐ฑ', '๐ฒ',
                '๐ณ', '๐ด', '๐ต', '๐ถ', '๐ท', '๐ธ', '๐น', '๐บ',
                '๐ป', '๐ผ', '๐ฝ', '๐ฟ', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐ ', '๐ก', '๐ข', '๐ป', '๐ฝ', '๐ฟ',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐', '๐', '๐', '๐',
                '๐', '๐', '๐', '๐', '๐ฃ', '๐ค', '๐ฉ', '๐ช',
                '๐ญ', '๐ฏ', '๐ฐ',

                '๐ฅ',
            ],
            visibility: true,
        };

    function Toolbar(config, logger) {
        EventDispatcher.call(this, 'Toolbar', { logger: logger }, [MouseEvent.CLICK]);

        var _this = this,
            _logger = logger,
            _container;

        function _init() {
            _this.config = config;
            _this.components = {};

            _container = utils.createElement('div', CLASS_TOOLBAR);

            _buildComponents();
            _setupComponents();
        }

        function _buildComponents() {
            var containers = [_container];

            var layouts = _this.config.layout.split('|');
            for (var i = 1; i < layouts.length; i++) {
                var container = utils.createElement('div');
                containers.push(container);
            }

            utils.forEach(containers, function (i, container) {
                var arr;
                while ((arr = _regi.exec(layouts[i])) !== null) {
                    _buildComponent(container, arr[1], arr[2], arr[3]);
                }
            });
        }

        function _buildComponent(container, type, name, kind) {
            var component,
                element;

            try {
                component = new components[type](name, kind, _logger);
                if (utils.typeOf(component.addGlobalListener) === 'function') {
                    component.addGlobalListener(_this.forward);
                }
                element = component.element();
                container.appendChild(element);
                _this.components[name] = component;
            } catch (err) {
                _logger.error('Failed to initialize component: type=' + type + ', name=' + name + ', Error=' + err.message);
                return;
            }
        }

        function _setupComponents() {
            var emojipicker = _this.components['emojipicker'];
            if (emojipicker) {
                utils.forEach(_this.config.emojis, function (i, item) {
                    emojipicker.append(item, item);
                });
            }
        }

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {
            utils.forEach(_this.components, function (name, component) {
                component.resize(width, height);
            });
        };

        _init();
    }

    Toolbar.prototype = Object.create(EventDispatcher.prototype);
    Toolbar.prototype.constructor = Toolbar;
    Toolbar.prototype.kind = 'Toolbar';
    Toolbar.prototype.CONF = _default;

    UI.register(Toolbar);
})(odd);

