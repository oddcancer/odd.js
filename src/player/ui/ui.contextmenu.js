(function (odd) {
    var utils = odd.utils,
        Browser = odd.Browser,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        MouseEvent = events.MouseEvent,
        Player = odd.Player,
        UI = Player.UI,

        CLASS_CONTEXTMENU = 'pe-contextmenu',
        CLASS_CONTEXTMENU_ITEM = 'pe-contextmenu-item',
        CLASS_CONTEXTMENU_ITEM_ICON = 'pe-contextmenu-item-icon',
        CLASS_CONTEXTMENU_ITEM_TEXT = 'pe-contextmenu-item-text',
        CLASS_CONTEXTMENU_ITEM_SHORTCUT = 'pe-contextmenu-item-shortcut',

        _default = {
            kind: 'ContextMenu',
            items: [],
            visibility: true,
        };

    function ContextMenu(config, logger) {
        EventDispatcher.call(this, 'ContextMenu', { logger: logger }, [MouseEvent.CLICK]);

        var _this = this,
            _logger = logger,
            _container,
            _table;

        function _init() {
            _this.config = config;
            _this.config.items = [{
                id: 0,
                mode: 'featured', // '', featured, disable
                icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAA2UExURebm5ubm5ubm5ubm5ubm5ubm5ubm5kxpcebm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5rnvS8UAAAASdFJOU/9GGpAEVa0AOw0vovB5tnDaudiwhIIAAACiSURBVBjTXZHbAsQQDERDkQS97P//7GaibLfzgJxgIoiHVHIWvQPysRZylbpg2mhpSwOmgx46kkPf10KMoflewGqLLsNBugXVIDxuZhRuTGrJZmHIXhBuUEIuMC7pJ3I4R9nGyHzCY2eONmWHesMyoQyI3BXncRgZ1M+16zJCSbMRqyT4LriKt2calP9nWkMM7q+GcEo/OFvnGrDIo/Ov7/gCDPoHpWEsixcAAAAASUVORK5CYII=',
                text: 'odd.js/' + odd().version,
                shortcut: '',
                handler: function () { window.open('https://www.oddcancer.com/product/player.html'); },
            }].concat(utils.typeOf(config.items) === 'array' ? config.items : []);

            if (Browser.flash) {
                _this.config.items.push({
                    mode: '',
                    icon: '',
                    text: 'Flash Version ' + Browser.flash,
                    shortcut: '',
                    handler: function () { window.open('https://get.adobe.com/cn/flashplayer/about/'); },
                });
            }

            _this.config.items.push({
                mode: '',
                icon: '',
                text: 'Show Media Info',
                shortcut: '',
                handler: function () { _this.dispatchEvent(MouseEvent.CLICK, { name: 'info' }); },
            });
            _this.config.items.push({
                mode: '',
                icon: '',
                text: 'Show Media Stats',
                shortcut: '',
                handler: function () { _this.dispatchEvent(MouseEvent.CLICK, { name: 'stats' }); },
            });

            _container = utils.createElement('div', CLASS_CONTEXTMENU);
            _table = utils.createElement('table');
            _container.appendChild(_table);

            for (var i = 0; i < _this.config.items.length; i++) {
                var item = _this.config.items[i];
                var tr = utils.createElement('tr', CLASS_CONTEXTMENU_ITEM + (item.mode ? ' ' + item.mode : ''));
                tr.onmousedown = item.handler;

                var icon = utils.createElement('td');
                if (item.icon) {
                    var span = utils.createElement('span', CLASS_CONTEXTMENU_ITEM_ICON);
                    span.innerHTML = '<a style="background-image: url(' + item.icon + ');"></a>';
                    icon.appendChild(span);
                }

                var text = utils.createElement('td');
                if (item.text) {
                    var span = utils.createElement('span', CLASS_CONTEXTMENU_ITEM_TEXT);
                    span.innerHTML = item.text;
                    text.appendChild(span);
                }

                var shortcut = utils.createElement('td');
                if (item.shortcut) {
                    var span = utils.createElement('span', CLASS_CONTEXTMENU_ITEM_SHORTCUT);
                    span.innerHTML = item.shortcut;
                    shortcut.appendChild(span);
                }

                tr.appendChild(icon);
                tr.appendChild(text);
                tr.appendChild(shortcut);
                _table.appendChild(tr);
            }
        }

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    ContextMenu.prototype = Object.create(EventDispatcher.prototype);
    ContextMenu.prototype.constructor = ContextMenu;
    ContextMenu.prototype.kind = 'ContextMenu';
    ContextMenu.prototype.CONF = _default;

    UI.register(ContextMenu);
})(odd);

