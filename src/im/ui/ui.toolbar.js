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
                '😀', '😁', '😂', '😃', '😄', '😅', '😆', '😇',
                '😈', '😉', '😊', '😋', '😌', '😍', '😎', '😏',
                '😐', '😑', '😒', '😓', '😔', '😕', '😖', '😗',
                '😘', '😙', '😚', '😛', '😜', '😝', '😞', '😟',
                '😠', '😡', '😢', '😣', '😤', '😥', '😦', '😧',
                '😨', '😩', '😪', '😫', '😬', '😭', '😮', '😯',
                '😰', '😱', '😲', '😳', '😴', '😵', '😶', '😷',
                '😸', '😹', '😺', '😻', '😼', '😽', '😾', '😿',
                '🙀', '🙁', '🙂', '🙃', '🙄', '🙅', '🙆', '🙇',
                '🙈', '🙉', '🙊', '🙋', '🙌', '🙍', '🙎', '🙏',
                '🚀', '🚁', '🚂', '🚃', '🚄', '🚅', '🚋', '🚌',
                '🚑', '🚓', '🚗', '🚙', '🚢', '🚲',

                '🤐', '🤑', '🤒', '🤓', '🤔', '🤕', '🤖', '🤗',
                '🤛', '🤜', '🤝', '🤟', '🤠', '🤡', '🤢', '🤣',
                '🤤', '🤥', '🤦', '🤧', '🤨', '🤩', '🤪', '🤫',
                '🤬', '🤭', '🤮', '🤯', '🥀', '🥇', '🥈', '🥉',
                '🥎', '🥤', '🦉', '🦊', '🦋', '🧐',

                '☕', '⚡', '⚽', '⚾', '✌', '✨',

                '🌂', '🌶', '🌷', '🌸', '🌹', '🌺', '🌻', '🌼',
                '🍄', '🍅', '🍆', '🍇', '🍈', '🍉', '🍊', '🍋',
                '🍌', '🍍', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓',
                '🍔', '🍕', '🍖', '🍗', '🍚', '🍜', '🍝', '🍞',
                '🍟', '🍡', '🍢', '🍣', '🍤', '🍦', '🍩', '🍬',
                '🍭', '🍮', '🍰', '🍶', '🍷', '🍸', '🍹', '🍺',
                '🍻', '🍼', '🍾', '🍿', '🎀', '🎁', '🎂', '🎃',
                '🎄', '🎅', '🎆', '🎈', '🎉', '🎓', '🎖', '🎧',
                '🎩', '🎬', '🎮', '🎱', '🎲', '🎳', '🎵', '🎶',
                '🎷', '🎸', '🎹', '🎺', '🎻', '🎼', '🎽', '🎾',
                '🏀', '🏂', '🏃', '🏄', '🏅', '🏆', '🏇', '🏈',
                '🏉', '🏊', '🏋', '🏌', '🏍', '🏎', '🏏', '🏐',
                '🏓', '🏘', '🏠', '🏡',

                '🐣', '🐨', '🐭', '🐮', '🐯', '🐰', '🐱', '🐲',
                '🐳', '🐴', '🐵', '🐶', '🐷', '🐸', '🐹', '🐺',
                '🐻', '🐼', '🐽', '🐿', '👁', '👂', '👃', '👄',
                '👅', '👆', '👇', '👈', '👉', '👊', '👋', '👌',
                '👍', '👎', '👏', '👐', '👑', '👓', '👔', '👕',
                '👖', '👗', '👘', '👙', '👚', '👛', '👜', '👝',
                '👞', '👟', '👠', '👡', '👢', '👻', '👽', '👿',
                '💀', '💁', '💂', '💃', '💄', '💅', '💆', '💇',
                '💉', '💊', '💋', '💌', '💍', '💎', '💔', '💕',
                '💖', '💗', '💘', '💝', '💣', '💤', '💩', '💪',
                '💭', '💯', '💰',

                '🔥',
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

