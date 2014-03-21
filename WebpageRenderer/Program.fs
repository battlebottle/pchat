// Learn more about F# at http://fsharp.net
// See the 'F# Tutorial' project for more help.
open System
open System.IO
open Awesomium.Core
open System.Text
open Microsoft.WindowsAzure.Storage
open Microsoft.WindowsAzure.Storage.Auth
open Microsoft.WindowsAzure.Storage.Blob


let CalculateMD5Hash (input:String) = 
    // step 1, calculate MD5 hash from input
    let md5 = System.Security.Cryptography.MD5.Create();
    let inputBytes = System.Text.Encoding.ASCII.GetBytes(input);
    let hash = md5.ComputeHash(inputBytes);
 
    // step 2, convert byte array to hex string
    let sb = new StringBuilder();
    for i in hash do
        sb.Append(i.ToString("X2")) |> ignore
    sb.ToString()



let cleanFilename (filename:String) =
//    let rec loop illegalChars (string:String) =
//        match illegalChars with
//        | head :: tail -> loop tail (string.Replace(head, ""))
//        | [] -> string    
//    loop (Array.toList (System.IO.Path.GetInvalidFileNameChars()) |> List.map string) filename
    CalculateMD5Hash filename

let saveToBlobStorage stream fileName =
    let storageAccount = CloudStorageAccount.Parse("DefaultEndpointsProtocol=http;AccountName=scriblprototype;AccountKey=oRrPuannBo+bIWYdhkQNx/4u4pATp7VLf6qu7V78ATbK391boco6BWSFck+w7P6eK9Uwe8w0qVoCw5AMrVI2IA==");
    let blobClient = storageAccount.CreateCloudBlobClient();
    let container = blobClient.GetContainerReference("scribl")
    let blockBlob = container.GetBlockBlobReference(fileName);
    blockBlob.UploadFromStream(stream)
    

let renderURL url (path : string) =
    async{
        let sizeChanged = ref(false)
        let mutable webPreferences = new WebPreferences()
        let defaultSize = 1024

        webPreferences.CustomCSS <- "::-webkit-scrollbar { visibility: hidden; }"
        use session = WebCore.CreateWebSession(webPreferences)
        use vw = WebCore.CreateWebView(1024, defaultSize, session)
        //vw.
        vw.Source <- new Uri(url);        

        while vw.IsLoading do
            WebCore.Update()
        for i in [1 .. 100] do
            WebCore.Update()
            System.Threading.Thread.Sleep(10)
        //let docHeight = vw.ExecuteJavascriptWithResult( "(function() { var bodyElmnt = document.body; var html = document.documentElement; var height = Math.max( bodyElmnt.scrollHeight, bodyElmnt.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight ); return height; })();" ).ToString()
        //
        //(vw.Surface :?> Awesomium.Core.BitmapSurface).Resized.Add( fun o -> sizeChanged := true)
        //
        //let newSize = System.Int32.Parse(docHeight)
        //
        //vw.Resize(1024, System.Int32.Parse(docHeight))
        //if newSize > defaultSize then
        //    while not !sizeChanged do
        //        WebCore.Update()
           
        let fn = cleanFilename url

        //if not (System.IO.Directory.Exists(path)) then
        //    System.IO.Directory.CreateDirectory(path) |> ignore
        let path = path.Replace('/','\\')
        (vw.Surface :?> Awesomium.Core.BitmapSurface).SaveToJPEG(path, 80) |> ignore

        //azure blob sotrage

//        use fs = File.OpenRead("C:\\scribl_images\\" + fn + ".png")
//        saveToBlobStorage fs (fn + ".png")
}

[<EntryPoint>]
let main argv = 
    printfn "Rendering %A" argv.[0]
    renderURL argv.[0] argv.[1] |> Async.StartImmediate
    printfn "Rendering complete!"
    0 // return an integer exit code
