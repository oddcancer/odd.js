(function (odd) {
    var utils = odd.utils,

        crypt = {};

    /**
     * Turns a string into an array of bytes; a "byte" being a JS number in the
     * range 0-255.
     * @param {string} str String value to arrify.
     * @return {!Array<number>} Array of numbers corresponding to the
     *     UCS character codes of each character in str.
     */
    crypt.StringToByteArray = function (str) {
        var output = [], p = 0;

        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            while (c > 0xff) {
                output[p++] = c & 0xff;
                c >>= 8;
            }

            output[p++] = c;
        }
        return output;
    };

    /**
     * Turns an array of numbers into the string given by the concatenation of the
     * characters to which the numbers correspond.
     * @param {!Uint8Array|!Array<number>} bytes Array of numbers representing characters.
     * @return {string} Stringification of the array.
     */
    crypt.ByteArrayToString = function (bytes) {
        var CHUNK_SIZE = 8192;

        // Special-case the simple case for speed's sake.
        if (bytes.length <= CHUNK_SIZE) {
            return String.fromCharCode.apply(null, bytes);
        }

        // The remaining logic splits conversion by chunks since
        // Function#apply() has a maximum parameter count.
        // See discussion: http://goo.gl/LrWmZ9

        var str = '';
        for (var i = 0; i < bytes.length; i += CHUNK_SIZE) {
            var chunk = Array.slice(bytes, i, i + CHUNK_SIZE);
            str += String.fromCharCode.apply(null, chunk);
        }
        return str;
    };

    /**
     * Turns an array of numbers into the hex string given by the concatenation of
     * the hex values to which the numbers correspond.
     * @param {Uint8Array|Array<number>} array Array of numbers representing characters.
     * @return {string} Hex string.
     */
    crypt.ByteArrayToHex = function (array) {
        return Array.map(array, function (numByte) {
            var hexByte = utils.padStart(numByte.toString(16), 2, 0);
            return hexByte;
        }).join('');
    };

    /**
     * Converts a hex string into an integer array.
     * @param {string} hexString Hex string of 16-bit integers (two characters per integer).
     * @return {!Array<number>} Array of {0,255} integers for the given string.
     */
    crypt.HexToByteArray = function (hexString) {
        if (hexString.length % 2 !== 0) {
            throw { name: 'DataError', message: 'Key string length must be multiple of 2.' };
        }

        var arr = [];
        for (var i = 0; i < hexString.length; i += 2) {
            arr.push(parseInt(hexString.substring(i, i + 2), 16));
        }
        return arr;
    };

    /**
     * Converts a JS string to a UTF-8 "byte" array.
     * @param {string} str 16-bit unicode string.
     * @return {!Array<number>} UTF-8 byte array.
     */
    crypt.StringToUTF8ByteArray = function (str) {
        var out = [],
            p = 0;

        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            if (c < 0x80) {
                out[p++] = c;
            } else if (c < 0x800) {
                out[p++] = (c >> 6) | 0xC0;
                out[p++] = (c & 0x3F) | 0x80;
            } else if (((c & 0xFC00) === 0xD800) && (i + 1) < str.length && ((str.charCodeAt(i + 1) & 0xFC00) === 0xDC00)) {
                c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
                out[p++] = (c >> 18) | 0xF0;
                out[p++] = ((c >> 12) & 0x3F) | 0x80;
                out[p++] = ((c >> 6) & 0x3F) | 0x80;
                out[p++] = (c & 0x3F) | 0x80;
            } else {
                out[p++] = (c >> 12) | 0xE0;
                out[p++] = ((c >> 6) & 0x3F) | 0x80;
                out[p++] = (c & 0x3F) | 0x80;
            }
        }
        return out;
    };

    /**
     * Converts a UTF-8 byte array to JavaScript's 16-bit Unicode.
     * @param {Uint8Array|Array<number>} bytes UTF-8 byte array.
     * @return {string} 16-bit Unicode string.
     */
    crypt.UTF8ByteArrayToString = function (bytes) {
        var out = [],
            pos = 0,
            c = 0;

        while (pos < bytes.length) {
            var c1 = bytes[pos++];
            if (c1 < 0x80) {
                out[c++] = String.fromCharCode(c1);
            } else if (c1 >= 0xC0 && c1 < 0xE0) {
                var c2 = bytes[pos++];
                out[c++] = String.fromCharCode((c1 & 0x1F) << 6 | c2 & 0x3F);
            } else if (c1 >= 0xE0 && c1 < 0xF0) {
                var c2 = bytes[pos++];
                var c3 = bytes[pos++];
                out[c++] = String.fromCharCode((c1 & 0x0F) << 12 | (c2 & 0x3F) << 6 | c3 & 0x3F);
            } else if (c1 >= 0xF0 && c1 < 0xFE) {
                var c2 = bytes[pos++];
                var c3 = bytes[pos++];
                var c4 = bytes[pos++];
                var u = ((c1 & 0x07) << 18 | (c2 & 0x3F) << 12 | (c3 & 0x3F) << 6 | c4 & 0x3F) - 0x10000;
                out[c++] = String.fromCharCode(0xD800 + (u >> 10));
                out[c++] = String.fromCharCode(0xDC00 + (u & 0x3FF));
            }
        }
        return out.join('');
    };

    /**
     * XOR two byte arrays.
     * @param {!Uint8Array|!Int8Array|!Array<number>} bytes1 Byte array 1.
     * @param {!Uint8Array|!Int8Array|!Array<number>} bytes2 Byte array 2.
     * @return {!Array<number>} Resulting XOR of the two byte arrays.
     */
    crypt.XORByteArray = function (bytes1, bytes2) {
        if (bytes1.length !== bytes2.length) {
            throw { name: 'DataError', message: 'XOR array lengths must match.' };
        }

        var result = [];
        for (var i = 0; i < bytes1.length; i++) {
            result.push(bytes1[i] ^ bytes2[i]);
        }
        return result;
    };

    utils.crypt = crypt;
})(odd);

