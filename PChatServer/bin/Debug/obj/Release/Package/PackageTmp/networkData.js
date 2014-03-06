/// <reference path="core.ts" />
var NetworkData;
(function (NetworkData) {
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

        ArrayBufferReader.prototype.readPerson = function () {
            return new Person(this.readUint32(), this.readString());
        };

        ArrayBufferReader.prototype.readChatMessage = function () {
            return new ChatMessage(this.readPerson(), this.readString(), this.readUint32(), this.readBool(), this.readBool(), this.readUint32());
        };

        ArrayBufferReader.prototype.readPersonStartedTyping = function () {
            return new PersonStartedTyping(this.readPerson());
        };

        ArrayBufferReader.prototype.readPersonStoppedTyping = function () {
            return new PersonStoppedTyping(this.readPerson());
        };

        ArrayBufferReader.prototype.readPersonAway = function () {
            return new PersonAway(this.readPerson());
        };

        ArrayBufferReader.prototype.readPersonNotAway = function () {
            return new PersonNotAway(this.readPerson());
        };

        ArrayBufferReader.prototype.readPeopleInRoom = function () {
            var peopleInRoom = [];
            var count = this.readUint32();
            for (var i = 0; i < count; i++) {
                peopleInRoom.push(this.readPerson());
            }
            return new PeopleInRoom(peopleInRoom);
        };

        ArrayBufferReader.prototype.readMessageHistory = function () {
            var messageHistory = [];
            var count = this.readUint32();
            for (var i = 0; i < count; i++) {
                messageHistory.push(this.readChatMessage());
            }
            return new MessageHistory(messageHistory);
        };

        ArrayBufferReader.prototype.readServerTime = function () {
            return new ServerTime(this.readUint32());
        };

        ArrayBufferReader.prototype.readRequestName = function () {
            return new RequestName(this.readString());
        };

        ArrayBufferReader.prototype.readRequestNameAccepted = function () {
            return new RequestNameAccepted(this.readPerson());
        };

        ArrayBufferReader.prototype.readRequestNameRejected = function () {
            return new RequestNameRejected(this.readString());
        };

        ArrayBufferReader.prototype.readByteArray = function () {
            var length = this.readUint32();
            var byteArray = new Uint8Array(length);
            for (var i = 0; i < length; i++) {
                byteArray[i] = this.readByte();
            }
            return byteArray;
        };

        ArrayBufferReader.prototype.readMediaType = function () {
            var header = this.readByte();
            if (header === 0) {
                return new Drawing(this.readByteArray());
            }
            throw "no match found";
        };

        ArrayBufferReader.prototype.readExtraMedia = function () {
            return new ExtraMedia(this.readUint32(), this.readMediaType());
        };

        ArrayBufferReader.prototype.readThumbnail = function () {
            return new Thumbnail(this.readUint32(), this.readByteArray());
        };
        return ArrayBufferReader;
    })();
    NetworkData.ArrayBufferReader = ArrayBufferReader;

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

        ArrayBufferWriter.prototype.writeString = function (str) {
            this.writeUint32(str.length);
            var uint16Array = new Uint16Array(str.length);

            for (var i = 0; i < str.length; i++) {
                uint16Array[i] = str.charCodeAt(i);
            }
            this.copyBufferToMainBuffer(uint16Array.buffer);
        };

        ArrayBufferWriter.prototype.writePerson = function (person) {
            this.writeUint32(person.id);
            this.writeString(person.name);
        };

        ArrayBufferWriter.prototype.writeChatMessage = function (chatMessage) {
            this.writeByte(0);
            this.writePerson(chatMessage.sender);
            this.writeString(chatMessage.message);
            this.writeUint32(chatMessage.timeStamp);
            this.writeBool(chatMessage.hasThumbnail);
            this.writeBool(chatMessage.hasExtraMedia);
            this.writeUint32(chatMessage.id);
        };

        ArrayBufferWriter.prototype.writePersonStartedTyping = function (personST) {
            this.writeByte(1);
            this.writePerson(personST.person);
        };

        ArrayBufferWriter.prototype.writePersonStoppedTyping = function (personST) {
            this.writeByte(2);
            this.writePerson(personST.person);
        };

        ArrayBufferWriter.prototype.writeRequestName = function (requestName) {
            this.writeByte(3);
            this.writeString(requestName.name);
        };

        ArrayBufferWriter.prototype.writeByteArray = function (byteArray) {
            this.writeUint32(byteArray.length);
            for (var i = 0; i < byteArray.length; i++) {
                this.writeByte(byteArray[i]);
            }
        };

        ArrayBufferWriter.prototype.writeMediaType = function (mediaType) {
            if (mediaType.mediaType === 1 /* Drawing */) {
                var drawing = mediaType;
                this.writeByte(0);
                this.writeByteArray(drawing.drawingData);
            }
        };

        ArrayBufferWriter.prototype.writeExtraMedia = function (extraMedia) {
            this.writeByte(4);
            this.writeUint32(extraMedia.id);
            this.writeMediaType(extraMedia.extraMedia);
        };

        ArrayBufferWriter.prototype.toByteArray = function () {
            return new Uint8Array(this.arrayBuffer, 0, this.position);
        };
        return ArrayBufferWriter;
    })();
    NetworkData.ArrayBufferWriter = ArrayBufferWriter;

    (function (INetworkData) {
        INetworkData[INetworkData["Person"] = 0] = "Person";
        INetworkData[INetworkData["ChatMessage"] = 1] = "ChatMessage";
        INetworkData[INetworkData["PersonStartedTyping"] = 2] = "PersonStartedTyping";
        INetworkData[INetworkData["PersonStoppedTyping"] = 3] = "PersonStoppedTyping";
        INetworkData[INetworkData["PersonAway"] = 4] = "PersonAway";
        INetworkData[INetworkData["PersonNotAway"] = 5] = "PersonNotAway";
        INetworkData[INetworkData["Theme"] = 6] = "Theme";
        INetworkData[INetworkData["PeopleInRoom"] = 7] = "PeopleInRoom";
        INetworkData[INetworkData["MessageHistory"] = 8] = "MessageHistory";
        INetworkData[INetworkData["ServerTime"] = 9] = "ServerTime";
        INetworkData[INetworkData["RequestName"] = 10] = "RequestName";
        INetworkData[INetworkData["RequestNameAccepted"] = 11] = "RequestNameAccepted";
        INetworkData[INetworkData["RequestNameRejected"] = 12] = "RequestNameRejected";
        INetworkData[INetworkData["Thumbnail"] = 13] = "Thumbnail";
        INetworkData[INetworkData["ExtraMedia"] = 14] = "ExtraMedia";
    })(NetworkData.INetworkData || (NetworkData.INetworkData = {}));
    var INetworkData = NetworkData.INetworkData;

    (function (INetworkMediaType) {
        INetworkMediaType[INetworkMediaType["Image"] = 0] = "Image";
        INetworkMediaType[INetworkMediaType["Drawing"] = 1] = "Drawing";
        INetworkMediaType[INetworkMediaType["TwitterSummary"] = 2] = "TwitterSummary";
        INetworkMediaType[INetworkMediaType["TwitterVideo"] = 3] = "TwitterVideo";
    })(NetworkData.INetworkMediaType || (NetworkData.INetworkMediaType = {}));
    var INetworkMediaType = NetworkData.INetworkMediaType;

    var Person = (function () {
        function Person(id, name) {
            this.id = id;
            this.name = name;
            this.type = 0 /* Person */;
        }
        Person.prototype.serialise = function () {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writePerson(this);
            return bw.toByteArray();
        };
        return Person;
    })();
    NetworkData.Person = Person;

    var ChatMessage = (function () {
        function ChatMessage(sender, message, timeStamp, hasExtraMedia, hasThumbnail, id) {
            this.sender = sender;
            this.message = message;
            this.timeStamp = timeStamp;
            this.hasExtraMedia = hasExtraMedia;
            this.hasThumbnail = hasThumbnail;
            this.id = id;
            this.type = 1 /* ChatMessage */;
        }
        ChatMessage.prototype.serialise = function () {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writeChatMessage(this);
            return bw.toByteArray();
        };
        return ChatMessage;
    })();
    NetworkData.ChatMessage = ChatMessage;

    var PersonStartedTyping = (function () {
        function PersonStartedTyping(person) {
            this.person = person;
            this.type = 2 /* PersonStartedTyping */;
        }
        PersonStartedTyping.prototype.serialise = function () {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writePersonStartedTyping(this);
            return bw.toByteArray();
        };
        return PersonStartedTyping;
    })();
    NetworkData.PersonStartedTyping = PersonStartedTyping;

    var PersonStoppedTyping = (function () {
        function PersonStoppedTyping(person) {
            this.person = person;
            this.type = 3 /* PersonStoppedTyping */;
        }
        PersonStoppedTyping.prototype.serialise = function () {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writePersonStoppedTyping(this);
            return bw.toByteArray();
        };
        return PersonStoppedTyping;
    })();
    NetworkData.PersonStoppedTyping = PersonStoppedTyping;

    var PersonAway = (function () {
        function PersonAway(person) {
            this.person = person;
            this.type = 4 /* PersonAway */;
        }
        return PersonAway;
    })();
    NetworkData.PersonAway = PersonAway;

    var PersonNotAway = (function () {
        function PersonNotAway(person) {
            this.person = person;
            this.type = 5 /* PersonNotAway */;
        }
        return PersonNotAway;
    })();
    NetworkData.PersonNotAway = PersonNotAway;

    var Theme = (function () {
        function Theme(theme) {
            this.theme = theme;
            this.type = 6 /* Theme */;
        }
        return Theme;
    })();
    NetworkData.Theme = Theme;

    var PeopleInRoom = (function () {
        function PeopleInRoom(people) {
            this.people = people;
            this.type = 7 /* PeopleInRoom */;
        }
        return PeopleInRoom;
    })();
    NetworkData.PeopleInRoom = PeopleInRoom;

    var MessageHistory = (function () {
        function MessageHistory(messages) {
            this.messages = messages;
            this.type = 8 /* MessageHistory */;
        }
        return MessageHistory;
    })();
    NetworkData.MessageHistory = MessageHistory;

    var ServerTime = (function () {
        function ServerTime(timeStamp) {
            this.timeStamp = timeStamp;
            this.type = 5 /* PersonNotAway */;
        }
        return ServerTime;
    })();
    NetworkData.ServerTime = ServerTime;

    var RequestName = (function () {
        function RequestName(name) {
            this.name = name;
            this.type = 10 /* RequestName */;
        }
        RequestName.prototype.serialise = function () {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writeRequestName(this);
            return bw.toByteArray();
        };
        return RequestName;
    })();
    NetworkData.RequestName = RequestName;

    var RequestNameAccepted = (function () {
        function RequestNameAccepted(person) {
            this.person = person;
            this.type = 11 /* RequestNameAccepted */;
        }
        return RequestNameAccepted;
    })();
    NetworkData.RequestNameAccepted = RequestNameAccepted;

    var RequestNameRejected = (function () {
        function RequestNameRejected(reason) {
            this.reason = reason;
            this.type = 12 /* RequestNameRejected */;
        }
        return RequestNameRejected;
    })();
    NetworkData.RequestNameRejected = RequestNameRejected;

    var Thumbnail = (function () {
        function Thumbnail(id, data) {
            this.id = id;
            this.data = data;
            this.type = 13 /* Thumbnail */;
        }
        return Thumbnail;
    })();
    NetworkData.Thumbnail = Thumbnail;

    var ExtraMedia = (function () {
        function ExtraMedia(id, extraMedia) {
            this.id = id;
            this.extraMedia = extraMedia;
            this.type = 14 /* ExtraMedia */;
        }
        ExtraMedia.prototype.serialise = function () {
            var bw = new NetworkData.ArrayBufferWriter();
            bw.writeExtraMedia(this);
            return bw.toByteArray();
        };
        return ExtraMedia;
    })();
    NetworkData.ExtraMedia = ExtraMedia;

    //media types:
    var Image = (function () {
        function Image(imageData) {
            this.imageData = imageData;
            this.mediaType = 0 /* Image */;
        }
        return Image;
    })();
    NetworkData.Image = Image;

    var Drawing = (function () {
        function Drawing(drawingData) {
            this.drawingData = drawingData;
            this.mediaType = 1 /* Drawing */;
        }
        return Drawing;
    })();
    NetworkData.Drawing = Drawing;

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
            this.mediaType = 2 /* TwitterSummary */;
        }
        return TwitterSummary;
    })();
    NetworkData.TwitterSummary = TwitterSummary;

    var TwitterVideo = (function () {
        function TwitterVideo(twitterMedia, videoIFrame, size) {
            this.twitterMedia = twitterMedia;
            this.videoIFrame = videoIFrame;
            this.size = size;
            this.mediaType = 3 /* TwitterVideo */;
        }
        return TwitterVideo;
    })();
    NetworkData.TwitterVideo = TwitterVideo;
})(NetworkData || (NetworkData = {}));
