(function (odd) {
    var IM = odd.IM;

    function Responder(result, status) {
        var _this = this;

        function _init() {
            _this.result = result;
            _this.status = status;
        }

        _init();
    }

    IM.Responder = Responder;
})(odd);

