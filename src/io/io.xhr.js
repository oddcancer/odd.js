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
        ResponseType = IO.ResponseType,
        ReadyState = IO.ReadyState,

        _default = {
            method: 'GET',
            headers: {},
            mode: Mode.CORS,
            credentials: Credentials.OMIT,
            cache: Cache.DEFAULT,
            redirect: Redirect.FOLLOW,
            responseType: ResponseType.ARRAYBUFFER,
        };

    function XHR(config, logger) {
        EventDispatcher.call(this, 'XHR', { logger: logger }, [Event.ERROR], IOEvent);

        var _this = this,
            _logger = logger,
            _readyState,
            _total,
            _xhr;

        function _init() {
            _this.config = utils.extendz({}, _default, config);
            _total = NaN;

            _xhr = new XMLHttpRequest();
            _xhr.onreadystatechange = _onReadyStateChange;
            _xhr.onabort = _onAbort;
            _xhr.onprogress = _onProgress;
            _xhr.onload = _onLoad;
            _xhr.onerror = _onError;
            _xhr.onloadend = _onLoadend;
            _xhr.responseType = _this.config.responseType;
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

            _xhr.open(_this.config.method, url.href, true);
            if (start !== undefined) {
                utils.extendz(_this.config.headers, {
                    Range: 'bytes=' + start + '-' + (end || ''),
                });
            }
            utils.forEach(_this.config.headers, function (key, value) {
                _xhr.setRequestHeader(key, value);
            });
            switch (_this.config.credentials) {
                case Credentials.INCLUDE:
                    _xhr.withCredentials = true;
                    break;
                case Credentials.SAME_ORIGIN:
                    _xhr.withCredentials = window.location.host === url.host;
                    break;
                default:
                    _xhr.withCredentials = false;
                    break;
            }
            _xhr.send();
        };

        function _onReadyStateChange(e) {
            _readyState = _xhr.readyState;

            switch (_readyState) {
                case ReadyState.OPEN:
                    break;

                case ReadyState.SENT:
                    if (_xhr.status !== 416 && (_xhr.status < 200 || _xhr.status > 299)) {
                        _logger.error('Loader NetworkError: ' + _xhr.status + ' ' + _xhr.statusText);
                        _this.dispatchEvent(Event.ERROR, { name: 'NetworkError', message: _xhr.status + ' ' + _xhr.statusText });
                        break;
                    }

                    var size = _xhr.getResponseHeader('Content-Length');
                    if (size) {
                        size = parseInt(size);
                    }
                    if (_xhr.status === 206) {
                        var range = _xhr.getResponseHeader('Content-Range');
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
                    break;

                case ReadyState.LOADING:
                    break;

                case ReadyState.DONE:
                    break;
            }
        }

        function _onAbort(e) {
            _logger.warn('Loader AbortError: The operation was aborted.');
            _this.dispatchEvent(IOEvent.ABORT, { name: 'AbortError', message: 'The operation was aborted.' });
        }

        function _onProgress(e) {
            _logger.debug('Loader progress: ' + _xhr.loaded + '/' + _total);
        }

        function _onLoad(e) {
            _logger.log('Loader load.');
            _this.dispatchEvent(IOEvent.PROGRESS, {
                buffer: _xhr.response,
                loaded: _xhr.response.byteLength,
                total: _total,
            });
            _this.dispatchEvent(IOEvent.LOAD);
        }

        function _onError(err) {
            _logger.error('Loader ' + err.name + ': ' + err.message);
            switch (err.name) {
                case 'TimeoutError':
                    _this.dispatchEvent(IOEvent.TIMEOUT, { name: err.name, message: err.message });
                    break;
                default:
                    _this.dispatchEvent(Event.ERROR, { name: err.name, message: err.message });
                    break;
            }
        }

        function _onLoadend(e) {
            _this.dispatchEvent(IOEvent.LOADEND);
        }

        _this.abort = function () {
            _xhr.abort();
        };

        _this.state = function () {
            return _readyState;
        };

        _init();
    }

    XHR.prototype = Object.create(EventDispatcher.prototype);
    XHR.prototype.constructor = XHR;
    XHR.prototype.kind = 'XHR';
    XHR.prototype.CONF = _default;

    // Not supported by IE9 and or below.
    // Forbid to use in http-flv/fmp4 live streaming, because it is not a progressive loader.
    XHR.prototype.isSupported = function (url, mode) {
        if (mode && mode === 'live') {
            var map = [
                'flv', '', undefined,
                'mp4', 'm4s', 'f4v', 'm4v', 'mov',
            ];
            for (var i = 0; i < map.length; i++) {
                if (url.filetype === map[i]) {
                    return false;
                }
            }
        }
        return url.protocol === 'http:' || url.protocol === 'https:';
    };

    IO.register(XHR);
})(odd);

