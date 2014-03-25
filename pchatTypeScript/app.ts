/// <reference path="Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="viewModel.ts" />
/// <reference path="chatView.ts" />
/// <reference path="networkData.ts" />
/// <reference path="converters.ts" />
/// <reference path="networkData.ts" />
/// <reference path="chatdatawebsocket.ts" />

"use strict";
class PCHat {
    me: NetworkData.Person = null;

    vmChatMessages: ViewModel.ChatMessages = new ViewModel.ChatMessages([]);
    vmPeopleTyping: ViewModel.PeopleTyping = new ViewModel.PeopleTyping([]);
    vmPeopleDrawing: ViewModel.PeopleDrawing = new ViewModel.PeopleDrawing([]);
    vmExtraMedias: ViewModel.ExtraMedias = new ViewModel.ExtraMedias([]);
    vmThumbnails: ViewModel.Thumbnails = new ViewModel.Thumbnails([]);
    vmSendDrawing: ViewModel.SendDrawing = null

    chatRoomNum

    messagesReceivedCounter = 0
    messagesSentCounter = 0

    sendMessageText = ""

    userTyping = false
    lastTypingTime = 0
    lastDrawingTime = 0



    constructor(private viewModel: ViewModel.ViewModel<ViewModel.ViewModelBase>) {

        this.chatRoomNum = parseInt(window.location.pathname.substring(1));
        var t1 = "/2".substring(1)
        var test = parseInt(t1);
        var test2 = window.location.pathname.substring(1);

        var serialise = NetworkData.NetworkDataBase.serialise

        viewModel.addPropertyChangedListener(
            (prop: ViewModel.ViewModelBase) => {
                if (prop instanceof ViewModel.ChatMessage) {
                    var tprop = (<ViewModel.ChatMessage> prop);
                }
                else if (prop instanceof ViewModel.SendMessageText) {
                    var sendMessageText = (<ViewModel.SendMessageText> prop);
                    if (this.me !== null) {
                        connection.send(new NetworkData.PersonStoppedDrawing(this.me));
                        if (sendMessageText.messageText.length > this.sendMessageText.length) {
                            this.userTyping = true;
                            connection.send(new NetworkData.PersonStartedTyping(this.me));
                            this.lastTypingTime = Date.now();
                            setTimeout(() => {
                                if (Date.now() - this.lastTypingTime > 2500) {
                                    this.userTyping = false;
                                    connection.send(new NetworkData.PersonStoppedTyping(this.me));
                                }
                            }, 3000);
                        }
                    }
                    this.sendMessageText = sendMessageText.messageText;
                }
                else if (prop instanceof ViewModel.DrawingMouseDown) {
                    if (this.me !== null) {
                        connection.send(new NetworkData.PersonStartedDrawing(this.me));
                        this.lastDrawingTime = Date.now();
                    }
                }
                else if (prop instanceof ViewModel.DrawingMouseUp) {
                    if (this.me !== null) {
                        this.lastDrawingTime = Date.now();
                        setTimeout(() => {
                            if (Date.now() - this.lastDrawingTime > 2500) {
                                connection.send(new NetworkData.PersonStoppedDrawing(this.me));
                            }
                        }, 3000);
                    }
                }
                else if (prop instanceof ViewModel.SendMessageButtonClick) {
                    if (this.me === null) {
                        connection.send(new NetworkData.RequestName(this.sendMessageText));
                    } else {
                        if (this.sendMessageText !== "" || this.vmSendDrawing.drawingData.isSome()) {
                            this.messagesSentCounter = this.messagesSentCounter + 1;
                            connection.send(new NetworkData.ChatMessage(new NetworkData.Normal(this.me), new NetworkData.MessageContent([new NetworkData.Text(this.sendMessageText)]), this.messagesSentCounter, this.vmSendDrawing.drawingData.isSome(), this.vmSendDrawing.drawingData.isSome(), this.messagesSentCounter));
                            this.userTyping = false;
                            connection.send(new NetworkData.PersonStoppedTyping(this.me));
                            if (this.vmSendDrawing.drawingData.isSome()) {
                                connection.send(new NetworkData.ExtraMedia(this.messagesSentCounter, new NetworkData.Drawing(new NetworkData.ImageEmbdedded(this.vmSendDrawing.drawingData.getValue()))));
                            }
                        }
                    }
                }
                else if (prop instanceof ViewModel.SendDrawing) {
                    var sendDrawing = (<ViewModel.SendDrawing> prop);
                    this.vmSendDrawing = sendDrawing;
                }
            }
            );

        var connection: ChatDataWebSocket;

        var setUpConnection = () => {
            connection = new ChatDataWebSocket(window.location.hostname);

            connection.onopen = (ev) => {
                connection.send(new NetworkData.RequestChatConnection(this.chatRoomNum));



                connection.onclose = (ev) => {
                    viewModel.setProp(new ViewModel.PeopleInRoom([]));
                    addMessage(createServerMessage("Connection to server lost...", true));
                    var connectionAttempCount = 0;
                    var reconnect = () => {
                        if (!connection.isOpen()) {
                            connectionAttempCount += 1;
                            if (connectionAttempCount > 1) {
                                addMessage(createServerMessage("reconnection attempt failed.", true));
                            }
                            addMessage(createServerMessage("attempting to reconnect... (attempt %%)".replace("%%", connectionAttempCount.toString()), false));
                            setUpConnection();
                            setTimeout(reconnect, 5000);
                        }
                    }
                    reconnect();
                }
            }

        var createServerMessage = (message: string, highlight: boolean) => {
                return new ViewModel.ChatMessage(
                    new ViewModel.Server(),
                    new ViewModel.MessageContent([(highlight ? new ViewModel.Hightlight(message) : new ViewModel.Text(message))]),
                    Date.now(),
                    this.messagesReceivedCounter,
                    false,
                    false);
            }

        var addMessage = (chatMessage: ViewModel.ChatMessage) => {
                this.messagesReceivedCounter = this.messagesReceivedCounter + 1;
                this.vmChatMessages.chatMessages.push(chatMessage);
                viewModel.setProp(this.vmChatMessages);
            }

        var conv = Converters.NetworkToVMConverter;

            connection.onchatdata = (chatData: NetworkData.NetworkDataBase) => {
                if (chatData instanceof NetworkData.ChatMessage) {
                    this.messagesReceivedCounter = this.messagesReceivedCounter + 1;
                    var vmChatMessage = conv.chatMessageToChatMessage((<NetworkData.ChatMessage> chatData));
                    this.vmChatMessages.chatMessages.push(vmChatMessage);
                    viewModel.setProp(this.vmChatMessages);
                }
                else if (chatData instanceof NetworkData.PersonStartedTyping) {
                    var vmp = conv.personToPerson((<NetworkData.PersonStartedTyping> chatData).person);
                    if (!this.vmPeopleTyping.people.some((p) => p.id === vmp.id && p.name === vmp.name)) {
                        this.vmPeopleTyping.people.push(vmp);
                        viewModel.setProp(this.vmPeopleTyping);
                    }
                }
                else if (chatData instanceof NetworkData.PersonStoppedTyping) {
                    var vmp = conv.personToPerson((<NetworkData.PersonStoppedTyping> chatData).person);
                    if (this.vmPeopleTyping.people.some((p) => p.id === vmp.id && p.name === vmp.name)) {
                        this.vmPeopleTyping.people = this.vmPeopleTyping.people.filter((p) => p.id !== vmp.id || p.name !== vmp.name)
                    viewModel.setProp(this.vmPeopleTyping);
                    }
                }
                else if (chatData instanceof NetworkData.PersonStartedDrawing) {
                    var vmp = conv.personToPerson((<NetworkData.PersonStartedDrawing> chatData).person);
                    if (!this.vmPeopleDrawing.people.some((p) => p.id === vmp.id && p.name === vmp.name)) {
                        this.vmPeopleDrawing.people.push(vmp);
                        viewModel.setProp(this.vmPeopleDrawing);
                    }
                }
                else if (chatData instanceof NetworkData.PersonStoppedDrawing) {
                    var vmp = conv.personToPerson((<NetworkData.PersonStoppedDrawing> chatData).person);
                    if (this.vmPeopleDrawing.people.some((p) => p.id === vmp.id && p.name === vmp.name)) {
                        this.vmPeopleDrawing.people = this.vmPeopleTyping.people.filter((p) => p.id !== vmp.id || p.name !== vmp.name)
                    viewModel.setProp(this.vmPeopleDrawing);
                    }
                }
                else if (chatData instanceof NetworkData.RequestNameAccepted) {
                    var requestNameAccepted = (<NetworkData.RequestNameAccepted> chatData);
                    this.me = requestNameAccepted.person;
                    viewModel.setProp(new ViewModel.Me(conv.personToPerson(requestNameAccepted.person)));
                    this.vmChatMessages.chatMessages = [];
                    viewModel.setProp(this.vmChatMessages);
                }
                else if (chatData instanceof NetworkData.PeopleInRoom) {
                    var peopleInRoom = (<NetworkData.PeopleInRoom> chatData);
                    viewModel.setProp(conv.peopleInRoomToPeopleInRoom(peopleInRoom));
                }
                else if (chatData instanceof NetworkData.MessageHistory) {
                    var messageHistory = (<NetworkData.MessageHistory> chatData);
                    this.vmChatMessages = new ViewModel.ChatMessages(messageHistory.messages.map((m) => conv.chatMessageToChatMessage(m)));
                    this.vmExtraMedias = new ViewModel.ExtraMedias(messageHistory.extraMedia.map((em) => conv.extraMediaToExtraMedia(em)));
                    this.vmThumbnails = new ViewModel.Thumbnails(messageHistory.thumbnails.map((t) => conv.thumbnailToThumbnail(t)));
                    viewModel.setProp(this.vmChatMessages);
                    viewModel.setProp(this.vmExtraMedias);
                    viewModel.setProp(this.vmThumbnails);
                }
                else if (chatData instanceof NetworkData.ExtraMedia) {
                    var extraMedia = (<NetworkData.ExtraMedia> chatData);
                    this.vmExtraMedias.extraMedias.push(conv.extraMediaToExtraMedia(extraMedia));
                    viewModel.setProp(this.vmExtraMedias);
                }
                else if (chatData instanceof NetworkData.Thumbnail) {
                    var thumbnail = (<NetworkData.Thumbnail> chatData);
                    this.vmThumbnails.thumbnails.push(conv.thumbnailToThumbnail(thumbnail));
                    viewModel.setProp(this.vmThumbnails);
                }
                else if (chatData instanceof NetworkData.RequestNameRejected) {
                    var nameRejected = (<NetworkData.RequestNameRejected> chatData);
                    this.vmChatMessages.chatMessages.push(
                        new ViewModel.ChatMessage(
                            new ViewModel.Server(),
                            new ViewModel.MessageContent([new ViewModel.Hightlight(nameRejected.reason)]),
                            0, this.messagesReceivedCounter, false, false));
                    this.messagesReceivedCounter = this.messagesReceivedCounter + 1;
                    viewModel.setProp(this.vmChatMessages);
                }
                else if (chatData instanceof NetworkData.RequestChatConnectionAccepted) {
                    var accepted = (<NetworkData.RequestChatConnectionAccepted> chatData);
                    this.vmChatMessages.chatMessages.push(
                        new ViewModel.ChatMessage(
                            new ViewModel.Server(),
                            new ViewModel.MessageContent([new ViewModel.Text("Enter a name you wish to use in the room")]),
                            0, this.messagesReceivedCounter, false, false));
                    this.messagesReceivedCounter = this.messagesReceivedCounter + 1;
                    viewModel.setProp(this.vmChatMessages);
                }
            }
            };
        setUpConnection();

    }
}

function bin2String(array) {
    var result = "";
    for (var i = 0; i < array.length; i++) {
        result += String.fromCharCode(array[i]);
    }
    return result;
}

class Test {
    testProp: string
}

class Test2 extends Test {
    test2prop: string
}
class Test3 extends Test {
    test3prop: string
}

window.onload = () => {
    var jim = new ViewModel.Person(1, "Jim");

    var getName = function () {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec((this).constructor.toString());
        return (results && results.length > 1) ? results[1] : "";
    };

    var vm = new ViewModel.ViewModel<ViewModel.ViewModelBase>(
        [
            new ViewModel.Person(1, "Jim"),
            new ViewModel.PeopleInRoom([jim, jim])
        ],
        (prop) => {
            var t = getName.call(prop);
            return t;
        });

    var view = new PChatView.PChatView(vm);
    var pchat = new PCHat(vm);

    var testFunc = (testObj: Test) => {

        if (testObj instanceof Test2) {
            console.log("test2");
        }
        else if (testObj instanceof Test3) {
            console.log("test3");
        }
    };


    var test: Test = new Test2();
    testFunc(test);
    test = new Test3();
    testFunc(test);

};