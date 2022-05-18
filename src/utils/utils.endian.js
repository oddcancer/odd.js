(function (odd) {
    var utils = odd.utils;

    utils.LITTLE_ENDIAN = (function () {
        var buffer,
            array;

        try {
            buffer = new ArrayBuffer(2);
            new DataView(buffer).setInt16(0, 256, true);

            array = new Int16Array(buffer);
        } catch (err) {
            /* void */
        }
        return array && array[0] === 256;
    })();

    utils.getUint32 = function (uint8, byteOffset, littleEndian) {
        if (byteOffset === undefined) {
            byteOffset = 0;
        }

        if (!littleEndian) {
            return (
                uint8[byteOffset + 0] << 24 |
                uint8[byteOffset + 1] << 16 |
                uint8[byteOffset + 2] << 8 |
                uint8[byteOffset + 3]
            );
        }
        return (
            uint8[byteOffset + 0] |
            uint8[byteOffset + 1] >>> 8 |
            uint8[byteOffset + 2] >>> 16 |
            uint8[byteOffset + 3] >>> 24
        );
    };
})(odd);

