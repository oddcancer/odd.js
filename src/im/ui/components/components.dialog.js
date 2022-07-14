(function (odd) {
    var utils = odd.utils,
        css = utils.css,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        MouseEvent = events.MouseEvent,
        IM = odd.IM,
        UI = IM.UI,
        components = UI.components,

        CLASS_DIALOG = 'im-dialog',
        CLASS_TITLE = 'im-title',
        CLASS_CONTENT = 'im-content',
        CLASS_TOOLBAR = 'im-toolbar',
        CLASS_INPUT = 'im-input',
        CLASS_BUTTON = 'im-button',

        CLASS_MESSAGE_TIME = 'im-message-time',
        CLASS_MESSAGE_ITEM = 'im-message-item',
        CLASS_LEVEL = 'im-level',
        CLASS_BADGE = 'im-badge',
        CLASS_NICK = 'im-nick',
        CLASS_SEPARATOR = 'im-separator',
        CLASS_BODY = 'im-body',

        _regi = /\[([a-z]+)\:([a-z]+)=([^\]]+)?\]/gi,
        // &#x1F000;-&#x1F3FF; | &#x1F400;-&#x1F64F;&#x1F680;-&#x1F6FF; | &#x1F900;-&#x1F9FF; | &#x231A;-&#x3299;
        _emoji = /(\uD83C[\uDC00-\uDFFF])|(\uD83D[\uDC00-\uDE4F\uDE80-\uDEFF])|(\uD83E[\uDD00-\uDDFF])|([\u231A-\u3299])/gi,
        _default = {
            kind: 'Dialog',
            id: '001',
            cast: 'multi',
            title: '[Button:close=][Label:title=][Button:more=][List:users=]',
            toolbar: '[Select:emojipicker=]',
            label: 'Send',
            maxlength: 500,
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

    function Dialog(im, config, logger) {
        EventDispatcher.call(this, 'Dialog', { logger: logger }, [MouseEvent.CLICK]);

        var _this = this,
            _im = im,
            _logger = logger,
            _container,
            _title,
            _content,
            _toolbar,
            _input,
            _textarea,
            _button,
            _timestamp;

        function _init() {
            _this.config = config;
            _this.components = {};
            _timestamp = 0;

            _container = utils.createElement('div', CLASS_DIALOG);
            _title = utils.createElement('div', CLASS_TITLE);
            _content = utils.createElement('div', CLASS_CONTENT);
            _toolbar = utils.createElement('div', CLASS_TOOLBAR);
            _input = utils.createElement('div', CLASS_INPUT);

            _textarea = utils.createElement('textarea');
            if (_this.config.maxlength) {
                _textarea.setAttribute('maxlength', _this.config.maxlength);
            }
            _textarea.addEventListener('keypress', _onKeyPress);
            _input.appendChild(_textarea);

            _button = utils.createElement('span', CLASS_BUTTON);
            _button.addEventListener('click', _onSendClick);
            _button.innerHTML = _this.config.label;
            _input.appendChild(_button);

            _container.appendChild(_title);
            _container.appendChild(_content);
            _container.appendChild(_toolbar);
            _container.appendChild(_input);

            _buildComponents(_title, _this.config.title);
            _buildComponents(_toolbar, _this.config.toolbar);
            _setupComponents();
        }

        function _buildComponents(container, layout) {
            var containers = [container];

            var layouts = layout.split('|');
            for (var i = 1; i < layouts.length; i++) {
                var item = utils.createElement('div');
                containers.push(item);
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
                emojipicker.addEventListener(MouseEvent.CLICK, _onEmojiPickerClick);
                utils.forEach(_this.config.emojis, function (i, item) {
                    emojipicker.append(item, item);
                });
            }
            _displayTime(new Date().getTime());
        }

        _this.setTitle = function (text) {
            var title = _this.components['title'];
            if (title) {
                title.text(text);
            }
        };

        _this.onText = function (m) {
            if (m.Timestamp - _timestamp >= 300) { // 5 minutes
                _displayTime(m.Timestamp * 1000);
                _timestamp = m.Timestamp;
            }

            var info = m.Info;
            var user = info.user;
            _logger.log(`${info.chan ? info.chan.id + '/' : ''}${user.nick}: ${info.text}`);

            var item = utils.createElement('div', CLASS_MESSAGE_ITEM);
            if (user.level) {
                var span = utils.createElement('span', CLASS_LEVEL + ' ' + user.level);
                span.innerHTML = user.level;
                item.appendChild(span);
            }
            if (user.badges) {
                for (var i = 0; i < user.badges.length; i++) {
                    var span = utils.createElement('span', CLASS_BADGE);
                    span.innerHTML = user.badges[i];
                    item.appendChild(span);
                }
            }
            var nick = utils.createElement('span', CLASS_NICK);
            nick.innerHTML = user.nick;
            item.appendChild(nick);

            var separator = utils.createElement('span', CLASS_SEPARATOR);
            separator.innerHTML = ':';
            item.appendChild(separator);

            var body = utils.createElement('span', CLASS_BODY);
            body.innerHTML = info.text.replace(_emoji, '<span class="im-emoji">$&</span>');
            item.appendChild(body);
            _content.appendChild(item);
        };

        function _displayTime(timestamp) {
            var date = new Date();
            date.setTime(timestamp);
            var time = utils.date2string(date);

            var last = _content.lastChild;
            if (last && last.className === CLASS_MESSAGE_TIME) {
                last.innerHTML = time;
                return;
            }
            var item = utils.createElement('div', CLASS_MESSAGE_TIME);
            item.innerHTML = time;
            _content.appendChild(item);
        };

        function _onKeyPress(e) {
            if (e.keyCode === 13) {
                if (e.ctrlKey) {
                    _insert('\r\n');
                    return;
                }
                _onSendClick(e);
                if (window.event) {
                    e.returnValue = false;
                } else {
                    e.preventDefault();
                }
            }
        }

        function _onEmojiPickerClick(e) {
            _insert(e.data.value);
        }

        function _onSendClick(e) {
            var text = utils.trim(_textarea.value);
            if (text) {
                _im.send(_this.config.id, text, _this.config.cast === 'multi');
            }
            _textarea.value = '';

            var emojipicker = _this.components['emojipicker'];
            if (emojipicker) {
                emojipicker.visibility('hidden');
            }
        }

        function _insert(text) {
            var scrollTop = _textarea.scrollTop;
            var start = _textarea.selectionStart;
            var end = _textarea.selectionEnd;
            _textarea.value = _textarea.value.substring(0, start) + text + _textarea.value.substring(end, _textarea.value.length);
            if (scrollTop) {
                _textarea.scrollTop = scrollTop;
            }
            _textarea.focus();
            _textarea.selectionStart = start + text.length;
            _textarea.selectionEnd = start + text.length;
        };

        _this.element = function () {
            return _container;
        };

        _this.resize = function () {
            var width = _container.clientWidth;
            var height = _container.clientHeight;
            utils.forEach(_this.components, function (name, component) {
                switch (name) {
                    case 'emojipicker':
                        var w = Math.min(_content.clientWidth - 40, 480);
                        var h = Math.min(_content.clientHeight - 20, 240);
                        component.resize(w - (w % 40), h - (h % 40));
                        break;
                    default:
                        component.resize(width, height);
                        break;
                }
            });
        };

        _init();
    }

    Dialog.prototype = Object.create(EventDispatcher.prototype);
    Dialog.prototype.constructor = Dialog;
    Dialog.prototype.kind = 'Dialog';
    Dialog.prototype.CONF = _default;

    components.Dialog = Dialog;
})(odd);

