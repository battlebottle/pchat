/// <reference path="core.ts" />

module NetworkData
{    
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
    
        readPerson() {
            return new Person(this.readUint32() ,this.readString());
        }

        readMessageSpan(): NetworkMessageSpan {
            var header = this.readByte();
            if (header === 0) {
                return new Text(this.readString());
            }
            else if (header === 1) {
                return new Hightlight(this.readString());
            }
            else if (header === 2) {
                return new Hyperlink(this.readString(), this.readString());
            }
            throw "no match found";
        }

        readMessageSpans() {
            var networkSpans: NetworkMessageSpan[] = [];
            var count = this.readUint32();
            for (var i = 0; i < count; i++) {
                networkSpans.push(this.readMessageSpan())
            }
            return networkSpans;
        }

        readMessageType(): NetworkMessageType {
            var header = this.readByte();
            if (header === 0) {
                return new Normal(this.readPerson());
            }
            else if (header === 1) {
                return new Server();
            }
            else if (header === 2) {
                return new Clear();
            }
            throw "no match found";
        }
    
        readChatMessage() {
            return new ChatMessage(
                this.readMessageType(),
                this.readMessageSpans(),
                this.readUint32(),
                this.readBool(),
                this.readBool(),
                this.readUint32()
                );
        }
    
        readPersonStartedTyping() {
            return new PersonStartedTyping(this.readPerson());
        }
    
        readPersonStoppedTyping() {
            return new PersonStoppedTyping(this.readPerson());
        }
    
        readPersonAway() {
            return new PersonAway(this.readPerson());
        }
    
        readPersonNotAway() {
            return new PersonNotAway(this.readPerson());
        }

        readPeopleInRoom() {
            var peopleInRoom: Person[] = [];
            var count = this.readUint32();
            for (var i = 0; i < count; i++) {
                peopleInRoom.push(this.readPerson())
            }
            return new PeopleInRoom(peopleInRoom);
        }

        readMessageHistory() {
            var messageHistory: ChatMessage[] = [];
            var count = this.readUint32();
            for (var i = 0; i < count; i++) {
                messageHistory.push(this.readChatMessage())
            }
            return new MessageHistory(messageHistory);
        }

        readServerTime() {
            return new ServerTime(this.readUint32());
        }

        readRequestName() {
            return new RequestName(this.readString());
        }

        readRequestNameAccepted() {
            return new RequestNameAccepted(this.readPerson());
        }   

        readRequestNameRejected() {
            return new RequestNameRejected(this.readString());
        }

        readByteArray() {
            var length = this.readUint32();
            var byteArray = new Uint8Array(length);
            for (var i = 0; i < length; i++) {
                byteArray[i] = this.readByte();
            }
            return byteArray;
        }

        readMediaType() {
            var header = this.readByte();
            if (header === 0) {
                return new Drawing(this.readByteArray());
            }
            throw "no match found";
        }

        readExtraMedia() {
            return new ExtraMedia(this.readUint32(), this.readMediaType());
        }

        readThumbnail() {
            return new Thumbnail(this.readUint32(), this.readByteArray());
        }

        readRequestChatConnectionAccepted() {
            return new RequestChatConnectionAccepted();
        }

        readRequestChatConnectionRejected() {
            return new RequestChatConnectionRejected(this.readString());
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
    
        writeString(str : string) {
            this.writeUint32(str.length)
            var uint16Array = new Uint16Array(str.length);
    
            for (var i = 0; i < str.length; i++) {
                uint16Array[i] = str.charCodeAt(i)
            }
            this.copyBufferToMainBuffer(uint16Array.buffer);
        }
    
        writePerson(person: Person) {
            this.writeUint32(person.id);
            this.writeString(person.name);
        }

        writeMessageType(messageType: NetworkMessageType) {
            if (messageType.messageTypeType === INetworkMessageType.Normal) {
                var normal = <Normal>messageType;
                this.writeByte(0);
                this.writePerson(normal.person);
            } else {
                throw "no match found";
            }
        }

        writeMessageSpan(messageSpan: NetworkMessageSpan) {
            if (messageSpan.messageSpanType === INetworkMessageSpan.Text) {
                var text = <Text>messageSpan;
                this.writeByte(0);
                this.writeString(text.text);
            } else {
                throw "no match found";
            }
        }

        writeMessageContent(messageSpans: NetworkMessageSpan[]) {
            this.writeUint32(messageSpans.length);
            for (var i = 0; i < messageSpans.length; i++) {
                this.writeMessageSpan(messageSpans[i]);
            }
        }
    
        writeChatMessage(chatMessage: ChatMessage) {
            this.writeByte(0);
            this.writeMessageType(chatMessage.messageType);
            this.writeMessageContent(chatMessage.messageContent);
            this.writeUint32(chatMessage.timeStamp);
            this.writeBool(chatMessage.hasThumbnail);
            this.writeBool(chatMessage.hasExtraMedia);
            this.writeUint32(chatMessage.id);
        }

        writePersonStartedTyping(personST: PersonStartedTyping) {
            this.writeByte(1);
            this.writePerson(personST.person);
        }

        writePersonStoppedTyping(personST: PersonStoppedTyping) {
            this.writeByte(2);
            this.writePerson(personST.person);
        }

        writeRequestName(requestName: RequestName) {
            this.writeByte(3);
            this.writeString(requestName.name);
        }

        writeByteArray(byteArray: Uint8Array) {
            this.writeUint32(byteArray.length);
            for (var i = 0; i < byteArray.length; i++) {
                this.writeByte(byteArray[i]);
            }
        }


        writeMediaType(mediaType: NetworkDataMediaType) {
            if (mediaType.mediaType === INetworkMediaType.Drawing) {
                var drawing = <Drawing>mediaType;
                this.writeByte(0);
                this.writeByteArray(drawing.drawingData);
            }
        }

        writeExtraMedia(extraMedia: ExtraMedia) {
            this.writeByte(4);
            this.writeUint32(extraMedia.id);
            this.writeMediaType(extraMedia.extraMedia);
        }

        writeRequestChatConnectionName(requestChatConnection: RequestChatConnection) {
            this.writeByte(5);
            this.writeUint32(requestChatConnection.roomNumber);
        }
    
        toByteArray() {
            return new Uint8Array(this.arrayBuffer, 0, this.position)
        }
    }



    export enum INetworkData {
        Person,
        ChatMessage,
        PersonStartedTyping,
        PersonStoppedTyping,
        PersonAway,
        PersonNotAway,
        Theme,
        PeopleInRoom,
        MessageHistory,
        ServerTime,
        RequestName,
        RequestNameAccepted,
        RequestNameRejected,
        Thumbnail,
        ExtraMedia,
        RequestChatConnection,
        RequestChatConnectionAccepted,
        RequestChatConnectionRejected
    }

    export enum INetworkMediaType {
        Image,
        Drawing,
        TwitterSummary,
        TwitterVideo
    }

    export enum INetworkMessageSpan {
        Text,
        Hightlight,
        Hyperlink
    }

    export enum INetworkMessageType {
        Normal,
        Server,
        Clear
    }

    export interface NetworkData {
        type: INetworkData
    }

    export interface NetworkDataMediaType {
        mediaType: INetworkMediaType
    }

    export interface NetworkMessageSpan {
        messageSpanType: INetworkMessageSpan
    }

    export interface NetworkMessageType {
        messageTypeType: INetworkMessageType
    }

    export interface NetworkDataSendable {
        serialise(): Uint8Array
    }
    export interface NetworkDataMediaTypeSendable {
        mediaType: INetworkMediaType
        serialise(): Uint8Array
    }

    export class Person implements NetworkData, NetworkDataSendable {
        type = INetworkData.Person
        constructor(
            public id: number,
            public name: string
            ) { }

        serialise() {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writePerson(this);
            return bw.toByteArray();
        }
    }

    //  MessageSpan
    export class Text implements NetworkMessageSpan {
        messageSpanType = INetworkMessageSpan.Text
            constructor(
            public text: string
                ) { }
    }

    export class Hightlight implements NetworkMessageSpan {
        messageSpanType = INetworkMessageSpan.Hightlight
            constructor(
            public text: string
            ) { }
    }

    export class Hyperlink implements NetworkMessageSpan {
        messageSpanType = INetworkMessageSpan.Hyperlink
            constructor(
                public text: string,
                public url: string
                ) { }
    }

    // /MessageSpan

    //  MessageType
    export class Normal implements NetworkMessageType {
        messageTypeType = INetworkMessageType.Normal
            constructor(
            public person: Person
                ) { }
    }

    export class Server implements NetworkMessageType {
        messageTypeType = INetworkMessageType.Server
            constructor() { }
    }

    export class Clear implements NetworkMessageType {
        messageTypeType = INetworkMessageType.Clear
            constructor() { }
    }

    // /MessageType
    
    export class ChatMessage implements NetworkData, NetworkDataSendable {
        type = INetworkData.ChatMessage
        constructor(
            public messageType: NetworkMessageType,
            public messageContent: NetworkMessageSpan[],      
            public timeStamp: number,
            public hasExtraMedia: boolean,
            public hasThumbnail: boolean,
            public id: number
            ) { }

        serialise() {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writeChatMessage(this);
            return bw.toByteArray();
        }
    }
    
    export class PersonStartedTyping implements NetworkData, NetworkDataSendable {
        type = INetworkData.PersonStartedTyping
        constructor(
            public person: Person 
            ) { }

        serialise() {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writePersonStartedTyping(this);
            return bw.toByteArray();
        }
    }
    
    export class PersonStoppedTyping implements NetworkData, NetworkDataSendable {
        type = INetworkData.PersonStoppedTyping
        constructor(
            public person: Person 
            ) { }

        serialise() {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writePersonStoppedTyping(this);
            return bw.toByteArray();
        }
    }
    
    export class PersonAway implements NetworkData {
        type = INetworkData.PersonAway
        constructor(
            public person: Person 
            ) { }
    }
    
    export class PersonNotAway implements NetworkData {
        type = INetworkData.PersonNotAway
        constructor(
            public person: Person 
        ){}
    }
    
    export class Theme implements NetworkData {
        type = INetworkData.Theme
        constructor(
            public theme: string 
        ){}
    }

    export class PeopleInRoom implements NetworkData {
        type = INetworkData.PeopleInRoom
        constructor(
            public people: Person[]
        ){}
    }

    export class MessageHistory implements NetworkData {
        type = INetworkData.MessageHistory
        constructor(
            public messages: ChatMessage[]
        ){}
    }

    export class ServerTime implements NetworkData {
        type = INetworkData.PersonNotAway
        constructor(
            public timeStamp: number
        ) { }
    }

    export class RequestName implements NetworkData, NetworkDataSendable {
        type = INetworkData.RequestName
        constructor(
            public name: string
            ) { }

        serialise() {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writeRequestName(this);
            return bw.toByteArray();
        }
    }

    export class RequestNameAccepted implements NetworkData {
        type = INetworkData.RequestNameAccepted
        constructor(
            public person: Person
            ) { }
    }

    export class RequestNameRejected implements NetworkData {
        type = INetworkData.RequestNameRejected
        constructor(
            public reason: string
            ) { }
    }

    export class Thumbnail implements NetworkData {
        type = INetworkData.Thumbnail
        constructor(
            public id: number,
            public data: Uint8Array
            ) { }
    }

    export class RequestChatConnection implements NetworkData, NetworkDataSendable {
        type = INetworkData.RequestChatConnection
        constructor(
            public roomNumber: number
            ) { }

        serialise() {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writeRequestChatConnectionName(this);
            return bw.toByteArray();
        }
    }

    export class RequestChatConnectionRejected implements NetworkData {
        type = INetworkData.RequestChatConnectionRejected
        constructor(
            public reason: string) {}
    }

    export class RequestChatConnectionAccepted implements NetworkData {
        type = INetworkData.RequestChatConnectionAccepted
        constructor() { }
    }

    export class ExtraMedia implements NetworkData, NetworkDataSendable {
        type = INetworkData.ExtraMedia
        constructor(
            public id: number,
            public extraMedia: NetworkDataMediaType
            ) { }

        serialise() {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writeExtraMedia(this);
            return bw.toByteArray();
        }
    }

    //media types:

    export class Image implements NetworkDataMediaType {
        mediaType = INetworkMediaType.Image
        constructor(
            public imageData: Uint8Array
            ) { }
    }

    export class Drawing implements NetworkDataMediaType {
        mediaType = INetworkMediaType.Drawing
        constructor(
            public drawingData: Uint8Array
            ) { }
    }

    export class TwitterMedia {
        constructor(
            public title: string,
            public description: string,
            public image: Maybe<Uint8Array>
            ) { }
    }

    export class TwitterSummary implements NetworkDataMediaType {
        mediaType = INetworkMediaType.TwitterSummary
        constructor(
            public twitterMedia: TwitterMedia
            ) { }
    }

    export class TwitterVideo implements NetworkDataMediaType {
        mediaType = INetworkMediaType.TwitterVideo
        constructor(
            public twitterMedia: TwitterMedia,
            public videoIFrame: string,
            public size : Size
            ) { }
    }



}