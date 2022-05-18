(function (odd) {
    var RTC = odd.RTC;

    function Responder(result, status) {
        var _this = this;

        function _init() {
            _this.result = result;
            _this.status = status;
        }

        _init();
    }

    RTC.Responder = Responder;
})(odd);

