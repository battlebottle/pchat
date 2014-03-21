/// <reference path="core.ts" />
var BufferIO;
(function (BufferIO) {
    var ArrayBufferReader = (function () {
        function ArrayBufferReader(arrayBuffer) {
            this.arrayBuffer = arrayBuffer;
            this.position = 0;
        }
        ArrayBufferReader.prototype.bin2String = function (array) {
            var result = "";
            for (var i = 0; i < array.length; i++) {
                result += String.fromCharCode(array[i]);
            }
            return result;
        };

        ArrayBufferReader.prototype.readBuffer = function (byteLength) {
            var uint8Array = new Uint8Array(byteLength);
            var mainByteBuffer = new Uint8Array(this.arrayBuffer);
            for (var i = 0; i < byteLength; i++) {
                uint8Array[i] = mainByteBuffer[i + this.position];
            }
            this.position = this.position + byteLength;
            return uint8Array.buffer;
        };

        ArrayBufferReader.prototype.readByte = function () {
            var byteArray = new Uint8Array(this.arrayBuffer, this.position, 1);
            this.position = this.position + 1;
            return byteArray[0];
        };

        ArrayBufferReader.prototype.readBool = function () {
            return this.readByte() !== 0;
        };

        ArrayBufferReader.prototype.readUint32 = function (this__) {
            if (typeof this__ === "undefined") { this__ = this; }
            return new Uint32Array(this__.readBuffer(4))[0];
        };

        ArrayBufferReader.prototype.readUint64 = function () {
            //let time3 = (uint64 time1) + ((uint64 time2) <<< 32)
            var n1 = this.readUint32();
            var n2 = this.readUint32();
            var nshift = n2 * 4294967296.0;
            return n1 + nshift;
        };

        ArrayBufferReader.prototype.readString = function () {
            var length = this.readUint32();
            var uint16Array = new Uint16Array(this.readBuffer(length * 2));
            return bin2String(uint16Array);
        };

        ArrayBufferReader.prototype.readMaybe = function (valueReader) {
            var isSome = this.readBool();
            if (isSome) {
                return new Maybe(valueReader(this));
            } else {
                return Maybe.createNone();
            }
        };

        ArrayBufferReader.prototype.readArray = function (readFunc) {
            var array = [];
            var count = this.readUint32();
            for (var i = 0; i < count; i++) {
                array.push(readFunc(this));
            }
            return array;
        };

        ArrayBufferReader.prototype.readByteArray = function () {
            var length = this.readUint32();
            var byteArray = new Uint8Array(length);
            for (var i = 0; i < length; i++) {
                byteArray[i] = this.readByte();
            }
            return byteArray;
        };
        return ArrayBufferReader;
    })();
    BufferIO.ArrayBufferReader = ArrayBufferReader;

    var ArrayBufferWriter = (function () {
        function ArrayBufferWriter() {
            this.position = 0;
            this.arrayBuffer = new ArrayBuffer(256);
        }
        ArrayBufferWriter.prototype.expandBufferFor = function (num) {
            var newBufferMinLength = num + this.position;
            if (newBufferMinLength > this.arrayBuffer.byteLength) {
                var newBufferLength = this.arrayBuffer.byteLength;
                while (newBufferLength < newBufferMinLength) {
                    newBufferLength = newBufferLength * 2;
                }
                var newBufferArray = new Uint8Array(newBufferLength);
                var oldBufferArray = new Uint8Array(this.arrayBuffer);
                for (var i = 0; i < oldBufferArray.length; i++) {
                    newBufferArray[i] = oldBufferArray[i];
                }
                this.arrayBuffer = newBufferArray.buffer;
            }
        };

        ArrayBufferWriter.prototype.copyBufferToMainBuffer = function (buffer) {
            var byteArray = new Uint8Array(buffer);
            this.expandBufferFor(byteArray.length);
            var mainByteArray = new Uint8Array(this.arrayBuffer);

            for (var i = 0; i < byteArray.length; i++) {
                mainByteArray[i + this.position] = byteArray[i];
            }
            this.position = this.position + byteArray.length;
        };

        ArrayBufferWriter.prototype.writeByte = function (num) {
            var uint8Array = new Uint8Array(1);
            uint8Array[0] = num;
            this.copyBufferToMainBuffer(uint8Array.buffer);
        };

        ArrayBufferWriter.prototype.writeBool = function (value) {
            var boolToByte = function (value) {
                if (value) {
                    return 1;
                } else {
                    return 0;
                }
            };
            this.writeByte(boolToByte(value));
        };

        ArrayBufferWriter.prototype.writeMaybe = function (maybe, valueWriter) {
            this.writeBool(maybe.isSome());
            if (maybe.isSome()) {
                valueWriter(maybe.getValue(), this);
            }
        };

        ArrayBufferWriter.prototype.writeUint32 = function (num, this__) {
            if (typeof this__ === "undefined") { this__ = this; }
            var uint32Array = new Uint32Array(1);
            uint32Array[0] = num;
            this__.copyBufferToMainBuffer(uint32Array.buffer);
        };

        ArrayBufferWriter.prototype.writeUint64 = function (num, this__) {
            if (typeof this__ === "undefined") { this__ = this; }
            this__.writeUint32(0, this__);
            this__.writeUint32(0, this__);
        };

        ArrayBufferWriter.prototype.writeString = function (str) {
            this.writeUint32(str.length);
            var uint16Array = new Uint16Array(str.length);

            for (var i = 0; i < str.length; i++) {
                uint16Array[i] = str.charCodeAt(i);
            }
            this.copyBufferToMainBuffer(uint16Array.buffer);
        };

        ArrayBufferWriter.prototype.writeByteArray = function (byteArray) {
            this.writeUint32(byteArray.length);
            for (var i = 0; i < byteArray.length; i++) {
                this.writeByte(byteArray[i]);
            }
        };

        ArrayBufferWriter.prototype.toByteArray = function () {
            return new Uint8Array(this.arrayBuffer, 0, this.position);
        };
        return ArrayBufferWriter;
    })();
    BufferIO.ArrayBufferWriter = ArrayBufferWriter;
})(BufferIO || (BufferIO = {}));
//# sourceMappingURL=bufferio.js.map
