/// <reference path="viewModel.ts" />
/// <reference path="networkData.ts" />


module Converters {
    export class NetworkToVMConverter {

        static personToPerson(person: NetworkData.Person) {
            return new ViewModel.Person(person.id, person.name)
        }

        static messageTypeToMessageType(messageType: NetworkData.NetworkMessageType) : ViewModel.ViewModelMessageType {
            if (messageType.messageTypeType === NetworkData.INetworkMessageType.Normal) {
                return new ViewModel.Normal(this.personToPerson((<NetworkData.Normal>messageType).person));
            }
            else if (messageType.messageTypeType === NetworkData.INetworkMessageType.Server) {
                return new ViewModel.Server();
            } else {
                throw "no match found";
            }
        }

        static messageContentToMessageContent(messageContent: NetworkData.NetworkMessageSpan[]) : ViewModel.ViewModelMessageSpan[] {
            return messageContent.map((span) => {
                if (span.messageSpanType === NetworkData.INetworkMessageSpan.Text) {
                    return new ViewModel.Text((<NetworkData.Text>span).text);
                }
                else if (span.messageSpanType === NetworkData.INetworkMessageSpan.Hightlight) {
                    return new ViewModel.Hightlight((<NetworkData.Hightlight>span).text);
                }
                else if (span.messageSpanType === NetworkData.INetworkMessageSpan.Hyperlink) {
                    var hyperlink = (<NetworkData.Hyperlink>span)
                    return new ViewModel.Hyperlink(hyperlink.text, hyperlink.url);
                }
            });
        }

        static chatMessageToChatMessage(chatMessage: NetworkData.ChatMessage) {
            return new ViewModel.ChatMessage(this.messageTypeToMessageType(chatMessage.messageType), this.messageContentToMessageContent(chatMessage.messageContent), chatMessage.timeStamp, chatMessage.id, chatMessage.hasThumbnail, chatMessage.hasExtraMedia);
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