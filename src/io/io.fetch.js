(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        IOEvent = events.IOEvent,
        IO = odd.IO,
        Mode = IO.Mode,
        Credentials = IO.Credentials,
        Cache = IO.Cache,
        Redirect = IO.Redirect,
        ReadyState = IO.ReadyState,

        _default = {
            method: 'GET',
            headers: {},
            mode: Mode.CORS,
            credentials: Credentials.OMIT,
            cache: Cache.DEFAULT,
            redirect: Redirect.FOLLOW,
        };

    function Fetch(config, logger) {
        EventDispatcher.call(this, 'Fetch', { logger: logger }, [Event.ERROR], IOEvent);

        var _this = this,
            _logger = logger,
            _readyState,
            _total,
            _controller;

        function _init() {
            _this.config = utils.extendz({}, _default, config);
            _total = NaN;
            _controller = new AbortController();
        }

        _this.load = function (url, start, end) {
            _readyState = ReadyState.UNINITIALIZED;

            if (!_this.isSupported(url)) {
                _logger.error('Loader NotSupportedError: Not supportped.');
                _readyState = ReadyState.DONE;
                _this.dispatchEvent(Event.ERROR, { name: 'NotSupportedError', message: 'Not supportped.' });
                _this.dispatchEvent(IOEvent.LOADEND);
                return;
            }

            _logger.log('Loader loadstart.');
            _this.dispatchEvent(IOEvent.LOADSTART);

            // Suppose it is open from here.
            _readyState = ReadyState.OPEN;

            if (start !== undefined) {
                utils.extendz(_this.config.headers, {
                    Range: 'bytes=' + start + '-' + (end || ''),
                });
            }
            var options = utils.extendz({}, _this.config, {
                headers: new Headers(_this.config.headers),
                signal: _controller.signal,
            });

            fetch(url.href, options)
            ['then'](function (res) {
                switch (_readyState) {
                    case ReadyState.OPEN:
                        _readyState = ReadyState.SENT;
                        break;
                    default:
                        // Should not reach here.
                        _logger.warn('Loader state error, probably aborted already.');
                        break;
                }

                if (!res.ok || res.status < 200 || res.status > 299) {
                    return Promise.reject(new Error(res.status + ' ' + res.statusText));
                }

                var size = res.headers.get('Content-Length');
                if (size) {
                    size = parseInt(size);
                }
                if (res.status === 206) {
                    var range = res.headers.get('Content-Range');
                    if (range) {
                        var arr = range.match(/bytes (\d*)\-(\d*)\/(\d+)/i);
                        if (arr) {
                            size = parseInt(arr[3]);
                        }
                    }
                }
                if (_total !== size) {
                    _total = size || Infinity;
                    _logger.log('File size change: ' + _total);
                }

                return _pump(res.body.getReader());
            })
            ['catch'](_onError);
        };

        function _pump(reader) {
            return reader.read()
            ['then'](function (res) {
                if (res.done) {
                    _logger.log('Loader load.');
                    _readyState = ReadyState.DONE;
                    _this.dispatchEvent(IOEvent.LOAD);
                    _this.dispatchEvent(IOEvent.LOADEND);
                    return Promise.resolve('load');
                }

                switch (_readyState) {
                    case ReadyState.SENT:
                        _readyState = ReadyState.LOADING;
                        break;
                    case ReadyState.DONE:
                        _logger.warn('Loader state error, probably aborted already.');
                        return reader.cancel();
                }

                _logger.debug('Loader progress: ' + res.value.buffer.byteLength + '/' + _total);
                _this.dispatchEvent(IOEvent.PROGRESS, {
                    buffer: res.value.buffer,
                    loaded: res.value.buffer.byteLength,
                    total: _total,
                });

                return _pump(reader);
            })
            ['catch'](_onError);
        }

        function _onError(err) {
            _readyState = ReadyState.DONE;
            _logger.error('Loader ' + err.name + ': ' + err.message);
            switch (err.name) {
                case 'AbortError':
                    _this.dispatchEvent(IOEvent.ABORT, { name: err.name, message: err.message });
                    break;
                case 'TimeoutError':
                    _this.dispatchEvent(IOEvent.TIMEOUT, { name: err.name, message: err.message });
                    break;
                default:
                    _this.dispatchEvent(Event.ERROR, { name: err.name, message: err.message });
                    break;
            }
            _this.dispatchEvent(IOEvent.LOADEND);
        }

        _this.abort = function () {
            _controller.abort();
        };

        _this.state = function () {
            return _readyState;
        };

        _init();
    }

    Fetch.prototype = Object.create(EventDispatcher.prototype);
    Fetch.prototype.constructor = Fetch;
    Fetch.prototype.kind = 'Fetch';
    Fetch.prototype.CONF = _default;

    // Not supported by IE11 and or below.
    Fetch.prototype.isSupported = function (url, mode) {
        if (mode && mode !== 'live') {
            return false;
        }
        return !!fetch && (url.protocol === 'http:' || url.protocol === 'https:');
    };

    IO.register(Fetch);
})(odd);

