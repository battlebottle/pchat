/// <reference path="viewModel.ts" />
/// <reference path="networkData.ts" />


module Converters {
    export class NetworkToVMConverter {

        static personToPerson(person: NetworkData.Person) {
            return new ViewModel.Person(person.id, person.name)
        }

        static chatMessageToChatMessage(chatMessage: NetworkData.ChatMessage) {
            return new ViewModel.ChatMessage(this.personToPerson(chatMessage.sender), chatMessage.message, chatMessage.timeStamp, chatMessage.id, chatMessage.hasThumbnail, chatMessage.hasExtraMedia);
        }

        static peopleInRoomToPeopleInRoom(peopleInRoom: NetworkData.PeopleInRoom) {
            return new ViewModel.PeopleInRoom(peopleInRoom.people.map((p) => this.personToPerson(p)))
        }

        static mediaTypeToMediaType(mediaType: NetworkData.NetworkDataMediaType) {
            var mt = NetworkData.INetworkMediaType;
            if (mediaType.mediaType === mt.Drawing) {
                return new ViewModel.Drawing((<NetworkData.Drawing>mediaType).drawingData)
            }
            throw "no match found";
            
        }

        static extraMediaToExtraMedia(extraMedia: NetworkData.ExtraMedia) {
            return new ViewModel.ExtraMedia(extraMedia.id, this.mediaTypeToMediaType(extraMedia.extraMedia));
        }

        static thumbnailToThumbnail(thumbnail: NetworkData.Thumbnail) {
            return new ViewModel.Thumbnail(thumbnail.id, thumbnail.data);
        }
    }
}