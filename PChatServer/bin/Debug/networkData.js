/// <reference path="core.ts" />
/// <reference path="bufferio.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var NetworkData;
(function (NetworkData) {
    //base classes
    var NetworkDataBase = (function () {
        function NetworkDataBase() {
        }
        NetworkDataBase.serialise = function (networkData) {
            var bw = new BufferIO.ArrayBufferWriter();
            networkData.serialise(bw);
            return bw.toByteArray();
        };

        NetworkDataBase.deserialiseBuffer = function (arrayBuffer) {
            var reader = new BufferIO.ArrayBufferReader(arrayBuffer);
            var headerByte = reader.readByte();
            if (headerByte === 0) {
                return ChatMessage.deserialise(reader);
            } else if (headerByte === 1) {
                return PersonStartedTyping.deserialise(reader);
            } else if (headerByte === 2) {
                return PersonStoppedTyping.deserialise(reader);
            } else if (headerByte === 6) {
                return PeopleInRoom.deserialise(reader);
            } else if (headerByte === 7) {
                return MessageHistory.deserialise(reader);
            } else if (headerByte === 9) {
                return RequestNameAccepted.deserialise(reader);
            } else if (headerByte === 10) {
                return ExtraMedia.deserialise(reader);
            } else if (headerByte === 11) {
                return Thumbnail.deserialise(reader);
            } else if (headerByte === 12) {
                return RequestChatConnectionAccepted.deserialise(reader);
            } else if (headerByte === 13) {
                return RequestChatConnectionRejected.deserialise(reader);
            } else if (headerByte === 14) {
                return RequestNameRejected.deserialise(reader);
            } else if (headerByte === 15) {
                return PersonStartedDrawing.deserialise(reader);
            } else if (headerByte === 16) {
                return PersonStoppedDrawing.deserialise(reader);
            }
        };
        return NetworkDataBase;
    })();
    NetworkData.NetworkDataBase = NetworkDataBase;
    var NetworkMessageSpanBase = (function (_super) {
        __extends(NetworkMessageSpanBase, _super);
        function NetworkMessageSpanBase() {
            _super.apply(this, arguments);
        }
        NetworkMessageSpanBase.deserialise = function (reader) {
            var header = reader.readByte();
            if (header === 0) {
                return Text.deserialise(reader);
            } else if (header === 1) {
                return Hightlight.deserialise(reader);
            } else if (header === 2) {
                return Hyperlink.deserialise(reader);
            }
        };
        return NetworkMessageSpanBase;
    })(NetworkDataBase);
    NetworkData.NetworkMessageSpanBase = NetworkMessageSpanBase;
    var NetworkMessageTypeBase = (function (_super) {
        __extends(NetworkMessageTypeBase, _super);
        function NetworkMessageTypeBase() {
            _super.apply(this, arguments);
        }
        NetworkMessageTypeBase.deserialise = function (reader) {
            var header = reader.readByte();
            if (header === 0) {
                return Normal.deserialise(reader);
            } else if (header === 1) {
                return Server.deserialise(reader);
            } else if (header === 2) {
                return Clear.deserialise(reader);
            }
        };
        return NetworkMessageTypeBase;
    })(NetworkDataBase);
    NetworkData.NetworkMessageTypeBase = NetworkMessageTypeBase;
    var NetworkDataMediaTypeBase = (function (_super) {
        __extends(NetworkDataMediaTypeBase, _super);
        function NetworkDataMediaTypeBase() {
            _super.apply(this, arguments);
        }
        NetworkDataMediaTypeBase.deserialise = function (reader) {
            var header = reader.readByte();
            if (header === 0) {
                return Drawing.deserialise(reader);
            }
            throw "no match found";
        };
        return NetworkDataMediaTypeBase;
    })(NetworkDataBase);
    NetworkData.NetworkDataMediaTypeBase = NetworkDataMediaTypeBase;
    var NetworkDataImageRefBase = (function (_super) {
        __extends(NetworkDataImageRefBase, _super);
        function NetworkDataImageRefBase() {
            _super.apply(this, arguments);
        }
        NetworkDataImageRefBase.deserialise = function (reader) {
            var header = reader.readByte();
            if (header === 1) {
                return ImageReference.deserialise(reader);
            }
            throw "no match found";
        };
        return NetworkDataImageRefBase;
    })(NetworkDataBase);
    NetworkData.NetworkDataImageRefBase = NetworkDataImageRefBase;

    // /base classes
    var Person = (function () {
        function Person(id, name) {
            this.id = id;
            this.name = name;
        }
        Person.prototype.serialise = function (writer) {
            writer.writeUint32(this.id);
            writer.writeString(this.name);
        };

        Person.deserialise = function (reader) {
            return new Person(reader.readUint32(), reader.readString());
        };
        return Person;
    })();
    NetworkData.Person = Person;

    //  MessageSpan
    var Text = (function () {
        function Text(text) {
            this.text = text;
        }
        Text.prototype.serialise = function (writer) {
            writer.writeByte(0);
            writer.writeString(this.text);
        };

        Text.deserialise = function (reader) {
            return new Text(reader.readString());
        };
        return Text;
    })();
    NetworkData.Text = Text;

    var Hightlight = (function () {
        function Hightlight(text) {
            this.text = text;
        }
        Hightlight.deserialise = function (reader) {
            return new Hightlight(reader.readString());
        };
        return Hightlight;
    })();
    NetworkData.Hightlight = Hightlight;

    var Hyperlink = (function () {
        function Hyperlink(text, url) {
            this.text = text;
            this.url = url;
        }
        Hyperlink.deserialise = function (reader) {
            return new Hyperlink(reader.readString(), reader.readString());
        };
        return Hyperlink;
    })();
    NetworkData.Hyperlink = Hyperlink;

    // /MessageSpan
    //  MessageType
    var Normal = (function () {
        function Normal(person) {
            this.person = person;
        }
        Normal.prototype.serialise = function (writer) {
            writer.writeByte(0);
            this.person.serialise(writer);
        };
        Normal.deserialise = function (reader) {
            return new Normal(Person.deserialise(reader));
        };
        return Normal;
    })();
    NetworkData.Normal = Normal;

    var Server = (function () {
        function Server() {
        }
        Server.deserialise = function (reader) {
            return new Server();
        };
        return Server;
    })();
    NetworkData.Server = Server;

    var Clear = (function () {
        function Clear() {
        }
        Clear.deserialise = function (reader) {
            return new Clear();
        };
        return Clear;
    })();
    NetworkData.Clear = Clear;

    // /MessageType
    var MessageContent = (function () {
        function MessageContent(messageContent) {
            this.messageContent = messageContent;
        }
        MessageContent.prototype.serialise = function (writer) {
            writer.writeUint32(this.messageContent.length);
            for (var i = 0; i < this.messageContent.length; i++) {
                this.messageContent[i].serialise(writer);
            }
        };

        MessageContent.deserialise = function (reader) {
            return new MessageContent(reader.readArray(NetworkMessageSpanBase.deserialise));
        };
        return MessageContent;
    })();
    NetworkData.MessageContent = MessageContent;

    var ChatMessage = (function () {
        function ChatMessage(messageType, messageContent, timeStamp, hasExtraMedia, hasThumbnail, id) {
            this.messageType = messageType;
            this.messageContent = messageContent;
            this.timeStamp = timeStamp;
            this.hasExtraMedia = hasExtraMedia;
            this.hasThumbnail = hasThumbnail;
            this.id = id;
        }
        ChatMessage.prototype.serialise = function (writer) {
            writer.writeByte(0);
            this.messageType.serialise(writer);
            this.messageContent.serialise(writer);
            writer.writeUint64(this.timeStamp);
            writer.writeBool(this.hasThumbnail);
            writer.writeBool(this.hasExtraMedia);
            writer.writeUint32(this.id);
        };

        ChatMessage.deserialise = function (reader) {
            return new ChatMessage(NetworkMessageTypeBase.deserialise(reader), MessageContent.deserialise(reader), reader.readUint64(), reader.readBool(), reader.readBool(), reader.readUint32());
        };
        return ChatMessage;
    })();
    NetworkData.ChatMessage = ChatMessage;

    var PersonStartedTyping = (function () {
        function PersonStartedTyping(person) {
            this.person = person;
        }
        PersonStartedTyping.prototype.serialise = function (writer) {
            writer.writeByte(1);
            this.person.serialise(writer);
        };

        PersonStartedTyping.deserialise = function (reader) {
            return new PersonStartedTyping(Person.deserialise(reader));
        };
        return PersonStartedTyping;
    })();
    NetworkData.PersonStartedTyping = PersonStartedTyping;

    var PersonStoppedTyping = (function () {
        function PersonStoppedTyping(person) {
            this.person = person;
        }
        PersonStoppedTyping.prototype.serialise = function (writer) {
            writer.writeByte(2);
            this.person.serialise(writer);
        };

        PersonStoppedTyping.deserialise = function (reader) {
            return new PersonStoppedTyping(Person.deserialise(reader));
        };
        return PersonStoppedTyping;
    })();
    NetworkData.PersonStoppedTyping = PersonStoppedTyping;

    var PersonStartedDrawing = (function () {
        function PersonStartedDrawing(person) {
            this.person = person;
        }
        PersonStartedDrawing.prototype.serialise = function (writer) {
            writer.writeByte(15);
            this.person.serialise(writer);
        };

        PersonStartedDrawing.deserialise = function (reader) {
            return new PersonStartedDrawing(Person.deserialise(reader));
        };
        return PersonStartedDrawing;
    })();
    NetworkData.PersonStartedDrawing = PersonStartedDrawing;

    var PersonStoppedDrawing = (function () {
        function PersonStoppedDrawing(person) {
            this.person = person;
        }
        PersonStoppedDrawing.prototype.serialise = function (writer) {
            writer.writeByte(16);
            this.person.serialise(writer);
        };

        PersonStoppedDrawing.deserialise = function (reader) {
            return new PersonStoppedDrawing(Person.deserialise(reader));
        };
        return PersonStoppedDrawing;
    })();
    NetworkData.PersonStoppedDrawing = PersonStoppedDrawing;

    var PersonAway = (function () {
        function PersonAway(person) {
            this.person = person;
        }
        return PersonAway;
    })();
    NetworkData.PersonAway = PersonAway;

    var PersonNotAway = (function () {
        function PersonNotAway(person) {
            this.person = person;
        }
        return PersonNotAway;
    })();
    NetworkData.PersonNotAway = PersonNotAway;

    var Theme = (function () {
        function Theme(theme) {
            this.theme = theme;
        }
        return Theme;
    })();
    NetworkData.Theme = Theme;

    var PeopleInRoom = (function () {
        function PeopleInRoom(people) {
            this.people = people;
        }
        PeopleInRoom.deserialise = function (reader) {
            return new PeopleInRoom(reader.readArray(Person.deserialise));
        };
        return PeopleInRoom;
    })();
    NetworkData.PeopleInRoom = PeopleInRoom;

    var MessageHistory = (function () {
        function MessageHistory(messages, thumbnails, extraMedia) {
            this.messages = messages;
            this.thumbnails = thumbnails;
            this.extraMedia = extraMedia;
        }
        MessageHistory.deserialise = function (reader) {
            return new MessageHistory(reader.readArray(ChatMessage.deserialise), reader.readArray(Thumbnail.deserialise), reader.readArray(ExtraMedia.deserialise));
        };
        return MessageHistory;
    })();
    NetworkData.MessageHistory = MessageHistory;

    var ServerTime = (function () {
        function ServerTime(timeStamp) {
            this.timeStamp = timeStamp;
        }
        return ServerTime;
    })();
    NetworkData.ServerTime = ServerTime;

    var RequestName = (function () {
        function RequestName(name) {
            this.name = name;
        }
        RequestName.prototype.serialise = function (writer) {
            writer.writeByte(3);
            writer.writeString(this.name);
        };
        return RequestName;
    })();
    NetworkData.RequestName = RequestName;

    var RequestNameAccepted = (function () {
        function RequestNameAccepted(person) {
            this.person = person;
        }
        RequestNameAccepted.deserialise = function (reader) {
            return new RequestNameAccepted(Person.deserialise(reader));
        };
        return RequestNameAccepted;
    })();
    NetworkData.RequestNameAccepted = RequestNameAccepted;

    var RequestNameRejected = (function () {
        function RequestNameRejected(reason) {
            this.reason = reason;
        }
        RequestNameRejected.deserialise = function (reader) {
            return new RequestNameRejected(reader.readString());
        };
        return RequestNameRejected;
    })();
    NetworkData.RequestNameRejected = RequestNameRejected;

    var Thumbnail = (function () {
        function Thumbnail(id, data) {
            this.id = id;
            this.data = data;
        }
        Thumbnail.deserialise = function (reader) {
            return new Thumbnail(reader.readUint32(), ImageReference.deserialise(reader));
        };
        return Thumbnail;
    })();
    NetworkData.Thumbnail = Thumbnail;

    var RequestChatConnection = (function () {
        function RequestChatConnection(roomNumber) {
            this.roomNumber = roomNumber;
        }
        RequestChatConnection.prototype.serialise = function (writer) {
            writer.writeByte(5);
            writer.writeUint32(this.roomNumber);
        };
        return RequestChatConnection;
    })();
    NetworkData.RequestChatConnection = RequestChatConnection;

    var RequestChatConnectionRejected = (function () {
        function RequestChatConnectionRejected(reason) {
            this.reason = reason;
        }
        RequestChatConnectionRejected.deserialise = function (reader) {
            return new RequestChatConnectionRejected(reader.readString());
        };
        return RequestChatConnectionRejected;
    })();
    NetworkData.RequestChatConnectionRejected = RequestChatConnectionRejected;

    var RequestChatConnectionAccepted = (function () {
        function RequestChatConnectionAccepted() {
        }
        RequestChatConnectionAccepted.deserialise = function (reader) {
            return new RequestChatConnectionAccepted();
        };
        return RequestChatConnectionAccepted;
    })();
    NetworkData.RequestChatConnectionAccepted = RequestChatConnectionAccepted;

    var ExtraMedia = (function () {
        function ExtraMedia(id, extraMedia) {
            this.id = id;
            this.extraMedia = extraMedia;
        }
        ExtraMedia.prototype.serialise = function (writer) {
            writer.writeByte(4);
            writer.writeUint32(this.id);
            this.extraMedia.serialise(writer);
        };

        ExtraMedia.deserialise = function (reader) {
            return new ExtraMedia(reader.readUint32(), NetworkDataMediaTypeBase.deserialise(reader));
        };
        return ExtraMedia;
    })();
    NetworkData.ExtraMedia = ExtraMedia;

    //media types:
    var Image = (function () {
        function Image(imageData) {
            this.imageData = imageData;
        }
        return Image;
    })();
    NetworkData.Image = Image;

    var Drawing = (function () {
        function Drawing(drawingData) {
            this.drawingData = drawingData;
        }
        Drawing.prototype.serialise = function (writer) {
            writer.writeByte(0);
            this.drawingData.serialise(writer);
        };

        Drawing.deserialise = function (reader) {
            return new Drawing(NetworkDataImageRefBase.deserialise(reader));
        };
        return Drawing;
    })();
    NetworkData.Drawing = Drawing;

    var ImageReference = (function () {
        function ImageReference(reference) {
            this.reference = reference;
        }
        ImageReference.deserialise = function (reader) {
            return new ImageReference(reader.readUint32());
        };
        return ImageReference;
    })();
    NetworkData.ImageReference = ImageReference;

    var ImageEmbdedded = (function () {
        function ImageEmbdedded(embedded) {
            this.embedded = embedded;
        }
        ImageEmbdedded.prototype.serialise = function (writer) {
            writer.writeByte(0);
            writer.writeByteArray(this.embedded);
        };
        return ImageEmbdedded;
    })();
    NetworkData.ImageEmbdedded = ImageEmbdedded;

    var TwitterMedia = (function () {
        function TwitterMedia(title, description, image) {
            this.title = title;
            this.description = description;
            this.image = image;
        }
        return TwitterMedia;
    })();
    NetworkData.TwitterMedia = TwitterMedia;

    var TwitterSummary = (function () {
        function TwitterSummary(twitterMedia) {
            this.twitterMedia = twitterMedia;
        }
        return TwitterSummary;
    })();
    NetworkData.TwitterSummary = TwitterSummary;

    var TwitterVideo = (function () {
        function TwitterVideo(twitterMedia, videoIFrame, size) {
            this.twitterMedia = twitterMedia;
            this.videoIFrame = videoIFrame;
            this.size = size;
        }
        return TwitterVideo;
    })();
    NetworkData.TwitterVideo = TwitterVideo;
})(NetworkData || (NetworkData = {}));
//# sourceMappingURL=networkData.js.map
