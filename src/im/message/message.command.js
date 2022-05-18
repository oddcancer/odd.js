(function (odd) {
    var utils = odd.utils,
        crypt = utils.crypt,
        IM = odd.IM,
        Message = IM.Message;

    function CommandMessage(m) {
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
            _this.Command = 0;
            _this.Arguments = {};
            _this.Payload = undefined;
        }

        _this.parse = function (buffer, byteOffset) {
            var i = 0;
            var view = new DataView(buffer, byteOffset);
            if (view.byteLength < 7) {
                throw { name: 'DataError', message: `Data not enough while decoding command message: ${view.byteLength}/7` };
            }

            _this.Timestamp = view.getUint32(i);
            i += 4;

            _this.TransactionID = view.getUint16(i);
            i += 2;

            _this.Command = view.getUint8(i);
            i++;

            var byte = new Uint8Array(buffer, byteOffset + i);
            var text = crypt.UTF8ByteArrayToString(byte);
            _this.Arguments = JSON.parse(text);
            return view.byteLength;
        };

        _init();
    }

    CommandMessage.prototype = Object.create(Message.prototype);
    CommandMessage.prototype.constructor = CommandMessage;

    IM.CommandMessage = CommandMessage;
})(odd);

