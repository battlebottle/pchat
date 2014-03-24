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
open System.Drawing.Imaging
open System.Runtime.Serialization
open System.Collections.Generic
open Fleck
open DataTypes
open IOHelpers

let Trace (message : string) = Console.WriteLine(message)



let writeToFile (path:string, bytes : byte array) =
    async {
        let fs = File.Create(sprintf "%s\%s" Environment.CurrentDirectory path)
        do! fs.AsyncWrite(bytes)
        fs.Dispose()
    }

let createDir (path:string) =    
    let path = sprintf "%s\%s" Environment.CurrentDirectory path
    if not <| Directory.Exists path then
        Directory.CreateDirectory path |> ignore
        
let createThumbnail (pngData : byte array) =
    async {
        use ms = new MemoryStream(pngData)
        let image = Image.FromStream(ms)
        let newBitmap = new Bitmap(image, Size(100,100))
        use msOut = new MemoryStream()    
        let myEncoderParameters = new EncoderParameters(1);

        let jgpEncoder = ImageCodecInfo.GetImageEncoders().First (fun en -> en.FormatID = ImageFormat.Jpeg.Guid)
        let myEncoderParameter = new EncoderParameter(Encoder.Quality, 85L);
        myEncoderParameters.Param.[0] <- myEncoderParameter;

        newBitmap.Save(msOut, jgpEncoder, myEncoderParameters)
        return msOut.ToArray()
    }



let renderWebPageAgent = 
    MailboxProcessor.Start(fun inbox ->
        async { 
            while true do 
                let! (url:String), (path:string), (reply:AsyncReplyChannel<unit>) = inbox.Receive()
                let path = sprintf "%s\%s" Environment.CurrentDirectory path
                let commands =  sprintf "/c ScriblRenderer.exe \"%s\" \"%s\"" url (path+"_")
                printfn "%s" commands
                let procStartInfo = new System.Diagnostics.ProcessStartInfo("cmd", commands)
                //let t = 5/0
                // The following commands are needed to redirect the standard output.
                // This means that it will be redirected to the Process.StandardOutput StreamReader.
                procStartInfo.RedirectStandardOutput <- true
                procStartInfo.UseShellExecute <- false
                // Do not create the black window.
                procStartInfo.CreateNoWindow <- true
                // Now we create a process, assign its ProcessStartInfo and start it
                let proc = new System.Diagnostics.Process()
                proc.StartInfo <- procStartInfo
                proc.Start() |> ignore
                // Get the output into a string
                proc.StandardOutput.ReadToEnd() |> ignore;
                // Display the command output.
                //Console.WriteLine(result);

                use fs = File.OpenRead(path+"_")
                let! bytes = fs.AsyncRead(fs.Length |> int)
                fs.Dispose()
                do! Async.Sleep 50
                let! thumbBytes = createThumbnail bytes
                use thumbfs = File.Create(path)
                do! thumbfs.AsyncWrite(thumbBytes)
                thumbfs.Dispose()
                reply.Reply()
     } )


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

    

let sanatise (str : string) = System.Web.HttpUtility.HtmlEncode str

let processMessage (messageContent : MessageContent) = 
    messageContent
    |> List.collect (
        fun mSpan -> 
            match mSpan with
            | Text text ->             
                let rec reduceSpans acu spans =
                    match spans with
                    | [] -> acu |> List.rev
                    | h::t ->
                        match acu with
                        | [] -> reduceSpans [h] t
                        | ah::at ->
                            let newSpan = 
                                match ah, h with
                                | Text t1, Text t2 -> [Text <| t1 + " " + t2]
                                | Text t1, Hyperlink (t2, t3) -> [Text <| t1 + " "; Hyperlink (t2, t3)]
                                | Hyperlink (t1, t2), Text t3 -> [Hyperlink (t1, t2); Text <| " " + t3]
                                | a, b -> [a; b]
                                |> List.rev
                            reduceSpans (List.append newSpan at) t

                let (|Text'|HyperLink'|) (text : string) =
                    if text.StartsWith("http") then
                        HyperLink'
                    else if text.Length > 2 && text.Substring(1, text.Length - 2).Contains('.') then
                        HyperLink'
                    else
                        Text'                        

                sanatise text
                |> (fun t -> t.Split(' '))
                |> Array.toList
                |> List.fold (fun acu str -> str :: acu) []
                |> List.rev
                |> List.map (
                    fun str -> 
                        match str with
                        | HyperLink' -> Hyperlink (str, if str.StartsWith("http://") || str.StartsWith("https://") then str else "http://" + str)
                        | Text' -> Text str
                )
                |> reduceSpans []
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


type RoomManager = {
    roomNumber : int;
    getInitialised : unit -> bool
    getTitle : unit -> string 
    getPeopleNum : unit -> int
    addConnection : IWebSocketConnection -> unit
}

let createRoomManager roomNum =
    [
        "thumbs";
        sprintf "thumbs/%i" roomNum;
        "images";
        sprintf "images/%i" roomNum;
    ]
    |> List.iter createDir


    let openSocketList = List<IWebSocketConnection>()
    let peopleDictionary = Dictionary<Person, IWebSocketConnection>()
    let messageHistory = List<ChatMessage>()
    let extraMediaHistory = List<ExtraMedia>()
    let thumbnailHistory = List<Thumbnail>()
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
                    Action<_>(
                        bytesToChatData >>
                        fun chatData ->
                            match chatData with
                            | ChatMessage (person, message, time, hasThumbnail, hasExtraMedia, id) ->
                                Trace <| openSocketList.IndexOf(socket).ToString() + " sent:\t" + messageToString message
                                let messageHistoryID = messageHistory.Count |> uint32
                                let processedMessage = processMessage message
                                //processedMessage //web url thumbnail rendering
                                //|> List.tryFind (
                                //    fun t -> 
                                //        match t with 
                                //        | Hyperlink _ -> true
                                //        | _ -> false)
                                //|> (fun o ->
                                //        match o with
                                //        | Some o ->
                                //            match o with
                                //            | Hyperlink (_, url) -> 
                                //                async {
                                //                    do! renderWebPageAgent.PostAndAsyncReply (fun reply -> url, (sprintf "thumbs/%i/%i.jpg" roomNum messageHistoryID), reply)
                                //                    let thumbnail =  {messageID = messageHistoryID; thumbnail = messageHistoryID}
                                //                    thumbnailHistory.Add thumbnail
                                //                    sendAllPeople (chatDataToBytes <| Thumbnail thumbnail) 
                                //                } |> Async.Start
                                //            | _ -> ()
                                //        | None -> ())

                                let sanatisedMessage = (person, processedMessage, DateTime.UtcNow, hasThumbnail, hasExtraMedia, messageHistoryID)
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
                                    socket.Send(chatDataToBytes 
                                        <| MessageHistory 
                                        (   (messageHistory.ToArray() |> Array.toList),
                                            (thumbnailHistory.ToArray() |> Array.toList),
                                            (extraMediaHistory.ToArray() |> Array.toList))
                                    )
                                    sendAllPeople (chatDataToBytes <| PeopleInRoom (peopleDictionary.Keys.ToArray() |> Array.toList))
                            | ExtraMedia eMedia ->
                                let newMessageID = messageIDDict.[socket].[eMedia.messageID]
                                match eMedia.media with
                                | Drawing d -> 
                                    match d with
                                    | Embedded e ->
                                        Trace <| "d length: " + string e.Length    
                                        let newExtraMedia = { eMedia with messageID = newMessageID; media = MediaType.Drawing (Reference newMessageID) }
                                        [
                                            async {
                                                let! thumbBytes = createThumbnail e
                                                let thumbnail =  {messageID = newMessageID; thumbnail = newMessageID}
                                                do! writeToFile ((sprintf "thumbs/%i/%i.jpg" roomNum newMessageID), thumbBytes)
                                                thumbnailHistory.Add thumbnail
                                                sendAllPeople (chatDataToBytes <| Thumbnail thumbnail) 
                                            };
                                            async {
                                                do! writeToFile ((sprintf "images/%i/%i.jpg" roomNum newMessageID), e)
                                                extraMediaHistory.Add newExtraMedia
                                                sendAllPeople (chatDataToBytes <| ExtraMedia newExtraMedia)  
                                            } 
                                        ] |> List.iter Async.Start
                                | _ -> raise (Exception("match not found"))                 
                            | _ -> raise (Exception("match not found"))
                )
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