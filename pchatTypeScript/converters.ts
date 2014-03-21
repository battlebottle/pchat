/// <reference path="viewModel.ts" />
/// <reference path="networkData.ts" />


module Converters {
    export class NetworkToVMConverter {

        static personToPerson(person: NetworkData.Person) {
            return new ViewModel.Person(person.id, person.name)
        }

        static messageTypeToMessageType(messageType: NetworkData.NetworkMessageTypeBase): ViewModel.ViewModelMessageTypeBase {
            if (messageType instanceof NetworkData.Normal) {
                return new ViewModel.Normal(this.personToPerson((<NetworkData.Normal>messageType).person));
            }
            else if (messageType instanceof NetworkData.Server) {
                return new ViewModel.Server();
            } else {
                throw "no match found";
            }
        }

        static messageContentToMessageContent(messageContent: NetworkData.MessageContent): ViewModel.MessageContent {
            return new ViewModel.MessageContent(messageContent.messageContent.map((span) => {
                if (span instanceof NetworkData.Text) {
                    return new ViewModel.Text((<NetworkData.Text>span).text);
                }
                else if (span instanceof  NetworkData.Hightlight) {
                    return new ViewModel.Hightlight((<NetworkData.Hightlight>span).text);
                }
                else if (span instanceof  NetworkData.Hyperlink) {
                    var hyperlink = (<NetworkData.Hyperlink>span)
                    return new ViewModel.Hyperlink(hyperlink.text, hyperlink.url);
                }
            }));
        }

        static chatMessageToChatMessage(chatMessage: NetworkData.ChatMessage) {
            return new ViewModel.ChatMessage(this.messageTypeToMessageType(chatMessage.messageType), this.messageContentToMessageContent(chatMessage.messageContent), chatMessage.timeStamp, chatMessage.id, chatMessage.hasThumbnail, chatMessage.hasExtraMedia);
        }

        static peopleInRoomToPeopleInRoom(peopleInRoom: NetworkData.PeopleInRoom) {
            return new ViewModel.PeopleInRoom(peopleInRoom.people.map((p) => this.personToPerson(p)))
        }

        static mediaTypeToMediaType(mediaType: NetworkData.NetworkDataMediaTypeBase) {
            if (mediaType instanceof NetworkData.Drawing) {
                return new ViewModel.Drawing((<NetworkData.ImageReference>(<NetworkData.Drawing>mediaType).drawingData).reference)
            }
            throw "no match found";
            
        }

        static extraMediaToExtraMedia(extraMedia: NetworkData.ExtraMedia) {
            return new ViewModel.ExtraMedia(extraMedia.id, this.mediaTypeToMediaType(extraMedia.extraMedia));
        }

        static thumbnailToThumbnail(thumbnail: NetworkData.Thumbnail) {
            return new ViewModel.Thumbnail(thumbnail.id, thumbnail.data.reference);
        }
    }
}