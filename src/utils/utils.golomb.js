(function (odd) {
    var utils = odd.utils,
        BitStream = utils.BitStream;

    function ebsp2rbsp(arr) {
        var i = 2;
        var n = arr.byteLength;
        var dst = new Uint8Array(n);
        dst[0] = arr[0];
        dst[1] = arr[1];

        for (var j = 2; j < n; j++) {
            // Unescape: Skip 0x03 after 00 00
            if (arr[j] === 0x03 && arr[j - 1] === 0x00 && arr[j - 2] === 0x00) {
                continue;
            }

            dst[i] = arr[j];
            i++;
        }
        return dst.subarray(0, i);
    }

    function Golomb(arr) {
        BitStream.call(this, arr);

        var _this = this;

        function _init() {

        }

        // read an unsigned Exp-Golomb code
        _this.ReadUE = function () {
            var n = -1;
            for (var i = 0; i === 0 && _this.Left() > 0; n++) {
                i = _this.ReadBits(1);
            }
            return (1 << n >>> 0) - 1 + _this.ReadBitsLong(n);
        };

        // read an signed Exp-Golomb code
        _this.ReadSE = function () {
            var u = _this.ReadUE();
            if ((u & 0x01) === 0) {
                return -(u >>> 1);
            }
            return (u + 1) >>> 1;
        };

        _init();
    }

    Golomb.prototype = Object.create(BitStream.prototype);
    Golomb.prototype.constructor = Golomb;

    utils.ebsp2rbsp = ebsp2rbsp;
    utils.Golomb = Golomb;
})(odd);

