(function (odd) {
    var utils = odd.utils,
        events = odd.events;

    function EventDispatcher(kind, option) {
        var _this = this,
            _kind = kind,
            _option = option,
            _logger = option.logger || utils,
            _args = Array.prototype.slice.call(arguments, 2),
            _listeners,
            _globallisteners;

        function _init() {
            _listeners = {};
            _globallisteners = [];
            _this.bind.apply(_this, _args);
        }

        _this.bind = function () {
            var args = Array.prototype.slice.call(arguments, 0);
            utils.forEach(args, function (i, item) {
                utils.forEach(item, function (j, type) {
                    var evt = 'on' + type.replace(/-/g, '');
                    _this[evt] = undefined;
                });
            });
        };

        _this.addEventListener = function (type, listener, count) {
            try {
                if (!_listeners[type]) {
                    _listeners[type] = [];
                }

                if (utils.typeOf(listener) === 'string') {
                    listener = (new Function('return ' + listener))();
                }

                _listeners[type].push({
                    listener: listener,
                    count: count || NaN,
                });
            } catch (err) {
                _logger.error(_kind + ' failed to addEventListener(' + type + '):', err);
            }
        };

        _this.removeEventListener = function (type, listener) {
            if (!_listeners[type]) {
                return;
            }

            try {
                if (listener === undefined) {
                    delete _listeners[type];
                    return;
                }

                for (var i = 0; i < _listeners[type].length; i++) {
                    if (_listeners[type][i].listener.toString() === listener.toString()) {
                        _listeners[type].splice(i, 1);
                        break;
                    }
                }
            } catch (err) {
                _logger.error(_kind + ' failed to removeEventListener(' + type + '):', err);
            }
        };

        _this.hasEventListener = function (type) {
            return _listeners.hasOwnProperty(type) && _listeners[type].length > 0;
        };

        _this.addGlobalListener = function (listener, count) {
            try {
                if (utils.typeOf(listener) === 'string') {
                    listener = (new Function('return ' + listener))();
                }

                _globallisteners.push({
                    listener: listener,
                    count: count || NaN,
                });
            } catch (err) {
                _logger.error(_kind + ' failed to addGlobalListener():', err);
            }
        };

        _this.removeGlobalListener = function (listener) {
            if (!listener) {
                return;
            }

            try {
                for (var i = 0; i < _globallisteners.length; i++) {
                    if (_globallisteners[i].listener.toString() === listener.toString()) {
                        _globallisteners.splice(i, 1);
                        break;
                    }
                }
            } catch (err) {
                _logger.error(_kind + ' failed to removeGlobalListener():', err);
            }
        };

        _this.dispatchEvent = function (type, data) {
            _this.forward({
                type: type,
                data: data || {},
                srcElement: _this,
                version: odd().version,
            });
        };

        _this.forward = function (event) {
            event.target = _this;
            event.stopPropagation = false;
            event.api = _option && (typeof _option.id === 'string' || typeof _option.id === 'number') ? _option.id : undefined;
            _logger.debug(_kind, event);

            var onevent = 'on' + event.type.replace(/-/g, '');
            if (utils.typeOf(_this[onevent]) === 'function') {
                _this[onevent](event);
            } else {
                _dispatchEvent(_listeners[event.type], event);
                _dispatchEvent(_globallisteners, event);
            }
        };

        function _dispatchEvent(listeners, event) {
            if (!listeners) {
                return;
            }

            var iterators = listeners.slice(0);

            for (var i = 0; i < iterators.length; i++) {
                var listener = iterators[i];
                if (listener) {
                    if (!isNaN(listener.count) && --listener.count === 0) {
                        listeners.splice(i, 1);
                    }

                    try {
                        listener.listener(event);
                        if (event.stopPropagation) {
                            break;
                        }
                    } catch (err) {
                        _logger.error(_kind + ' failed to dispatch event:', event, err.toString());
                    }
                }
            }
        }

        _init();
    }

    events.EventDispatcher = EventDispatcher;
})(odd);

