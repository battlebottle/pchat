/// <reference path="core.ts" />
module BufferIO {
    export class ArrayBufferReader {    
        private position = 0
    
        constructor(private arrayBuffer: ArrayBuffer) {    
        }  
    
        private bin2String(array: Uint16Array) {
            var result = "";
            for (var i = 0; i < array.length; i++) {
                result += String.fromCharCode(array[i]);
            }
            return result;
        }
    
        private readBuffer(byteLength: number) {
            var uint8Array = new Uint8Array(byteLength);
            var mainByteBuffer = new Uint8Array(this.arrayBuffer);
            for (var i = 0; i < byteLength; i++) {
                uint8Array[i] = mainByteBuffer[i + this.position];
            }
            this.position = this.position + byteLength;
            return uint8Array.buffer
        }
    
        readByte() {
            var byteArray = <Uint8Array> new Uint8Array(this.arrayBuffer, this.position, 1);
            this.position = this.position + 1;
            return byteArray[0];
        }

        readBool() {
            return this.readByte() !== 0;
        }
    
        readUint32(this__ = this) {
            return (<Uint32Array> new Uint32Array(this__.readBuffer(4)))[0]
        }

        readUint64() {            
            //let time3 = (uint64 time1) + ((uint64 time2) <<< 32)
            var n1 = this.readUint32();
            var n2 = this.readUint32();
            var nshift = n2 * 4294967296.0;
            return n1 + nshift;
        }
            
        readString() {
            var length = this.readUint32()
            var uint16Array = <Uint16Array> new Uint16Array(this.readBuffer(length * 2));
            return bin2String(uint16Array);
        }

        readMaybe<T>(valueReader: (reader : ArrayBufferReader) => T) {
            var isSome = this.readBool();
            if (isSome) {
                return new Maybe<T>(valueReader(this));
            } else {
                return Maybe.createNone<T>()
            }
        }
    
        readArray<T>(readFunc : (ArrayBufferReader) => T){            
            var array: T[] = [];
            var count = this.readUint32();
            for (var i = 0; i < count; i++) {
                array.push(readFunc(this))
            }
            return array;
        }

        readByteArray() {
            var length = this.readUint32();
            var byteArray = new Uint8Array(length);
            for (var i = 0; i < length; i++) {
                byteArray[i] = this.readByte();
            }
            return byteArray;
        }
    }
    
    
    export class ArrayBufferWriter {
        private position = 0;
        private arrayBuffer = new ArrayBuffer(256);

        private expandBufferFor(num: number) {
            var newBufferMinLength = num + this.position;
            if (newBufferMinLength > this.arrayBuffer.byteLength) {
                var newBufferLength = this.arrayBuffer.byteLength;
                while (newBufferLength < newBufferMinLength) {
                    newBufferLength = newBufferLength * 2;
                }
                var newBufferArray = new Uint8Array(newBufferLength)
                var oldBufferArray = new Uint8Array(this.arrayBuffer)
                for (var i = 0; i < oldBufferArray.length; i++) {
                    newBufferArray[i] = oldBufferArray[i];
                }
                this.arrayBuffer = newBufferArray.buffer;
            }
        }
    
        private copyBufferToMainBuffer(buffer: ArrayBuffer) {
            var byteArray = <Uint8Array> new Uint8Array(buffer);
            this.expandBufferFor(byteArray.length);
            var mainByteArray = <Uint8Array> new Uint8Array(this.arrayBuffer);

            for (var i = 0; i < byteArray.length; i++) {
                mainByteArray[i + this.position] = byteArray[i];
            }
            this.position = this.position + byteArray.length;
        }

        writeByte(num: number) {
            var uint8Array = new Uint8Array(1);
            uint8Array[0] = num;
            this.copyBufferToMainBuffer(uint8Array.buffer);
        }

        writeBool(value: boolean) {
            var boolToByte = (value: boolean) => {
                if (value) {
                    return 1;
                } else {
                    return 0;
                }
            }
            this.writeByte(boolToByte(value));
        }

        writeMaybe<T>(maybe: Maybe<T>, valueWriter: (value:T, ths: ArrayBufferWriter) => any) {
            this.writeBool(maybe.isSome())
            if (maybe.isSome()) {
                valueWriter(maybe.getValue(), this);
            }
        }

        writeUint32(num: number, this__ = this) {
            var uint32Array = new Uint32Array(1);
            uint32Array[0] = num;
            this__.copyBufferToMainBuffer(uint32Array.buffer);
        }

        writeUint64(num: number, this__ = this) {
            this__.writeUint32(0, this__);
            this__.writeUint32(0, this__);
        }
    
        writeString(str : string) {
            this.writeUint32(str.length)
            var uint16Array = new Uint16Array(str.length);
    
            for (var i = 0; i < str.length; i++) {
                uint16Array[i] = str.charCodeAt(i)
            }
            this.copyBufferToMainBuffer(uint16Array.buffer);
        }

        writeByteArray(byteArray: Uint8Array) {
            this.writeUint32(byteArray.length);
            for (var i = 0; i < byteArray.length; i++) {
                this.writeByte(byteArray[i]);
            }
        }
    
        toByteArray() {
            return new Uint8Array(this.arrayBuffer, 0, this.position)
        }
    }


}