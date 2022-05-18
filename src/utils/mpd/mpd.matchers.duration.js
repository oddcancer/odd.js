(function (odd) {
    var utils = odd.utils,
        matchers = utils.MPD.matchers,

        durationRegex = /^([-])?P(([\d.]*)Y)?(([\d.]*)M)?(([\d.]*)D)?T?(([\d.]*)H)?(([\d.]*)M)?(([\d.]*)S)?/,

        SECONDS_IN_YEAR = 365 * 24 * 60 * 60,
        SECONDS_IN_MONTH = 30 * 24 * 60 * 60,
        SECONDS_IN_DAY = 24 * 60 * 60,
        SECONDS_IN_HOUR = 60 * 60,
        SECONDS_IN_MIN = 60,

        attributes = [
            'minBufferTime', 'mediaPresentationDuration',
            'minimumUpdatePeriod', 'timeShiftBufferDepth', 'maxSegmentDuration',
            'maxSubsegmentDuration', 'suggestedPresentationDelay', 'start',
            'starttime', 'duration'
        ];

    matchers.duration = function () {
        var _this = this;

        function _init() {

        }

        _this.test = function (attr) {
            for (var i = 0; i < attributes.length; i++) {
                if (_getNodeName(attr) === attributes[i]) {
                    return durationRegex.test(attr.value);
                }
            }

            return false;
        };

        _this.exec = function (str) { // str = "P10Y10M10DT10H10M10.1S";
            var match = durationRegex.exec(str);
            var value = parseFloat(match[2] || 0) * SECONDS_IN_YEAR + parseFloat(match[4] || 0) * SECONDS_IN_MONTH + parseFloat(match[6] || 0) * SECONDS_IN_DAY +
                parseFloat(match[8] || 0) * SECONDS_IN_HOUR + parseFloat(match[10] || 0) * SECONDS_IN_MIN + parseFloat(match[12] || 0);

            if (match[1] !== undefined) {
                value *= -1;
            }

            return value;
        };

        function _getNodeName(node) {
            return node.localName || node.baseName || node.nodeName;
        }

        _init();
    };
})(odd);

