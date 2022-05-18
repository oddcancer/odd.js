(function (odd) {
    var utils = odd.utils,

        MIN_UINT32 = 0,
        MAX_UINT32 = -1 >>> 0,
        MAX_INT32 = -1 >>> 1,
        MIN_INT32 = 1 << 31,
        MIN_CACHE_BITS = 25;

    function BitStream(uint8) {
        var _this = this,
            _view,
            _bits,
            _index;

        function _init() {
            _view = new DataView(uint8.buffer, uint8.byteOffset, uint8.byteLength);
            _bits = uint8.byteLength * 8;
            _index = 0;
        }

        // returns 1-25 bits
        _this.ShowBits = function (n) {
            if (n === 0) {
                return 0;
            }

            var i = _index >>> 3;
            var x = 0;
            if (_index < _bits) {
                x = _view.getUint8(i) << 24;
            }
            if (_index + 8 < _bits) {
                x |= _view.getUint8(i + 1) << 16;
            }
            if (_index + 16 < _bits) {
                x |= _view.getUint8(i + 2) << 8;
            }
            if (_index + 24 < _bits) {
                x |= _view.getUint8(i + 3);
            }

            var cache = x << (_index & 7);
            return cache >>> (32 - n);
        };

        // returns 0-32 bits
        _this.ShowBitsLong = function (n) {
            if (n <= MIN_CACHE_BITS) {
                return _this.ShowBits(n);
            }
            return _this.ShowBits(16) << (n - 16) | _this.ShowBits(n - 16)
        };

        // read 1-25 bits
        _this.ReadBits = function (n) {
            var tmp = _this.ShowBits(n);
            _index += n;
            return tmp;
        };

        // read 0-32 bits
        _this.ReadBitsLong = function (n) {
            var tmp = _this.ShowBitsLong(n);
            _index += n;
            return tmp;
        };

        // skips represented bits
        _this.SkipBits = function (n) {
            _index += n;
        };

        // returns bits remains
        _this.Left = function () {
            return _bits - _index;
        };

        _init();
    }

    utils.MIN_UINT32 = MIN_UINT32;
    utils.MAX_UINT32 = MAX_UINT32;
    utils.MAX_INT32 = MAX_INT32;
    utils.MIN_INT32 = MIN_INT32;
    utils.MIN_CACHE_BITS = MIN_CACHE_BITS;
    utils.BitStream = BitStream;
})(odd);

