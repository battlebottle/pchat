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

        NetworkToVMConverter.chatMessageToChatMessage = function (chatMessage) {
            return new ViewModel.ChatMessage(this.personToPerson(chatMessage.sender), chatMessage.message, chatMessage.timeStamp, chatMessage.id, chatMessage.hasThumbnail, chatMessage.hasExtraMedia);
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
