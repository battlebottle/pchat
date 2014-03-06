/// <reference path="viewModel.ts" />
/// <reference path="networkData.ts" />
var Converters;
(function (Converters) {
    var NetworkToVMConverter = (function () {
        function NetworkToVMConverter() {
        }
        NetworkToVMConverter.personToPerson = function (person) {
            return new ViewModel.Person(person.id, person.name);
        };

        NetworkToVMConverter.messageTypeToMessageType = function (messageType) {
            if (messageType.messageTypeType === 0 /* Normal */) {
                return new ViewModel.Normal(this.personToPerson(messageType.person));
            } else if (messageType.messageTypeType === 1 /* Server */) {
                return new ViewModel.Server();
            } else {
                throw "no match found";
            }
        };

        NetworkToVMConverter.messageContentToMessageContent = function (messageContent) {
            return messageContent.map(function (span) {
                if (span.messageSpanType === 0 /* Text */) {
                    return new ViewModel.Text(span.text);
                } else if (span.messageSpanType === 1 /* Hightlight */) {
                    return new ViewModel.Hightlight(span.text);
                } else if (span.messageSpanType === 2 /* Hyperlink */) {
                    var hyperlink = span;
                    return new ViewModel.Hyperlink(hyperlink.text, hyperlink.url);
                }
            });
        };

        NetworkToVMConverter.chatMessageToChatMessage = function (chatMessage) {
            return new ViewModel.ChatMessage(this.messageTypeToMessageType(chatMessage.messageType), this.messageContentToMessageContent(chatMessage.messageContent), chatMessage.timeStamp, chatMessage.id, chatMessage.hasThumbnail, chatMessage.hasExtraMedia);
        };

        NetworkToVMConverter.peopleInRoomToPeopleInRoom = function (peopleInRoom) {
            var _this = this;
            return new ViewModel.PeopleInRoom(peopleInRoom.people.map(function (p) {
                return _this.personToPerson(p);
            }));
        };

        NetworkToVMConverter.mediaTypeToMediaType = function (mediaType) {
            var mt = NetworkData.INetworkMediaType;
            if (mediaType.mediaType === 1 /* Drawing */) {
                return new ViewModel.Drawing(mediaType.drawingData);
            }
            throw "no match found";
        };

        NetworkToVMConverter.extraMediaToExtraMedia = function (extraMedia) {
            return new ViewModel.ExtraMedia(extraMedia.id, this.mediaTypeToMediaType(extraMedia.extraMedia));
        };

        NetworkToVMConverter.thumbnailToThumbnail = function (thumbnail) {
            return new ViewModel.Thumbnail(thumbnail.id, thumbnail.data);
        };
        return NetworkToVMConverter;
    })();
    Converters.NetworkToVMConverter = NetworkToVMConverter;
})(Converters || (Converters = {}));
//# sourceMappingURL=converters.js.map
