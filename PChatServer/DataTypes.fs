module DataTypes
open System

type Person = {
    id : uint32
    name : string;
}

type TwitterMedia = {
    title : string
    description : string
    image : byte[] Option
}

type MediaType =
| Image of byte[]
| Drawing of byte[]
| TwitterSummary of TwitterMedia
| TwitterVideo of TwitterMedia * string * (int*int)

type MessageSpan =
| Text of string
| Hightlight of string
| Hyperlink of string * string

type MessageType =
| Normal of Person
| Server
| Clear

type ExtraMedia = {
    messageID : uint32
    media : MediaType
}

type Thumbnail = {
    messageID : uint32
    thumbnail : byte[]
}

type MessageContent = MessageSpan list

type HasThumbnail = bool
type HasExtraMedia = bool
type ID = uint32
type ChatMessage = MessageType * MessageContent * DateTime * HasThumbnail * HasExtraMedia * ID

type ChatData =
| ChatMessage of ChatMessage
| PersonStartedTyping of Person
| PersonStoppedTyping of Person
| PersonAway of Person
| PersonNotAway of Person
| RequestName of string
| RequestNameAccepted of Person
| RequestNameRejected of string
| Theme of string
| PeopleInRoom of Person list
| MessageHistory of ChatMessage list
| ServerTime of DateTime
| Thumbnail of Thumbnail
| ExtraMedia of ExtraMedia
| RequestChatConnection of uint32
| RequestChatConnectionAccepted
| RequestChatConnectionRejected of string