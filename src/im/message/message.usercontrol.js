(function (odd) {
    var utils = odd.utils,
        crypt = utils.crypt,
        IM = odd.IM,
        Message = IM.Message;

    function UserControlMessage(m) {
        Message.call(this);

        var _this = this;

        function _init() {
            _this.FIN = m.FIN;
            _this.RSV = m.RSV;
            _this.Type = m.Type;
            _this.SN = m.SN;
            _this.StreamID = m.StreamID;
            _this.Timestamp = 0;
            _this.TransactionID = 0;
            _this.Offset = 0;
            _this.Info = {};
            _this.Payload = null;
        }

        _this.parse = function (buffer, byteOffset) {
            var i = 0;
            var view = new DataView(buffer, byteOffset);
            if (view.byteLength < 8) {
                throw { name: 'DataError', message: `Data not enough while decoding user control message: ${view.byteLength}/8` };
            }

            _this.Timestamp = view.getUint32(i);
            i += 4;

            _this.TransactionID = view.getUint16(i);
            i += 2;

            _this.Offset = view.getUint16(i);
            i += 2;

            if (_this.Offset > 0) {
                var byte = new Uint8Array(buffer, byteOffset + i, _this.Offset);
                var text = crypt.UTF8ByteArrayToString(byte);
                _this.Info = JSON.parse(text);
                i += _this.Offset;
            }
            _this.Payload = new Uint8Array(buffer, byteOffset + i);
            return view.byteLength;
        };

        _init();
    }

    UserControlMessage.prototype = Object.create(Message.prototype);
    UserControlMessage.prototype.constructor = UserControlMessage;

    IM.UserControlMessage = UserControlMessage;
})(odd);

