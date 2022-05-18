(function (odd) {
    var utils = odd.utils,
        matchers = utils.MPD.matchers,

        datetimeRegex = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?::([0-9]*)(\.[0-9]*)?)?(?:([+-])([0-9]{2})(?::?)([0-9]{2}))?/,

        MINUTES_IN_HOUR = 60,
        SECONDS_IN_MINUTE = 60,
        MILLISECONDS_IN_SECOND = 1000;

    matchers.datetime = function () {
        var _this = this;

        function _init() {

        }

        _this.test = function (attr) {
            return datetimeRegex.test(attr.value);
        };

        _this.exec = function (str) {
            var match = datetimeRegex.exec(str);
            var utcDate;

            // If the string does not contain a timezone offset, different browsers can interpret it either as UTC or as a local time,
            // so we have to parse the string manually to normalize the given date value for all browsers.
            utcDate = Date.UTC(
                parseInt(match[1], 10),
                parseInt(match[2], 10) - 1, // months start from zero
                parseInt(match[3], 10),
                parseInt(match[4], 10),
                parseInt(match[5], 10),
                (match[6] && parseInt(match[6], 10) || 0),
                (match[7] && parseFloat(match[7]) * MILLISECONDS_IN_SECOND) || 0
            );

            // If the date has timezone offset take it into account as well
            if (match[9] && match[10]) {
                var timezoneOffset = parseInt(match[9], 10) * MINUTES_IN_HOUR + parseInt(match[10], 10);
                utcDate += (match[8] === '+' ? -1 : +1) * timezoneOffset * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND;
            }

            return new Date(utcDate);
        };

        _init();
    };
})(odd);

