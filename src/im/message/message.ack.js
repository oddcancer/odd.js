(function (odd) {
    var IM = odd.IM,
        Message = IM.Message;

    function AckMessage(m) {
        Message.call(this);

        var _this = this;

        function _init() {
            _this.FIN = m.FIN;
            _this.RSV = m.RSV;
            _this.Type = m.Type;
            _this.SN = m.SN;
            _this.StreamID = m.StreamID;
            _this.Payload = 0;
        }

        _this.parse = function (buffer, byteOffset) {
            var i = 0;
            var view = new DataView(buffer, byteOffset);
            if (view.byteLength < 4) {
                throw { name: 'DataError', message: `Data not enough while decoding ack message: ${view.byteLength}/4` };
            }

            _this.Payload = view.getUint32(i);
            i += 4;
            return i;
        };

        _init();
    }

    AckMessage.prototype = Object.create(Message.prototype);
    AckMessage.prototype.constructor = AckMessage;

    IM.AckMessage = AckMessage;
})(odd);

