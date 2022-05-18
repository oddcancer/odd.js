(function (odd) {
    var utils = odd.utils,
        Browser = odd.Browser,
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

    function MSStream(config, logger) {
        EventDispatcher.call(this, 'MSStream', { logger: logger }, [Event.ERROR], IOEvent);

        var _this = this,
            _logger = logger,
            _readyState,
            _total,
            _xhr,
            _reader;

        function _init() {
            _this.config = utils.extendz({}, _default, config);
            _total = NaN;

            _xhr = new XMLHttpRequest();
            _xhr.onreadystatechange = _onReadyStateChange;
            _xhr.onabort = _onAbort;
            _xhr.onerror = _onError;
            _xhr.onloadend = _onLoadend;
            _xhr.responseType = 'ms-stream';

            _reader = new MSStreamReader();
            _reader.onprogress = _onProgress;
            _reader.onload = _onLoad;
            _reader.onerror = _onError;
        }

        _this.load = function (url, start, end) {
            _readyState = ReadyState.UNINITIALIZED;
            _reader.position = 0;

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
                    if (_xhr.status < 200 || _xhr.status > 299) {
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
                    _reader.readAsArrayBuffer(_xhr.response);
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
            var buffer = _reader.result.slice(_reader.position);
            if (buffer == null) {
                _logger.warn('What happend???');
                return;
            }

            _logger.debug('Loader progress: ' + buffer.byteLength + '/' + _total);
            _this.dispatchEvent(IOEvent.PROGRESS, {
                buffer: buffer,
                loaded: buffer.byteLength,
                total: _total,
            });

            _reader.position = _reader.result.byteLength;
        }

        function _onLoad(e) {
            _logger.log('Loader load.');
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

    MSStream.prototype = Object.create(EventDispatcher.prototype);
    MSStream.prototype.constructor = MSStream;
    MSStream.prototype.kind = 'MSStream';
    MSStream.prototype.CONF = _default;

    // Only supported by IE10, IE11 and Edge.
    MSStream.prototype.isSupported = function (url, mode) {
        if (mode && mode !== 'live') {
            return false;
        }
        if (!Browser.isIE10 && !Browser.isIE11 && !Browser.isEdge) {
            return false;
        }
        return url.protocol === 'http:' || url.protocol === 'https:';
    };

    IO.register(MSStream);
})(odd);

