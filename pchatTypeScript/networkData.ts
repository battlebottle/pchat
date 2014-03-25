/// <reference path="core.ts" />
/// <reference path="bufferio.ts" />

module NetworkData
{    

    export interface NetworkDataSendable {
        serialise(writer: BufferIO.ArrayBufferWriter): void
    }

    //base classes

    export class NetworkDataBase {
        static serialise(networkData: NetworkDataSendable) {
            var bw = new BufferIO.ArrayBufferWriter();
            networkData.serialise(bw);
            return bw.toByteArray();
        }

        static deserialiseBuffer(arrayBuffer: ArrayBuffer) {
            var reader = new BufferIO.ArrayBufferReader(arrayBuffer);
            var headerByte = reader.readByte()
            if (headerByte === 0) {return ChatMessage.deserialise(reader);}
            else if (headerByte === 1) { return PersonStartedTyping.deserialise(reader);}
            else if (headerByte === 2) { return PersonStoppedTyping.deserialise(reader);}
            else if (headerByte === 6) { return PeopleInRoom.deserialise(reader);}
            else if (headerByte === 7) { return MessageHistory.deserialise(reader); }
            else if (headerByte === 9) { return RequestNameAccepted.deserialise(reader);}
            else if (headerByte === 10) { return ExtraMedia.deserialise(reader);}
            else if (headerByte === 11) { return Thumbnail.deserialise(reader);}
            else if (headerByte === 12) { return RequestChatConnectionAccepted.deserialise(reader); }
            else if (headerByte === 13) { return RequestChatConnectionRejected.deserialise(reader); }
            else if (headerByte === 14) { return RequestNameRejected.deserialise(reader); }
            else if (headerByte === 15) { return PersonStartedDrawing.deserialise(reader); }
            else if (headerByte === 16) { return PersonStoppedDrawing.deserialise(reader); }
        }
    }
    export class NetworkMessageSpanBase extends NetworkDataBase {
        static deserialise(reader: BufferIO.ArrayBufferReader): NetworkMessageSpanBase {
            var header = reader.readByte();
            if (header === 0) {
                return Text.deserialise(reader);
            }
            else if (header === 1) {
                return Hightlight.deserialise(reader);
            }
            else if (header === 2) {
                return Hyperlink.deserialise(reader);
            }
        }
    }
    export class NetworkMessageTypeBase extends NetworkDataBase {
        static deserialise(reader: BufferIO.ArrayBufferReader) {
            var header = reader.readByte();
            if (header === 0) {
                return Normal.deserialise(reader);
            }
            else if (header === 1) {
                return Server.deserialise(reader);
            }
            else if (header === 2) {
                return Clear.deserialise(reader);
            }
        }
    }
    export class NetworkDataMediaTypeBase extends NetworkDataBase {
        static deserialise(reader: BufferIO.ArrayBufferReader) {
            var header = reader.readByte();
            if (header === 0) {
                return Drawing.deserialise(reader);
            }
            throw "no match found";
        }
    }
    export class NetworkDataImageRefBase extends NetworkDataBase {
        static deserialise(reader: BufferIO.ArrayBufferReader) {
            var header = reader.readByte();
            if (header === 1) {
                return ImageReference.deserialise(reader);
            }
            throw "no match found";
        }
    }

    // /base classes

    export class Person implements NetworkDataBase, NetworkDataSendable {
        constructor(
            public id: number,
            public name: string
            ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeUint32(this.id);
            writer.writeString(this.name);
        }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new Person(reader.readUint32(), reader.readString());
        }
    }

    //  MessageSpan
    export class Text implements NetworkMessageSpanBase, NetworkDataSendable {
            constructor(
            public text: string
                ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(0);
            writer.writeString(this.text);
        }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new Text(reader.readString());
        }
    }

    export class Hightlight implements NetworkMessageSpanBase {
            constructor(
            public text: string
                ) { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new Hightlight(reader.readString());
        }
    }

    export class Hyperlink implements NetworkMessageSpanBase {
            constructor(
                public text: string,
                public url: string
                ) { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new Hyperlink(reader.readString(), reader.readString());
        }
    }

    // /MessageSpan

    //  MessageType
    export class Normal implements NetworkMessageTypeBase, NetworkDataSendable {
            constructor(
            public person: Person
                ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(0);
            this.person.serialise(writer);
        }
        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new Normal(Person.deserialise(reader));
        }
    }

    export class Server implements NetworkMessageTypeBase {
        constructor() { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new Server();
        }
    }

    export class Clear implements NetworkMessageTypeBase {
        constructor() { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new Clear();
        }
    }

    // /MessageType

    export class MessageContent implements NetworkMessageTypeBase, NetworkDataSendable {
        constructor(
            public messageContent: NetworkMessageSpanBase[]) {}

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeUint32(this.messageContent.length);
            for (var i = 0; i < this.messageContent.length; i++) {
                (<Text>this.messageContent[i]).serialise(writer);
            }
        }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new MessageContent(reader.readArray(NetworkMessageSpanBase.deserialise));
        }
    }

    
    export class ChatMessage implements NetworkDataBase, NetworkDataSendable {
        constructor(
            public messageType: NetworkMessageTypeBase,
            public messageContent: MessageContent,      
            public timeStamp: number,
            public hasExtraMedia: boolean,
            public hasThumbnail: boolean,
            public id: number
            ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(0);
            (<Normal>this.messageType).serialise(writer);
            this.messageContent.serialise(writer);
            writer.writeUint64(this.timeStamp);
            writer.writeBool(this.hasThumbnail);
            writer.writeBool(this.hasExtraMedia);
            writer.writeUint32(this.id);
        }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new ChatMessage(
                NetworkMessageTypeBase.deserialise(reader),
                MessageContent.deserialise(reader),
                reader.readUint64(),
                reader.readBool(),
                reader.readBool(),
                reader.readUint32()
                );
        }
    }

    export class PersonStartedTyping implements NetworkDataBase, NetworkDataSendable {
        constructor(
            public person: Person
            ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(1);
            this.person.serialise(writer);
        }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new PersonStartedTyping(Person.deserialise(reader));
        }
    }

    export class PersonStoppedTyping implements NetworkDataBase, NetworkDataSendable {
        constructor(
            public person: Person
            ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(2);
            this.person.serialise(writer);
        }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new PersonStoppedTyping(Person.deserialise(reader));
        }
    }

    export class PersonStartedDrawing implements NetworkDataBase, NetworkDataSendable {
        constructor(
            public person: Person
            ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(15);
            this.person.serialise(writer);
        }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new PersonStartedDrawing(Person.deserialise(reader));
        }
    }

    export class PersonStoppedDrawing implements NetworkDataBase, NetworkDataSendable {
        constructor(
            public person: Person
            ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(16);
            this.person.serialise(writer);
        }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new PersonStoppedDrawing(Person.deserialise(reader));
        }
    }
    
    export class PersonAway implements NetworkDataBase {
        constructor(
            public person: Person 
            ) { }
    }
    
    export class PersonNotAway implements NetworkDataBase {
        constructor(
            public person: Person 
        ){}
    }
    
    export class Theme implements NetworkDataBase {
        constructor(
            public theme: string 
        ){}
    }

    export class PeopleInRoom implements NetworkDataBase {
        constructor(
            public people: Person[]
            ) { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new PeopleInRoom(reader.readArray(Person.deserialise));
        }
    }

    export class MessageHistory implements NetworkDataBase {
        constructor(
            public messages: ChatMessage[],
            public thumbnails: Thumbnail[],
            public extraMedia: ExtraMedia[]
            ) { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new MessageHistory(
                reader.readArray<ChatMessage>(ChatMessage.deserialise),
                reader.readArray<Thumbnail>(Thumbnail.deserialise),
                reader.readArray<ExtraMedia>(ExtraMedia.deserialise)
                );
        }
    }

    export class ServerTime implements NetworkDataBase {
        constructor(
            public timeStamp: number
        ) { }
    }

    export class RequestName implements NetworkDataBase, NetworkDataSendable {
        constructor(
            public name: string
            ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(3);
            writer.writeString(this.name);
        }
    }

    export class RequestNameAccepted implements NetworkDataBase {
        constructor(
            public person: Person
            ) { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new RequestNameAccepted(Person.deserialise(reader));
        }
    }

    export class RequestNameRejected implements NetworkDataBase {
        constructor(
            public reason: string
            ) { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new RequestNameRejected(reader.readString());
        }
    }

    export class Thumbnail implements NetworkDataBase {
        constructor(
            public id: number,
            public data: ImageReference
            ) { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new Thumbnail(reader.readUint32(), ImageReference.deserialise(reader));
        }
    }

    export class RequestChatConnection implements NetworkDataBase, NetworkDataSendable {
        constructor(
            public roomNumber: number
            ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(5);
            writer.writeUint32(this.roomNumber);
        }
    }

    export class RequestChatConnectionRejected implements NetworkDataBase {
        constructor(
            public reason: string) { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new RequestChatConnectionRejected(reader.readString());
        }
    }

    export class RequestChatConnectionAccepted implements NetworkDataBase {
        constructor() { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new RequestChatConnectionAccepted();
        }
    }

    export class ExtraMedia implements NetworkDataBase, NetworkDataSendable {
        constructor(
            public id: number,
            public extraMedia: NetworkDataMediaTypeBase
            ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(4);
            writer.writeUint32(this.id);
            (<Drawing>this.extraMedia).serialise(writer);
        }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new ExtraMedia(reader.readUint32(), NetworkDataMediaTypeBase.deserialise(reader));
        }
    }

    //media types:

    export class Image implements NetworkDataMediaTypeBase {
        constructor(
            public imageData: Uint8Array
            ) { }
    }

    export class Drawing implements NetworkDataMediaTypeBase, NetworkDataSendable {
        constructor(
            public drawingData: NetworkDataImageRefBase
            ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(0);
            (<ImageEmbdedded>this.drawingData).serialise(writer);
        }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new Drawing(NetworkDataImageRefBase.deserialise(reader));
        }
    }

    export class ImageReference implements NetworkDataImageRefBase {
        constructor(
            public reference: number
            ) { }

        static deserialise(reader: BufferIO.ArrayBufferReader) {
            return new ImageReference(reader.readUint32());
        }
    }

    export class ImageEmbdedded implements NetworkDataImageRefBase, NetworkDataSendable {
        constructor(
            public embedded: Uint8Array
            ) { }

        serialise(writer: BufferIO.ArrayBufferWriter) {
            writer.writeByte(0);
            writer.writeByteArray(this.embedded);
        }
    }

    export class TwitterMedia implements NetworkDataMediaTypeBase  {
        constructor(
            public title: string,
            public description: string,
            public image: Maybe<Uint8Array>
            ) { }
    }

    export class TwitterSummary implements NetworkDataMediaTypeBase  {
        constructor(
            public twitterMedia: TwitterMedia
            ) { }
    }

    export class TwitterVideo implements NetworkDataMediaTypeBase {
        constructor(
            public twitterMedia: TwitterMedia,
            public videoIFrame: string,
            public size : Size
            ) { }
    }
}