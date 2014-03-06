module ChatServer
// Example of using F# MailboxProcessor against an HTML5 WebSocket (in Google Chrome)
// taken from http://v2matveev.blogspot.com/2010/04/mailboxprocessors-practical-application.html
// and then modified to work with the revised WebSocket protocol that includes a set of challenge bytes.
// The main changes are in the handshake function.
// Have a look at the http://nugget.codeplex.com for example WebSocket code in C#, on which I based the 
// challenge processing code.

open System
open System.IO
open System.Linq
open System.Net
open System.Net.Sockets
open System.Text
open System.Threading
open System.Drawing
open System.Runtime.Serialization
open System.Collections.Generic
open Fleck
open DataTypes
open IOHelpers

let Trace (message : string) = Console.WriteLine(message)


let bytesToChatData (byteArray : byte array) =
    use ms = new MemoryStream(byteArray, 0, byteArray.Length, false, true)
    use r = new BinaryReader(ms)
    match r.ReadByte() with
    | 0uy -> ChatMessage (readMessageType r, readMessageContent r, readDateTime r, r.ReadBoolean(), r.ReadBoolean(), r.ReadUInt32())
    | 1uy -> PersonStartedTyping (readPerson r)
    | 2uy -> PersonStoppedTyping (readPerson r)
    | 3uy -> RequestName (readString r)
    | 4uy -> ChatData.ExtraMedia {messageID = r.ReadUInt32(); media = readMediaType r } 
    | 5uy -> RequestChatConnection (r.ReadUInt32())
    | _ -> Theme ""//delete me
    
let chatDataToBytes chatData =
    use ms = new MemoryStream()
    use w = new BinaryWriter(ms)
    match chatData with
    | ChatMessage (messageType, messageContent, time, thumbID, extraMediaID, id) -> 
        w.Write(0uy)
        writeMessage w (messageType, messageContent, time, thumbID, extraMediaID, id)
    | PersonStartedTyping person ->
        w.Write(1uy)
        writePerson w person        
    | PersonStoppedTyping person ->
        w.Write(2uy)
        writePerson w person
    | PersonAway person ->
        w.Write(3uy)
        writePerson w person
    | PersonNotAway person ->
        w.Write(4uy)
        writePerson w person
    | Theme theme ->
        w.Write(5uy)
        writeString w theme        
    | PeopleInRoom people ->
        w.Write(6uy)
        writePeopleList w people      
    | MessageHistory messageList ->
        w.Write(7uy)
        writeMessageList w messageList      
    | ServerTime time ->
        w.Write(8uy)
        writeDateTime w time  
    | RequestNameAccepted person ->
        w.Write(9uy)
        writePerson w person
    | ExtraMedia eMedia ->
        w.Write(10uy)
        writeExtraMedia w eMedia
    | Thumbnail thumbnail ->
        w.Write(11uy)
        writeThumbnail w thumbnail
    | RequestChatConnectionAccepted ->
        w.Write(12uy)
    | RequestChatConnectionRejected reason ->
        w.Write(13uy)
        writeString w reason
    | RequestNameRejected reason ->
        w.Write(14uy)
        writeString w reason
    | _ -> raise (Exception("match not found"))
    ms.ToArray()

let createThumbnail (pngData : byte array) =
    async {
        use ms = new MemoryStream(pngData)
        let image = Image.FromStream(ms)
        let newBitmap = new Bitmap(image, Size(100,100))
        use msOut = new MemoryStream()
        newBitmap.Save(msOut, Imaging.ImageFormat.Png)
        return msOut.ToArray()
    }
    

let sanatise (str : string) = System.Web.HttpUtility.HtmlEncode str

let processMessage (messageContent : MessageContent) = 
    messageContent
    |> List.map (
        fun mSpan -> 
            match mSpan with
            | Text text -> Text <| sanatise text
            | Hightlight text -> Hightlight <| sanatise text
            | Hyperlink (text,_) -> Hyperlink (sanatise text, sanatise text)
    )

let messageToString (message : MessageContent) =
    let rec messageString acu messageContent =
        match messageContent with
        | h::t ->
            match h with
            | Text text -> messageString (acu + text) t
            | Hightlight text -> messageString (acu + text) t
            | Hyperlink (text, _) -> messageString (acu + text) t
        | [] -> acu
    messageString "" message

//[<EntryPoint>]
//let createChatServer _ =     
//    let openSocketList = List<IWebSocketConnection>()
//    let peopleDictionary = Dictionary<Person, IWebSocketConnection>()
//    let messageHistory = List<ChatMessage>()
//    let messageIDDict = Dictionary<IWebSocketConnection, Dictionary<ID,ID>>()
//    
//    let sendAll (bytes : byte array) =
//        openSocketList.ForEach(fun s -> s.Send(bytes))
//    
//    let sendAllPeople (bytes : byte array) =
//        peopleDictionary.Values.ToArray()
//        |> Array.iter (fun s -> s.Send(bytes))
//
//    let sendAllPeopleExcept socket (bytes : byte array) =
//        peopleDictionary.Values.ToArray()
//        |> Array.iter (fun s -> if not (s = socket) then s.Send(bytes))
//
//    //ws://localhost:1900/ws://pchatdev.cloudapp.net:1900/
//    let server = new WebSocketServer("ws://localhost:1900/")
//
//
//    server.Start(
//        fun socket -> 
//            socket.OnOpen <-(
//                fun _ ->
//                    Trace  "client connected!"
//                    openSocketList.Add(socket)
//            )
//            socket.OnClose <-(
//                fun _ ->
//                    Trace "client diconnected!"
//                    openSocketList.Remove(socket) |> ignore
//                    peopleDictionary.Remove(peopleDictionary.First(fun kv -> kv.Value = socket).Key) |> ignore
//                    sendAllPeople (chatDataToBytes <| PeopleInRoom (peopleDictionary.Keys.ToArray() |> Array.toList))
//            )
//
//            socket.OnBinary <-(
//                fun data ->
//                    match bytesToChatData data with
//                    | ChatMessage (person, message, time, hasThumbnail, hasExtraMedia, id) ->
//                        Trace <| openSocketList.IndexOf(socket).ToString() + " sent:\t" + messageToString message
//                        let messageHistoryID = messageHistory.Count |> uint32
//                        let sanatisedMessage = (person, processMessage message, time, hasThumbnail, hasExtraMedia, messageHistoryID)
//                        messageHistory.Add(sanatisedMessage)
//                        messageIDDict.[socket].Add(id, messageHistoryID)                        
//                        sendAllPeople <| chatDataToBytes (ChatMessage sanatisedMessage)
//                    | PersonStartedTyping person -> sendAllPeopleExcept socket <| chatDataToBytes (PersonStartedTyping person)
//                    | PersonStoppedTyping person -> sendAllPeopleExcept socket <| chatDataToBytes (PersonStoppedTyping person)
//                    | PersonAway _ -> ()
//                    | PersonNotAway _ -> ()
//                    | Theme _ -> ()
//                    | PeopleInRoom  _-> ()
//                    | MessageHistory _ -> ()
//                    | ServerTime _ -> ()
//                    | RequestName name ->
//                        if peopleDictionary.Any(fun a -> 
//                                                    let key, value = a.Key, a.Value
//                                                    key.name = sanatise name) then
//                            socket.Send(chatDataToBytes <| RequestNameRejected "Name already in use.")
//                        else
//                            let peopleIds = 
//                                peopleDictionary.Keys.ToArray()
//                                |> Array.map (fun p -> p.id)
//                                |> Array.toList
//
//                            let rec findNextID (idList : uint32 list) startInt =
//                                if List.exists (fun id -> id = startInt) idList then
//                                    findNextID idList (startInt + 1ul)
//                                else
//                                    startInt
//                            let newID = findNextID peopleIds 0ul
//
//                            Trace <| "san name: " + sanatise name
//
//                            let newPerson = {id = newID; name = sanatise name}
//                            peopleDictionary.Add(newPerson, socket)         
//                            messageIDDict.Add(socket, Dictionary<ID,ID>())                   
//                            socket.Send(chatDataToBytes <| RequestNameAccepted newPerson)
//                            socket.Send(chatDataToBytes <| MessageHistory (messageHistory.ToArray() |> Array.toList))
//                            sendAllPeople (chatDataToBytes <| PeopleInRoom (peopleDictionary.Keys.ToArray() |> Array.toList))
//                    | ExtraMedia eMedia ->
//                        let newMessageID = messageIDDict.[socket].[eMedia.messageID]
//                        let newExtraMedia = { eMedia with messageID = newMessageID }
//                        match newExtraMedia.media with
//                        | Drawing d -> 
//                            Trace <| "d length: " + string d.Length    
//                            async {
//                                let! thumbBytes = createThumbnail d
//                                let thumbnail = Thumbnail {messageID = newMessageID; thumbnail = thumbBytes}
//                                sendAllPeople (chatDataToBytes thumbnail) 
//                            } |> Async.Start   
//                        | _ -> raise (Exception("match not found"))
//                        sendAllPeople (chatDataToBytes <| ExtraMedia newExtraMedia)                    
//                    | _ -> raise (Exception("match not found"))
//            )
//    )
//                        
//    server

type RoomManager = {
    roomNumber : int;
    getInitialised : unit -> bool
    getTitle : unit -> string 
    getPeopleNum : unit -> int
    addConnection : IWebSocketConnection -> unit
}

let createRoomManager roomNum =
    let openSocketList = List<IWebSocketConnection>()
    let peopleDictionary = Dictionary<Person, IWebSocketConnection>()
    let messageHistory = List<ChatMessage>()
    let messageIDDict = Dictionary<IWebSocketConnection, Dictionary<ID,ID>>()
    
    let sendAll (bytes : byte array) =
        openSocketList.ForEach(fun s -> s.Send(bytes))
    
    let sendAllPeople (bytes : byte array) =
        peopleDictionary.Values.ToArray()
        |> Array.iter (fun s -> s.Send(bytes))

    let sendAllPeopleExcept socket (bytes : byte array) =
        peopleDictionary.Values.ToArray()
        |> Array.iter (fun s -> if not (s = socket) then s.Send(bytes))

    let title = ref ""
    let initialised = ref false

    {
        roomNumber = roomNum;
        getTitle = fun () -> !title;
        getInitialised = fun () -> !initialised;
        getPeopleNum = fun () -> peopleDictionary.Count
        addConnection = 
            fun socket -> 
                socket.OnOpen <-
                    fun _ ->
                        Trace  "client connected!"
                        openSocketList.Add(socket)
                socket.OnClose <-
                    fun _ ->
                        Trace "client diconnected!"
                        openSocketList.Remove(socket) |> ignore
                        peopleDictionary.Remove(peopleDictionary.First(fun kv -> kv.Value = socket).Key) |> ignore
                        sendAllPeople (chatDataToBytes <| PeopleInRoom (peopleDictionary.Keys.ToArray() |> Array.toList))
                

                socket.OnBinary <-
                    fun data ->
                        match bytesToChatData data with
                        | ChatMessage (person, message, time, hasThumbnail, hasExtraMedia, id) ->
                            Trace <| openSocketList.IndexOf(socket).ToString() + " sent:\t" + messageToString message
                            let messageHistoryID = messageHistory.Count |> uint32
                            let sanatisedMessage = (person, processMessage message, time, hasThumbnail, hasExtraMedia, messageHistoryID)
                            messageHistory.Add(sanatisedMessage)
                            messageIDDict.[socket].Add(id, messageHistoryID)                        
                            sendAllPeople <| chatDataToBytes (ChatMessage (sanatisedMessage))
                        | PersonStartedTyping person -> sendAllPeopleExcept socket <| chatDataToBytes (PersonStartedTyping person)
                        | PersonStoppedTyping person -> sendAllPeopleExcept socket <| chatDataToBytes (PersonStoppedTyping person)
                        | PersonAway _ -> ()
                        | PersonNotAway _ -> ()
                        | Theme _ -> ()
                        | PeopleInRoom  _-> ()
                        | MessageHistory _ -> ()
                        | ServerTime _ -> ()
                        | RequestName name ->
                            if peopleDictionary.Any(fun a -> 
                                                        let key, value = a.Key, a.Value
                                                        key.name = sanatise name) then
                                socket.Send(chatDataToBytes <| RequestNameRejected "Name already in use.")
                            else
                                let sName = 
                                    let sName = sanatise name
                                    if sName.Length > 12 then sName.Substring(0,12) else sName

                                let peopleIds = 
                                    peopleDictionary.Keys.ToArray()
                                    |> Array.map (fun p -> p.id)
                                    |> Array.toList

                                let rec findNextID (idList : uint32 list) startInt =
                                    if List.exists (fun id -> id = startInt) idList then
                                        findNextID idList (startInt + 1ul)
                                    else
                                        startInt
                                let newID = findNextID peopleIds 0ul

                                let newPerson = {id = newID; name = sName}
                                if peopleDictionary.Count = 0 then
                                    title := sprintf "%s's room" sName
                                    initialised := true

                                peopleDictionary.Add(newPerson, socket)         
                                messageIDDict.Add(socket, Dictionary<ID,ID>())                   
                                socket.Send(chatDataToBytes <| RequestNameAccepted newPerson)
                                socket.Send(chatDataToBytes <| MessageHistory (messageHistory.ToArray() |> Array.toList))
                                sendAllPeople (chatDataToBytes <| PeopleInRoom (peopleDictionary.Keys.ToArray() |> Array.toList))
                        | ExtraMedia eMedia ->
                            let newMessageID = messageIDDict.[socket].[eMedia.messageID]
                            let newExtraMedia = { eMedia with messageID = newMessageID }
                            match newExtraMedia.media with
                            | Drawing d -> 
                                Trace <| "d length: " + string d.Length    
                                async {
                                    let! thumbBytes = createThumbnail d
                                    let thumbnail = Thumbnail {messageID = newMessageID; thumbnail = thumbBytes}
                                    sendAllPeople (chatDataToBytes thumbnail) 
                                } |> Async.Start   
                            | _ -> raise (Exception("match not found"))
                            sendAllPeople (chatDataToBytes <| ExtraMedia newExtraMedia)                    
                        | _ -> raise (Exception("match not found"))
                
    }
                
type ServerManager = {
    server : WebSocketServer;
    getRooms : unit -> RoomManager list
    getNextAvailRoomNum : unit -> int
}
    

let createServerManager _ =
    let roomsDict = new Dictionary<int, RoomManager>()
    let server = new WebSocketServer("ws://0.0.0.0:1900/")

    server.Start(
        fun socket ->
            socket.OnBinary <-
                fun data ->
                    match bytesToChatData data with
                    | RequestChatConnection chatRoomNum ->
                        socket.Send(chatDataToBytes <| RequestChatConnectionAccepted)
                        if not (roomsDict.ContainsKey <| int chatRoomNum) then
                            roomsDict.Add(int chatRoomNum, createRoomManager <| int chatRoomNum)
                        roomsDict.[int chatRoomNum].addConnection socket
                    | _ -> ()
    )

    {
        server = server; 
        getRooms = fun () -> [ for rm in roomsDict.Values do yield rm]
        getNextAvailRoomNum =
            fun () ->
                let rec findFreeNum num =
                    if roomsDict.ContainsKey num then
                        findFreeNum <| num + 1
                    else
                        num
                findFreeNum 0
    }