(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        GlobalEvent = events.GlobalEvent,
        IM = odd.IM,
        UI = IM.UI,
        components = UI.components,

        CLASS_TAB = 'im-tab',
        CLASS_TAB_HEAD = 'im-tab-head',
        CLASS_TAB_BODY = 'im-tab-body',
        CLASS_TAB_ITEM = 'im-tab-item',
        CLASS_TAB_PAGE = 'im-tab-page',
        CLASS_ACTIVE = 'active';

    function Tab(name, kind, logger) {
        EventDispatcher.call(this, 'Tab', { logger: logger }, [GlobalEvent.CHANGE]);

        var _this = this,
            _name,
            _logger = logger,
            _container,
            _head,
            _body,
            _active;

        function _init() {
            _name = name;
            _container = utils.createElement('div', CLASS_TAB + ' ' + name);
            _head = utils.createElement('div', CLASS_TAB_HEAD);
            _body = utils.createElement('div', CLASS_TAB_BODY);
            _container.appendChild(_head);
            _container.appendChild(_body);
        }

        _this.insert = function (name, selector, content, option) {
            option = utils.extendz({ index: NaN, active: 'auto' }, option);
            if (isNaN(option.index)) {
                option.index = _head.children.length;
            }
            if (option.active === 'auto' && _head.children.length === 0) {
                option.active = true;
            }

            var item = utils.createElement('div', CLASS_TAB_ITEM + ' ' + name);
            var page = utils.createElement('div', CLASS_TAB_PAGE + ' ' + name);
            item.addEventListener('click', _onClick);
            if (typeof selector === 'object') {
                item.appendChild(selector);
            } else {
                item.innerHTML = selector;
            }
            page.appendChild(content);

            if (option.index === 0) {
                _head.insertAdjacentElement('afterbegin', item);
                _body.insertAdjacentElement('afterbegin', page);
            } else {
                _head.children[option.index - 1].insertAdjacentElement('afterend', item);
                _body.children[option.index - 1].insertAdjacentElement('afterend', page);
            }
            if (option.active === true) {
                _this.active(option.index);
            }
        };

        function _onClick(e) {
            var index = utils.indexOf(_head.children, e.target);
            _this.active(index);
        }

        _this.active = function (index) {
            var origin;

            if (_active) {
                origin = utils.indexOf(_head.children, _active);
                _head.children[origin].classList.remove(CLASS_ACTIVE);
                _body.children[origin].classList.remove(CLASS_ACTIVE);
            }
            if (index >= 0) {
                _head.children[index].classList.add(CLASS_ACTIVE);
                _body.children[index].classList.add(CLASS_ACTIVE);
            }
            _active = _head.children[index];
            if (index !== origin) {
                _this.dispatchEvent(GlobalEvent.CHANGE, { name: _name, value: index });
            }
        };

        _this.length = function () {
            return _head.children.length;
        };

        _this.element = function () {
            return _container;
        };

        _this.resize = function (width, height) {

        };

        _init();
    }

    Tab.prototype = Object.create(EventDispatcher.prototype);
    Tab.prototype.constructor = Tab;
    Tab.prototype.kind = 'Tab';

    components.Tab = Tab;
})(odd);

