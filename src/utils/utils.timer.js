(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        TimerEvent = events.TimerEvent;

    function Timer(delay, repeatCount, logger) {
        EventDispatcher.call(this, 'Timer', { logger: logger }, [TimerEvent.TIMER, TimerEvent.COMPLETE]);

        var _this = this,
            _intervalId,
            _currentCount = 0,
            _running = false;

        function _init() {
            _this.delay = delay || 50;
            _this.repeatCount = repeatCount || 0;
        }

        _this.start = function () {
            if (_running === false) {
                _intervalId = setInterval(_onTimer, _this.delay);
                _running = true;
            }
        };

        function _onTimer() {
            _currentCount++;
            _this.dispatchEvent(TimerEvent.TIMER);

            if (_this.repeatCount > 0 && _currentCount >= _this.repeatCount) {
                _this.stop();
                _this.dispatchEvent(TimerEvent.COMPLETE);
            }
        }

        _this.stop = function () {
            if (_running) {
                clearInterval(_intervalId);
                _intervalId = 0;
                _running = false;
            }
        };

        _this.reset = function () {
            _this.stop();
            _currentCount = 0;
        };

        _this.currentCount = function () {
            return _currentCount;
        };

        _this.running = function () {
            return _running;
        };

        _init();
    }

    Timer.prototype = Object.create(EventDispatcher.prototype);
    Timer.prototype.constructor = Timer;

    utils.Timer = Timer;
})(odd);

