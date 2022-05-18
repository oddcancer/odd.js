(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        RTC = odd.RTC,
        Mixer = RTC.Mixer,
        State = Mixer.State,

        _default = {

        };

    function AudioMixer(logger) {
        EventDispatcher.call(this, 'AudioMixer', { logger: logger }, Event);

        var _this = this,
            _logger = logger,
            _constraints,
            _stream,
            _readyState;

        function _init() {
            _constraints = utils.extendz({}, _default);
            _readyState = State.INITIALIZED;
        }

        _this.stream = function () {
            return _stream;
        };

        _this.close = function (reason) {
            switch (_readyState) {
                case State.RUNNING:
                    _readyState = State.CLOSING;
                    _stream = undefined;
                    _readyState = State.CLOSD;
                    break;

                case State.INITIALIZED:
                    _readyState = State.CLOSD;
                    break;
            }
        };

        _init();
    }

    AudioMixer.prototype = Object.create(EventDispatcher.prototype);
    AudioMixer.prototype.constructor = AudioMixer;
    AudioMixer.prototype.kind = 'audio';

    Mixer.AudioMixer = AudioMixer;
})(odd);

