(function (odd) {
    var utils = odd.utils,

        AMF = {
            DOUBLE: 0x00,
            BOOLEAN: 0x01,
            STRING: 0x02,
            OBJECT: 0x03,
            MOVIE_CLIP: 0x04,   // Not available in Remoting
            NULL: 0x05,
            UNDEFINED: 0x06,
            REFERENCE: 0x07,
            ECMA_ARRAY: 0x08,
            END_OF_OBJECT: 0x09,
            STRICT_ARRAY: 0x0A,
            DATE: 0x0B,
            LONG_STRING: 0x0C,
            UNSUPPORTED: 0x0D,
            RECORD_SET: 0x0E,   // Remoting, server-to-client only
            XML: 0x0F,
            TYPED_OBJECT: 0x10, // Class instance
            AMF3_DATA: 0x11     // Sent by Flash player 9+
        };

    function Value(type) {
        var _this = this;

        function _init() {
            _this.type = type;
            _this.key = '';
            _this.value = null;
            _this.table = {};
            _this.offset = 0;
            _this.ended = false;
        }

        _this.set = function (key, value, offset) {
            switch (_this.type) {
                case AMF.DOUBLE:
                    if (utils.typeOf(value) !== 'number') {
                        throw { name: 'TypeError', message: 'Value should be number.' };
                    }
                    break;

                case AMF.BOOLEAN:
                    if (utils.typeOf(value) !== 'boolean') {
                        throw { name: 'TypeError', message: 'Value should be boolean.' };
                    }

                case AMF.STRING:
                case AMF.LONG_STRING:
                    if (utils.typeOf(value) !== 'string') {
                        throw { name: 'TypeError', message: 'Value should be string.' };
                    }
                    break;

                case AMF.OBJECT:
                case AMF.ECMA_ARRAY:
                    if (utils.typeOf(value) !== 'array') {
                        throw { name: 'TypeError', message: 'Value should be array.' };
                    }

                    for (var i = 0; i < value.length; i++) {
                        var v = value[i];
                        _this.table[v.key] = v;
                    }
                    break;

                case AMF.STRICT_ARRAY:
                    if (utils.typeOf(value) !== 'array') {
                        throw { name: 'TypeError', message: 'Value should be array.' };
                    }
                    break;

                case AMF.DATE:
                    if (utils.typeOf(value) !== 'number') {
                        throw { name: 'TypeError', message: 'Value should be number.' };
                    }

                    if (utils.typeOf(offset) !== 'number') {
                        throw { name: 'TypeError', message: 'Offset not presented.' };
                    }

                    _this.offset = offset;
                    break;

                case AMF.NULL:
                case AMF.UNDEFINED:
                    if (utils.typeOf(value) !== 'null') {
                        throw { name: 'TypeError', message: 'Value should be null.' };
                    }
                    break;

                default:
                    throw { name: 'TypeError', message: 'Unrecognized amf type ' + _this.type + '.' };
            }

            _this.key = key;
            _this.value = value;
            return _this;
        };

        _this.get = function () {
            switch (_this.type) {
                case AMF.DATE:
                    return new Date(_this.value + _this.offset * 60 * 1000);
                default:
                    return _this.value;
            }
        };

        _init();
    }

    AMF.decode = function (v, buffer, byteOffset) {
        if (buffer.byteLength < 1) {
            throw { name: 'DataError', message: 'Data not enough while decoding amf Value.' };
        }

        var i = 0;
        var view = new DataView(buffer, byteOffset);

        v.type = view.getUint8(i);
        i += 1;

        var handler = {
            0x00: AMF.decodeDouble,
            0x01: AMF.decodeBoolean,
            0x02: AMF.decodeString,
            0x03: AMF.decodeObject,
            0x05: AMF.decodeNull,
            0x06: AMF.decodeUndefined,
            0x08: AMF.decodeECMAArray,
            0x09: AMF.decodeEndOfObject,
            0x0A: AMF.decodeStrictArray,
            0x0B: AMF.decodeDate,
            0x0C: AMF.decodeLongString,
        }[v.type];

        if (!handler) {
            throw { name: 'TypeError', message: 'Unrecognized amf type ' + v.type + '.' };
        }

        i += handler(v, buffer, byteOffset + i);
        return i;
    };

    AMF.decodeDouble = function (v, buffer, byteOffset) {
        if (buffer.byteLength < 8) {
            throw { name: 'DataError', message: 'Data not enough while decoding amf double.' };
        }

        var i = 0;
        var view = new DataView(buffer, byteOffset);

        v.value = view.getFloat64(i);
        i += 8;
        return i;
    }

    AMF.decodeBoolean = function (v, buffer, byteOffset) {
        if (buffer.byteLength < 1) {
            throw { name: 'DataError', message: 'Data not enough while decoding amf boolean.' };
        }

        var i = 0;
        var view = new DataView(buffer, byteOffset);

        v.value = !!view.getUint8(i);
        i += 1;
        return i;
    }

    AMF.decodeString = function (v, buffer, byteOffset) {
        if (buffer.byteLength < 2) {
            throw { name: 'DataError', message: 'Data not enough while decoding amf string.' };
        }

        var i = 0;
        var view = new DataView(buffer, byteOffset);

        var length = view.getUint16(i);
        i += 2;

        if (length > 0) {
            v.value = String.fromCharCode.apply(String, new Uint8Array(buffer, byteOffset + i, length));
            i += length;
        } else {
            v.value = '';
        }

        return i;
    };

    AMF.decodeObject = function (v, buffer, byteOffset) {
        if (buffer.byteLength < 3) {
            throw { name: 'DataError', message: 'Data not enough while decoding amf object.' };
        }

        var i = 0;
        var size = buffer.byteLength - byteOffset;
        v.value = [];

        for (; i < size;) {
            var t = new Value();

            i += AMF.decodeString(t, buffer, byteOffset + i);
            t.key = t.get();

            i += AMF.decode(t, buffer, byteOffset + i);
            if (t.type === AMF.END_OF_OBJECT) {
                break
            }

            v.value.push(t);
            v.table[t.key] = t;
        }

        return i;
    };

    AMF.decodeNull = function (v, buffer, byteOffset) {
        v.value = null;
        return 0;
    };

    AMF.decodeUndefined = function (v, buffer, byteOffset) {
        v.value = undefined;
        return 0;
    };

    AMF.decodeECMAArray = function (v, buffer, byteOffset) {
        if (buffer.byteLength < 4) {
            throw { name: 'DataError', message: 'Data not enough while decoding amf ecma array.' };
        }

        var i = 4; // Don't trust array length field
        i += AMF.decodeObject(v, buffer, byteOffset + i);
        return i;
    };

    AMF.decodeEndOfObject = function (v, buffer, byteOffset) {
        v.ended = true;
        return 0;
    };

    AMF.decodeStrictArray = function (v, buffer, byteOffset) {
        if (buffer.byteLength < 4) {
            throw { name: 'DataError', message: 'Data not enough while decoding amf strict array.' };
        }

        var i = 0;
        var view = new DataView(buffer, byteOffset);

        var length = view.getUint32(i);
        i += 4;

        var size = buffer.byteLength - byteOffset;
        v.value = [];

        for (var j = 0; j < length && i < size; j++) {
            var t = new Value();
            i += AMF.decode(t, buffer, byteOffset + i);

            v.value.push(t);
        }

        if (i + 3 <= size && view.getUint8(i) === 0 && view.getUint8(i + 1) === 0 && view.getUint8(i + 2) === AMF.END_OF_OBJECT) {
            v.ended = true;
            i += 3;
        }

        return i;
    };

    AMF.decodeDate = function (v, buffer, byteOffset) {
        if (buffer.byteLength < 10) {
            throw { name: 'DataError', message: 'Data not enough while decoding amf date.' };
        }

        var i = 0;
        var view = new DataView(buffer, byteOffset);

        v.Timestamp = view.getFloat64(i);
        i += 8;

        v.Timeoffset = view.getInt16(i);
        i += 2;
        return i;
    };

    AMF.decodeLongString = function (v, buffer, byteOffset) {
        if (buffer.byteLength < 4) {
            throw { name: 'DataError', message: 'Data not enough while decoding amf long string.' };
        }

        var i = 0;
        var view = new DataView(buffer, byteOffset);

        var length = view.getUint32(i);
        i += 4;

        if (length > 0) {
            v.value = String.fromCharCode.apply(String, new Uint8Array(buffer, byteOffset + i, length));
            i += length;
        }

        return i;
    };

    AMF.appendBytes = function (b, data) {
        b.Write(data);
    };

    AMF.appendInt8 = function (b, n) {
        b.writeInt8(n);
    };

    AMF.appendInt16 = function (b, n, littleEndian) {
        b.WriteInt16(n, littleEndian);
    };

    AMF.appendInt32 = function (b, n, littleEndian) {
        b.WriteInt32(n, littleEndian);
    };

    AMF.appendUint8 = function (b, n) {
        b.writeUint8(n);
    };

    AMF.appendUint16 = function (b, n, littleEndian) {
        b.WriteUint16(n, littleEndian);
    };

    AMF.appendUint32 = function (b, n, littleEndian) {
        b.WriteUint32(n, littleEndian);
    };

    AMF.encode = function (b, v) {
        var handler = {
            0x00: AMF.encodeDouble,
            0x01: AMF.encodeBoolean,
            0x02: AMF.encodeString,
            0x03: AMF.encodeObject,
            0x05: AMF.encodeNull,
            0x06: AMF.encodeUndefined,
            0x08: AMF.encodeECMAArray,
            0x0A: AMF.encodeStrictArray,
            0x0B: AMF.encodeDate,
            0x0C: AMF.encodeLongString,
        }[v.type];

        if (!handler) {
            throw { name: 'TypeError', message: 'Unrecognized amf type ' + v.type + '.' };
        }

        return handler(b, v);
    };

    AMF.encodeNumber = function (b, v) {
        b.WriteUint8(AMF.DOUBLE);
        b.WriteFloat64(v.value, false);
        return 9;
    };

    AMF.encodeBoolean = function (b, v) {
        b.WriteUint8(AMF.BOOLEAN);
        b.WriteUint8(v.value ? 1 : 0);
        return 2;
    };

    AMF.encodeString = function (b, v) {
        if (!v.value) {
            return 0;
        }

        if (v.value.length >= 0xFFFF) {
            return AMF.encodeLongString(b, v);
        }

        var array = crypt.stringToByteArray(v.value);
        b.WriteUint8(AMF.STRING);
        b.WriteUint16(array.length, false);
        b.Write(array);
        return 3 + array.length;
    };

    AMF.encodeObject = function (b, v) {
        var i = 1;
        b.WriteUint8(AMF.OBJECT);
        i += _encodeProperties(v);

        if (v.ended) {
            b.WriteUint16(0);
            b.WriteUint8(AMF.END_OF_OBJECT);
            i += 3;
        }

        return i;
    };

    function _encodeProperties(b, v) {
        var i = 0;

        for (var j = 0; j < v.value.length; j++) {
            var t = v.value[j];
            if (t.key) {
                var key = crypt.stringToByteArray(t.key);
                b.WriteUint16(key.length, false);
                b.Write(key);
                i += 2 + key.length;
            }

            i += AMF.encode(b, v);
        }

        return i;
    }

    AMF.encodeNull = function (b, v) {
        b.WriteUint8(AMF.NULL);
        return 1;
    };

    AMF.encodeUndefined = function (b, v) {
        b.WriteUint8(AMF.UNDEFINED);
        return 1;
    };

    AMF.encodeECMAArray = function (b, v) {
        var i = 3;
        b.WriteUint8(AMF.ECMA_ARRAY);
        b.WriteUint32(v.value.length, false);
        i += _encodeProperties(b, v);
        return i;
    };

    AMF.encodeStrictArray = function (b, v) {
        var i = 3;
        b.WriteUint8(AMF.STRICT_ARRAY);
        b.WriteUint32(v.value.length, false);
        i += _encodeProperties(b, v);
        return i;
    };

    AMF.encodeDate = function (b, v) {
        b.WriteUint8(AMF.DATE);
        b.WriteFloat64(v.value, false);
        b.WriteUint16(v.offset, false);
        return 11;
    };

    AMF.encodeLongString = function (b, v) {
        if (!v.value) {
            return 0;
        }

        var array = crypt.stringToByteArray(v.value);
        b.WriteUint8(AMF.LONG_STRING);
        b.WriteUint32(array.length, false);
        b.Write(array);
        return 5 + array.length;
    };

    AMF.Value = Value;
    utils.AMF = AMF;
})(odd);

