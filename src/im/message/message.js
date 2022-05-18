(function (odd) {
    var IM = odd.IM,

        Type = {
            ABORT: 0x1,
            ACK_WINDOW_SIZE: 0x2,
            ACK: 0x3,
            COMMAND: 0x4,
            USER_CONTROL: 0x5,
        },
        Command = {
            CONNECT: 0x01,
            CREATE: 0x02,
            JOIN: 0x03,
            LEAVE: 0x04,
            SET_PROPERTY: 0x05,
            GET_PROPERTY: 0x06,
            STATUS: 0x07,
            RELEASE: 0x0E,
            DISCONNECT: 0x0F,
        },
        UserControl = {
            TEXT: "text",
            FILE: "file",
            MUTE: "mute",
            UNMUTE: "unmute",
            FORBID: "forbid",
            PERMIT: "permit",
        };

    function Message() {
        var _this = this;

        function _init() {
            _this.FIN = 0;
            _this.RSV = 0;
            _this.Type = 0;
            _this.SN = 0;
            _this.StreamID = 0;
            _this.Payload = null;
        }

        _this.parse = function (buffer, byteOffset) {
            if (buffer.byteLength < 7) {
                throw { name: 'DataError', message: `Data not enough while decoding im message: ${buffer.byteLength}/7` };
            }

            var i = 0;
            var view = new DataView(buffer, byteOffset);

            var byte = view.getUint8(i);
            _this.FIN = (byte & 0x80) >> 7;
            _this.RSV = (byte & 0x70) >> 4;
            _this.Type = byte & 0x0F;
            i++;

            _this.SN = view.getUint16(i);
            i += 2;

            _this.StreamID = view.getUint32(i);
            i += 4;

            _this.Payload = new Uint8Array(buffer, byteOffset + i);
            i += _this.Payload.byteLength;
            return i;
        };

        _init();
    }

    Message.Type = Type;
    Message.Command = Command;
    Message.UserControl = UserControl;
    IM.Message = Message;
})(odd);

