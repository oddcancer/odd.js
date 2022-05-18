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

    function Websocket(config, logger) {
        EventDispatcher.call(this, 'Websocket', { logger: logger }, [Event.ERROR], IOEvent);

        var _this = this,
            _logger = logger,
            _readyState,
            _ws;

        function _init() {
            _this.config = utils.extendz({}, _default, config);
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

            var WebSocket = window.WebSocket || window.MozWebSocket;
            _ws = new WebSocket(url.href);
            _ws.onopen = _onOpen;
            _ws.onmessage = _onMessage;
            _ws.onerror = _onError;
            _ws.onclose = _onClose;
            _ws.binaryType = 'arraybuffer';
        };

        function _onOpen(e) {
            // Jump to SENT state directly while the request has been sent as upgrading.
            _readyState = ReadyState.SENT;
            _logger.log('File size change: ' + Infinity);
        }

        function _onMessage(e) {
            _logger.debug('Loader progress: ' + e.data.byteLength + '/' + Infinity);
            if (_readyState === ReadyState.SENT) {
                _readyState = ReadyState.LOADING;
            }
            _this.dispatchEvent(IOEvent.PROGRESS, {
                buffer: e.data,
                loaded: e.data.byteLength,
                total: Infinity,
            });
        }

        function _onError(err) {
            _logger.error('Loader NetworkError: A network error occurred.');
            _this.dispatchEvent(Event.ERROR, { name: 'NetworkError', message: 'A network error occurred.' });
        }

        function _onClose(e) {
            _logger.log('Loader load.');
            _readyState = ReadyState.DONE;
            _this.dispatchEvent(IOEvent.LOAD);
            _this.dispatchEvent(IOEvent.LOADEND);
        }

        _this.abort = function () {
            if (_ws && (_ws.readyState == WebSocket.CONNECTING || _ws.readyState == WebSocket.OPEN)) {
                _ws.close();
                _logger.warn('Loader AbortError: The operation was aborted.');
                _this.dispatchEvent(IOEvent.ABORT, { name: 'AbortError', message: 'The operation was aborted.' });
            }
        };

        _this.state = function () {
            return _readyState;
        };

        _init();
    }

    Websocket.prototype = Object.create(EventDispatcher.prototype);
    Websocket.prototype.constructor = Websocket;
    Websocket.prototype.kind = 'Websocket';
    Websocket.prototype.CONF = _default;

    // Not supported by IE9 and or below.
    Websocket.prototype.isSupported = function (url, mode) {
        if (mode && mode !== 'live') {
            return false;
        }
        return !!(window.WebSocket || window.MozWebSocket) && (url.protocol === 'ws:' || url.protocol === 'wss:');
    };

    IO.register(Websocket);
})(odd);

