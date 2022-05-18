(function (odd) {
    var utils = odd.utils,
        matchers = utils.MPD.matchers,

        numericRegex = /^[-+]?[0-9]+[.]?[0-9]*([eE][-+]?[0-9]+)?$/;

    matchers.numeric = function () {
        var _this = this;

        function _init() {

        }

        _this.test = function (attr) {
            return numericRegex.test(attr.value);
        };

        _this.exec = function (str) {
            return parseFloat(str);
        };

        _init();
    };
})(odd);

