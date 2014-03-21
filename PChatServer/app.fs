module app

open Suave
open System
open System.Net
open System.IO

open Suave.Web
open Suave.Http
open Suave.Types
open Suave.Session
open ChatServer
open System.Collections.Generic

//open OpenSSL.X509
//open OpenSSL.Core



let readLocalFile path =
    async {
        let dir = Environment.CurrentDirectory
        use openFile = File.OpenRead(dir+path)
        use reader = new StreamReader(openFile)
        return! (reader.ReadToEndAsync() |> Async.AwaitTask)
    }
    
let getHtmlTemplate (fileString:string) (tempName:string) =
    let sString = fileString.Split([|"<##" + tempName + "##>"; "</##" + tempName + "##>"|], StringSplitOptions.None)
    sString.[1]

let insertHtmlListToTemplate (fileString:string) (tempName:string) listHtml =
    let sString = fileString.Split([|"<##" + tempName + "##>"; "</##" + tempName + "##>"|], StringSplitOptions.None)
    sString.[0] + listHtml + sString.[2]
    
let replaceFeild (fieldName : string, value) (template : string)=
    template.Replace("##" + fieldName + "##", value)



[<EntryPoint>]
let main argv = 

    let portNum =
        if argv |> Array.exists ((=) "-t") then
            8080
        else
            80

    let indexPage = readLocalFile "/indexpage.html" |> Async.RunSynchronously

    let roomTemplate = getHtmlTemplate indexPage "CHATROOMS_LIST"

    let getRoomListHTML (rooms : RoomManager list) =
        let rec createRoomsList (list : RoomManager list) acu =
            match list with
            | [] -> acu
            | h::t when not (h.getInitialised()) -> createRoomsList t acu
            | h::t ->
                createRoomsList t <| acu + (
                    roomTemplate
                    |> replaceFeild ("ROOM_TITLE", h.getTitle())
                    |> replaceFeild ("ROOM_PEOPLE_COUNT", string (h.getPeopleNum()))
                    |> replaceFeild ("ROOM_NUMBER", string (h.roomNumber)))
        createRoomsList rooms ""

    let makeIndexPage = getRoomListHTML >> insertHtmlListToTemplate indexPage "CHATROOMS_LIST"
    
    let server = createServerManager()


    async {
        choose [
          Console.OpenStandardOutput() |> log >>= never ;
          url "/" >>== fun req -> OK (server.getRooms() |> makeIndexPage)//(server.getRooms() |> makeIndexPage)
          url "/nextavailroom" >>== fun req ->  redirect ("/" + string (server.getNextAvailRoomNum()))
          url_scan "/%d" (fun num -> file (local_file "/chatpage.html")) ;
          GET >>= browse; //serves file if exists
          redirect "/"
          ]
          |> web_server
              { bindings =
                [ HttpBinding.Create(HTTP, "0.0.0.0", portNum) ]
              ; error_handler    = default_error_handler
              ; web_part_timeout = TimeSpan.FromMilliseconds 1000.
              ; listen_timeout   = TimeSpan.FromMilliseconds 2000.
              ; ct               = Async.DefaultCancellationToken
              ; buffer_size = 2048
              ; max_ops = 10000 }
    } |> Async.Start


    //async {
    //    let wcList = new List<WebClient>()
    //    while true do
    //        wcList.Clear()
    //        for _ in [1.. 20] do
    //            let wc = new WebClient()                
    //            wcList.Add(wc)
    //            wc.DownloadStringCompleted.Add(
    //                fun args -> 
    //                    ()
    //                    if args.Error = null then
    //                        let str = args.Result                        
    //                        if str.Contains("500 Internal Error") && not (str.StartsWith("HTTP"))  then
    //                            raise (Exception("Uh oh"))
    //            )
    //            
    //
    //            wc.DownloadStringAsync(Uri("http://localhost:8080/chatpage.html"))
    //        
    //        do! Async.Sleep 10
    //        wcList.ForEach(fun wc -> wc.Dispose())
    //        do! Async.Sleep 500
    //}|> Async.Start// |> ignore//



    Console.Read() |> ignore
    0