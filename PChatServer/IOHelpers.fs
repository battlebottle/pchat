module IOHelpers

open DataTypes

open System.IO
open System.Text
open System

let readString (reader : BinaryReader) =
    let length = int <| reader.ReadUInt32()

    let decoder = Encoding.Unicode.GetDecoder()
    let s = (reader.BaseStream :?> MemoryStream)
    let chars = Array.zeroCreate<char> length
    decoder.GetChars(s.GetBuffer(), reader.BaseStream.Position |> int, length * 2, chars, 0) |> ignore
    reader.BaseStream.Position <- reader.BaseStream.Position + int64 (length * 2)
    let str = String(chars)
    str

let readMaybe<'T> (reader : BinaryReader, valueReader : unit -> 'T) =
    let isSome = reader.ReadBoolean()
    if isSome then
        Some (valueReader())
    else
        None

let writeString (writer : BinaryWriter) (string: string) =
    writer.Write(uint32 string.Length)

    let encoder = Encoding.Unicode.GetEncoder()
    let bytes = Array.zeroCreate<byte> (string.Length * 2)
    encoder.GetBytes(string.ToCharArray(), 0, string.Length, bytes, 0, true) |> ignore
    writer.Write(bytes)

let readPerson (reader : BinaryReader) =
    {
        id = reader.ReadUInt32();
        name =  readString reader
    }

let readMessageType (reader : BinaryReader) =
    let header = reader.ReadByte()
    match header with
    | 0uy -> Normal <| readPerson reader
    | _ -> raise (Exception("match not found"))

let readMessageSpan (reader : BinaryReader) =
    let header = reader.ReadByte()
    match header with
    | 0uy -> Text <| readString reader
    | _ -> raise (Exception("match not found"))

let readMessageContent (reader : BinaryReader) =
    let length = reader.ReadUInt32()
    let rec readContentRec acu length =
        if length = 0ul then
            acu
        else
            readContentRec (readMessageSpan reader :: acu) (length - 1ul)
    readContentRec [] length |> List.rev


let writePerson (writer : BinaryWriter) (person: Person) =
    writer.Write(person.id)
    writeString writer person.name

let readDateTime (reader : BinaryReader) =
    DateTime(reader.ReadUInt32() |> int64)

let writeDateTime (writer : BinaryWriter) (dateTime: DateTime) =
    writer.Write(dateTime.Ticks |> uint32)

let writeOption<'T> (writer : BinaryWriter) (valueWriter : 'T -> unit) (option: Option<'T>) =
    writer.Write(option.IsSome)
    if(option.IsSome) then
        valueWriter option.Value

let writeMessageType (writer : BinaryWriter) (messageType : MessageType) =
    match messageType with
    | Normal person ->
        writer.Write(0uy)
        writePerson writer person
    | Server -> writer.Write(1uy)
    | Clear -> writer.Write(2uy)
    
let writeMessageSpan (writer : BinaryWriter) (messageSpan : MessageSpan) =
    match messageSpan with
    | Text text ->
        writer.Write(0uy)
        writeString writer text
    | Hightlight text ->
        writer.Write(1uy)
        writeString writer text
    | Hyperlink (text, url)->
        writer.Write(2uy)
        writeString writer text
        writeString writer url


let writeContent (writer : BinaryWriter) (messageContent : MessageContent) =
    writer.Write(messageContent.Length |> uint32)
    for messageSpan in messageContent do
        writeMessageSpan writer messageSpan


let writeMessage (writer : BinaryWriter) (messageType: MessageType, messageContent : MessageContent, time : DateTime, hasThumbnail : HasThumbnail, hasExtraMedia : HasExtraMedia, id : ID) =
    let uintWriter = fun (value : uint32) -> writer.Write(value)
    writeMessageType writer messageType
    writeContent writer messageContent
    writeDateTime writer time    
    writer.Write(hasThumbnail)
    writer.Write(hasExtraMedia)  
    writer.Write(id)  

let writeStringList (writer : BinaryWriter) (stringList: string list) =
    writer.Write(stringList.Length)
    for s in stringList do
        writeString writer s

let writeMessageList (writer : BinaryWriter) (messageList : ChatMessage list) =
    writer.Write(messageList.Length |> uint32)
    for m in messageList do
        writeMessage writer m

let writePeopleList (writer : BinaryWriter) (peopleList : Person list) =
    writer.Write(peopleList.Length |> uint32)
    for p in peopleList do
        writePerson writer p


let readByteArray (reader : BinaryReader) =
    let length = reader.ReadUInt32()
    let remaining = reader.BaseStream.Length - reader.BaseStream.Position
    let bytes = reader.ReadBytes(length |> int32)
    bytes

let readMediaType (reader : BinaryReader) =
    let header = reader.ReadByte()
    match header with
    | 0uy -> MediaType.Drawing <| readByteArray reader

let writeBytes (writer : BinaryWriter) (bytes:byte[]) =
    writer.Write(bytes.Length |> uint32)
    writer.Write(bytes)

let writeMediaType (writer : BinaryWriter) (mediaType : MediaType) =
    match mediaType with
    | Drawing data -> 
        writer.Write(0uy)
        writeBytes writer data

let writeExtraMedia (writer : BinaryWriter) (extraMedia : ExtraMedia) =
    writer.Write(extraMedia.messageID)
    writeMediaType writer extraMedia.media
    
let writeThumbnail (writer : BinaryWriter) (thumbnail : Thumbnail) =
    writer.Write(thumbnail.messageID)
    writeBytes writer thumbnail.thumbnail