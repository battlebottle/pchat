/// <reference path="Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="viewModel.ts" />
/// <reference path="chatView.ts" />
/// <reference path="networkData.ts" />
/// <reference path="converters.ts" />


class PCHat {
    me: NetworkData.Person = null;

    vmChatMessages: ViewModel.ChatMessages = new ViewModel.ChatMessages([]);
    vmPeopleTyping: ViewModel.PeopleTyping = new ViewModel.PeopleTyping([]);
    vmExtraMedias: ViewModel.ExtraMedias = new ViewModel.ExtraMedias([]);
    vmThumbnails: ViewModel.Thumbnails = new ViewModel.Thumbnails([]);
    vmSendDrawing: ViewModel.SendDrawing = null

    chatRoomNum

    messagesReceivedCounter = 0
    messagesSentCounter = 0

    sendMessageText = ""

    userTyping = false
    lastTypingTime = 0

    bufferToPChatData(arrayBuffer: ArrayBuffer) {

        var reader = new NetworkData.ArrayBufferReader(arrayBuffer);
        var headerByte = reader.readByte()
        if (headerByte === 0) {
            var chatMessage = reader.readChatMessage();
            return <NetworkData.NetworkData>chatMessage;
        }
        else if (headerByte === 1) {
            var personStartedTyping = reader.readPersonStartedTyping();
            return personStartedTyping;
        }
        else if (headerByte === 2) {
            var personStoppedTyping = reader.readPersonStoppedTyping();
            return personStoppedTyping;
        }
        else if (headerByte === 6) {
            var peopleInRoom = reader.readPeopleInRoom();
            return peopleInRoom;
        }
        else if (headerByte === 7) {
            var messageHistory = reader.readMessageHistory()
            return messageHistory;
        }
        else if (headerByte === 9) {
            var requestedNameAccepted = reader.readRequestNameAccepted();
            return requestedNameAccepted;
        }
        else if (headerByte === 10) {
            var extraMedia = reader.readExtraMedia()
            return extraMedia;
        }
        else if (headerByte === 11) {
            var thumbnail = reader.readThumbnail()
            return thumbnail;
        }
        else if (headerByte === 12) {
            var accepted = reader.readRequestChatConnectionAccepted()
            return accepted;
        }
        else if (headerByte === 13) {
            var rejected = reader.readRequestChatConnectionRejected()
            return rejected;
        }
    }

    constructor(private viewModel: ViewModel.ViewModel<ViewModel.IPChatViewModelEnum>) {

        this.chatRoomNum = parseInt(window.location.pathname.substring(1));
        var t1 = "/2".substring(1)
        var test = parseInt(t1);
        var test2 = window.location.pathname.substring(1);

        viewModel.addPropertyChangedListener(
            (prop: ViewModel.ViewModelData<ViewModel.IPChatViewModelEnum>) => {
                if (prop.type === ViewModel.IPChatViewModelEnum.ChatMessage) {
                    var tprop = (<ViewModel.ChatMessage> prop);
                }
                else if (prop.type === ViewModel.IPChatViewModelEnum.SendMessageText) {
                    var sendMessageText = (<ViewModel.SendMessageText> prop);
                    if (sendMessageText.messageText.length > this.sendMessageText.length && this.me !== null) {
                        this.userTyping = true;
                        var bw = new NetworkData.ArrayBufferWriter();
                        bw.writePersonStartedTyping(new NetworkData.PersonStartedTyping(this.me));
                        connection.send(bw.toByteArray());
                        this.lastTypingTime = Date.now();
                        setTimeout(() => {
                            if (Date.now() - this.lastTypingTime > 2500) {
                                this.userTyping = false;
                                connection.send(new NetworkData.PersonStoppedTyping(this.me).serialise());
                            }
                        }, 3000);
                    }

                    this.sendMessageText = sendMessageText.messageText;
                }
                else if (prop.type === ViewModel.IPChatViewModelEnum.SendMessageButtonClick) {
                    if (this.me === null) {
                        var bw = new NetworkData.ArrayBufferWriter();
                        bw.writeRequestName(new NetworkData.RequestName(this.sendMessageText));
                        connection.send(bw.toByteArray());
                    } else {
                        if (this.sendMessageText !== "" || this.vmSendDrawing.drawingData.isSome()) {
                            this.messagesSentCounter = this.messagesSentCounter + 1;
                            connection.send(new NetworkData.ChatMessage(this.me, this.sendMessageText, this.messagesSentCounter, this.vmSendDrawing.drawingData.isSome(), this.vmSendDrawing.drawingData.isSome(), this.messagesSentCounter).serialise());
                            this.userTyping = false;
                            connection.send(new NetworkData.PersonStoppedTyping(this.me).serialise());
                            if (this.vmSendDrawing.drawingData.isSome()) {
                                connection.send(new NetworkData.ExtraMedia(this.messagesSentCounter, new NetworkData.Drawing(this.vmSendDrawing.drawingData.getValue())).serialise());
                            }
                        }
                    }
                }
                else if (prop.type === ViewModel.IPChatViewModelEnum.SendDrawing) {
                    var sendDrawing = (<ViewModel.SendDrawing> prop);
                    this.vmSendDrawing = sendDrawing;
                }
            }
            );

        //ws://localhost:1900/ws://pchatdev.cloudapp.net:1900/
        var connection = new WebSocket('ws://'+window.location.hostname+':1900/');

        connection.binaryType = 'arraybuffer';

        connection.onopen = (ev) => {            
            connection.send(new NetworkData.RequestChatConnection(this.chatRoomNum).serialise())
        }


        connection.onmessage = (ev) => {
            var conv = Converters.NetworkToVMConverter;
            console.log(ev.data.byteLength);
            var chatData = this.bufferToPChatData(ev.data)

            if (chatData.type === NetworkData.INetworkData.ChatMessage) {
                this.messagesReceivedCounter = this.messagesReceivedCounter + 1;
                var vmChatMessage = conv.chatMessageToChatMessage((<NetworkData.ChatMessage> chatData));
                this.vmChatMessages.chatMessages.push(vmChatMessage);
                viewModel.setProp(this.vmChatMessages);
            }
            else if (chatData.type === NetworkData.INetworkData.PersonStartedTyping) {
                var vmp = conv.personToPerson((<NetworkData.PersonStartedTyping> chatData).person);
                if (!this.vmPeopleTyping.people.some((p) => p.id === vmp.id && p.name === vmp.name)) {
                    this.vmPeopleTyping.people.push(vmp);
                    viewModel.setProp(this.vmPeopleTyping);
                }
            }
            else if (chatData.type === NetworkData.INetworkData.PersonStoppedTyping) {
                var vmp = conv.personToPerson((<NetworkData.PersonStoppedTyping> chatData).person);
                if (this.vmPeopleTyping.people.some((p) => p.id === vmp.id && p.name === vmp.name)) {
                    this.vmPeopleTyping.people = this.vmPeopleTyping.people.filter((p) => p.id !== vmp.id || p.name !== vmp.name)
                    viewModel.setProp(this.vmPeopleTyping);
                }
            }
            else if (chatData.type === NetworkData.INetworkData.RequestNameAccepted) {
                var requestNameAccepted = (<NetworkData.RequestNameAccepted> chatData);
                this.me = requestNameAccepted.person;
                viewModel.setProp(new ViewModel.Me(conv.personToPerson(requestNameAccepted.person)));
            }
            else if (chatData.type === NetworkData.INetworkData.PeopleInRoom) {
                var peopleInRoom = (<NetworkData.PeopleInRoom> chatData);
                viewModel.setProp(conv.peopleInRoomToPeopleInRoom(peopleInRoom));
            }
            else if (chatData.type === NetworkData.INetworkData.MessageHistory) {
                var messageHistory = (<NetworkData.MessageHistory> chatData);
                this.vmChatMessages = new ViewModel.ChatMessages(messageHistory.messages.map((m) => conv.chatMessageToChatMessage(m)));
                viewModel.setProp(this.vmChatMessages);
            }
            else if (chatData.type === NetworkData.INetworkData.ExtraMedia) {
                var extraMedia = (<NetworkData.ExtraMedia> chatData);
                this.vmExtraMedias.extraMedias.push(conv.extraMediaToExtraMedia(extraMedia));
                viewModel.setProp(this.vmExtraMedias);
            }
            else if (chatData.type === NetworkData.INetworkData.Thumbnail) {
                var thumbnail = (<NetworkData.Thumbnail> chatData);
                this.vmThumbnails.thumbnails.push(conv.thumbnailToThumbnail(thumbnail));
                viewModel.setProp(this.vmThumbnails);
            }
            else if (chatData.type === NetworkData.INetworkData.RequestNameAccepted) {
                var accepted = (<NetworkData.RequestChatConnectionAccepted> chatData);
            }
        };


        //var clickResponse = () => {
        //    var inputText = $("#textInput").val();
        //    $("#textInput").val("");
        //    if (this.me === null) {
        //        var bw = new NetworkData.ArrayBufferWriter();
        //        bw.writeRequestName(new NetworkData.RequestName(inputText));
        //        connection.send(bw.toByteArray());
        //    } else {
        //        var bw = new NetworkData.ArrayBufferWriter();
        //        bw.writeChatMessage(new NetworkData.ChatMessage(this.me, inputText, 0));
        //        connection.send(bw.toByteArray());
        //    }
        //};
        //
        //
        //$("#textInputButton").click(clickResponse);
        //$("#textInput").keyup((e) => { if (e.keyCode == 13) { clickResponse(); } });

    }
}

function bin2String(array) {
    var result = "";
    for (var i = 0; i < array.length; i++) {
        result += String.fromCharCode(array[i]);
    }
    return result;
}


window.onload = () => {
    var jim = new ViewModel.Person(1, "Jim");

    var vm = new ViewModel.ViewModel<ViewModel.IPChatViewModelEnum>(
        [
            new ViewModel.Person(1, "Jim"),
            new ViewModel.PeopleInRoom([jim, jim])
        ],
        (prop) => ViewModel.IPChatViewModelEnum[prop.type]);

    var view = new PChatView.PChatView(vm);
    var pchat = new PCHat(vm);

};