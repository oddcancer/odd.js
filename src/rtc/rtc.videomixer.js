(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        TimerEvent = events.TimerEvent,
        RTC = odd.RTC,
        Mixer = RTC.Mixer,
        State = Mixer.State,

        _default = {
            width: 1280,
            height: 720,
            frameRate: 15,
        };

    function VideoMixer(logger) {
        EventDispatcher.call(this, 'VideoMixer', { logger: logger }, Event);

        var _this = this,
            _logger = logger,
            _constraints,
            _canvas,
            _context,
            _stream,
            _elements,
            _image,
            _timer,
            _readyState;

        function _init() {
            _constraints = utils.extendz({}, _default);
            _elements = [];
            _readyState = State.INITIALIZED;

            _canvas = utils.createElement('canvas');
            _canvas.innerHTML = `
                <a>Canvas not supported by this browser! </a>
                <a>Please load this page in: </a>
                <a>Chrome, Edge, Safari, Firefox, Opera, etc.</a>
            `;
            _context = _canvas.getContext('2d');

            _timer = new utils.Timer(33, 0, _logger);
            _timer.addEventListener(TimerEvent.TIMER, _onTimer);
        }

        _this.applyConstraints = function (constraints) {
            _constraints = utils.extendz({}, _default, constraints);
        };

        _this.add = function (element, option) {
            if (option === undefined) {
                option = {};
            }
            if (option.layer === undefined) {
                option.layer = _elements.length;
            }
            element.option = option;
            _elements.splice(option.layer, 0, element);
        };

        _this.remove = function (element) {
            for (var i in _elements) {
                if (_elements[i] === element) {
                    _elements.splice(i, 1);
                    break;
                }
            }
        };

        _this.display = function (image, layer) {
            if (image != undefined) {
                _image = image;
                _this.add(image, { layer: layer });
            } else {
                _image = undefined;
                _this.remove(_image);
            }
        };

        _this.forEach = function (callback) {
            for (var i = 0; i < _elements.length; i++) {
                var element = _elements[i];
                callback(element, i);
            }
        };

        _this.start = function () {
            switch (_readyState) {
                case State.INITIALIZED:
                case State.CLOSD:
                    _canvas.width = _constraints.width;
                    _canvas.height = _constraints.height;
                    _logger.log(`Mixer start: kind=${_this.kind}, constraints=${_constraints}`);

                    _stream = _canvas.captureStream(/* _constraints.frameRate */);
                    _stream.getTracks().forEach(function (track) {
                        _logger.log(`Capture start: kind=${track.kind}, id=${track.id}, label=${track.label}`);
                    });

                    _timer.delay = 1000 / _constraints.frameRate;
                    _timer.start();
                    _readyState = State.RUNNING;
                    break;
            }
        };

        function _onTimer(e) {
            _canvas.width = _constraints.width;
            _canvas.height = _constraints.height;

            for (var i = 0; i < _elements.length; i++) {
                var element = _elements[i];
                var option = element.option;

                var x = option.left || 0;
                var y = option.top || 0;
                var width = element.width;
                var height = element.height;
                if (option.right !== undefined) {
                    width = _canvas.width - x - option.right;
                    if (option.left === undefined && width > element.width) {
                        width = element.width;
                        x = _canvas.width - element.width - option.right;
                    }
                }
                if (option.bottom !== undefined) {
                    height = _canvas.height - y - option.bottom;
                    if (option.top === undefined && height > element.height) {
                        height = element.height;
                        y = _canvas.height - element.height - option.bottom;
                    }
                }
                _context.drawImage(element, x, y, width, height);
            }
        }

        _this.stream = function () {
            return _stream;
        };

        _this.stop = function () {
            switch (_readyState) {
                case State.RUNNING:
                    _readyState = State.CLOSING;
                    _timer.stop();
                    _stream = undefined;
                    _logger.log(`Mixer stop: kind=${_this.kind}, constraints=${_constraints}`);
                    _this.dispatchEvent(Event.ENDED);
                    _readyState = State.CLOSD;
                    break;

                case State.INITIALIZED:
                    _readyState = State.CLOSD;
                    break;
            }
        };

        _init();
    }

    VideoMixer.prototype = Object.create(EventDispatcher.prototype);
    VideoMixer.prototype.constructor = VideoMixer;
    VideoMixer.prototype.kind = 'video';

    Mixer.VideoMixer = VideoMixer;
})(odd);

