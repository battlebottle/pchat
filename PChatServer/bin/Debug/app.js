/// <reference path="Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="viewModel.ts" />
/// <reference path="chatView.ts" />
/// <reference path="networkData.ts" />
/// <reference path="converters.ts" />
"use strict";
var PCHat = (function () {
    function PCHat(viewModel) {
        var _this = this;
        this.viewModel = viewModel;
        this.me = null;
        this.vmChatMessages = new ViewModel.ChatMessages([]);
        this.vmPeopleTyping = new ViewModel.PeopleTyping([]);
        this.vmExtraMedias = new ViewModel.ExtraMedias([]);
        this.vmThumbnails = new ViewModel.Thumbnails([]);
        this.vmSendDrawing = null;
        this.messagesReceivedCounter = 0;
        this.messagesSentCounter = 0;
        this.sendMessageText = "";
        this.userTyping = false;
        this.lastTypingTime = 0;
        this.chatRoomNum = parseInt(window.location.pathname.substring(1));
        var t1 = "/2".substring(1);
        var test = parseInt(t1);
        var test2 = window.location.pathname.substring(1);

        viewModel.addPropertyChangedListener(function (prop) {
            if (prop.type === 3 /* ChatMessage */) {
                var tprop = prop;
            } else if (prop.type === 7 /* SendMessageText */) {
                var sendMessageText = prop;
                if (sendMessageText.messageText.length > _this.sendMessageText.length && _this.me !== null) {
                    _this.userTyping = true;
                    var bw = new NetworkData.ArrayBufferWriter();
                    bw.writePersonStartedTyping(new NetworkData.PersonStartedTyping(_this.me));
                    connection.send(bw.toByteArray());
                    _this.lastTypingTime = Date.now();
                    setTimeout(function () {
                        if (Date.now() - _this.lastTypingTime > 2500) {
                            _this.userTyping = false;
                            connection.send(new NetworkData.PersonStoppedTyping(_this.me).serialise());
                        }
                    }, 3000);
                }

                _this.sendMessageText = sendMessageText.messageText;
            } else if (prop.type === 8 /* SendMessageButtonClick */) {
                if (_this.me === null) {
                    var bw = new NetworkData.ArrayBufferWriter();
                    bw.writeRequestName(new NetworkData.RequestName(_this.sendMessageText));
                    connection.send(bw.toByteArray());
                } else {
                    if (_this.sendMessageText !== "" || _this.vmSendDrawing.drawingData.isSome()) {
                        _this.messagesSentCounter = _this.messagesSentCounter + 1;
                        connection.send(new NetworkData.ChatMessage(new NetworkData.Normal(_this.me), [new NetworkData.Text(_this.sendMessageText)], _this.messagesSentCounter, _this.vmSendDrawing.drawingData.isSome(), _this.vmSendDrawing.drawingData.isSome(), _this.messagesSentCounter).serialise());
                        _this.userTyping = false;
                        connection.send(new NetworkData.PersonStoppedTyping(_this.me).serialise());
                        if (_this.vmSendDrawing.drawingData.isSome()) {
                            connection.send(new NetworkData.ExtraMedia(_this.messagesSentCounter, new NetworkData.Drawing(_this.vmSendDrawing.drawingData.getValue())).serialise());
                        }
                    }
                }
            } else if (prop.type === 11 /* SendDrawing */) {
                var sendDrawing = prop;
                _this.vmSendDrawing = sendDrawing;
            }
        });

        //ws://localhost:1900/ws://pchatdev.cloudapp.net:1900/
        var connection = new WebSocket('ws://' + window.location.hostname + ':1900/');

        connection.binaryType = 'arraybuffer';

        connection.onopen = function (ev) {
            connection.send(new NetworkData.RequestChatConnection(_this.chatRoomNum).serialise());
        };

        connection.onmessage = function (ev) {
            var conv = Converters.NetworkToVMConverter;
            console.log(ev.data.byteLength);
            var chatData = _this.bufferToPChatData(ev.data);

            if (chatData.type === 1 /* ChatMessage */) {
                _this.messagesReceivedCounter = _this.messagesReceivedCounter + 1;
                var vmChatMessage = conv.chatMessageToChatMessage(chatData);
                _this.vmChatMessages.chatMessages.push(vmChatMessage);
                viewModel.setProp(_this.vmChatMessages);
            } else if (chatData.type === 2 /* PersonStartedTyping */) {
                var vmp = conv.personToPerson(chatData.person);
                if (!_this.vmPeopleTyping.people.some(function (p) {
                    return p.id === vmp.id && p.name === vmp.name;
                })) {
                    _this.vmPeopleTyping.people.push(vmp);
                    viewModel.setProp(_this.vmPeopleTyping);
                }
            } else if (chatData.type === 3 /* PersonStoppedTyping */) {
                var vmp = conv.personToPerson(chatData.person);
                if (_this.vmPeopleTyping.people.some(function (p) {
                    return p.id === vmp.id && p.name === vmp.name;
                })) {
                    _this.vmPeopleTyping.people = _this.vmPeopleTyping.people.filter(function (p) {
                        return p.id !== vmp.id || p.name !== vmp.name;
                    });
                    viewModel.setProp(_this.vmPeopleTyping);
                }
            } else if (chatData.type === 11 /* RequestNameAccepted */) {
                var requestNameAccepted = chatData;
                _this.me = requestNameAccepted.person;
                viewModel.setProp(new ViewModel.Me(conv.personToPerson(requestNameAccepted.person)));
                _this.vmChatMessages.chatMessages = [];
                viewModel.setProp(_this.vmChatMessages);
            } else if (chatData.type === 7 /* PeopleInRoom */) {
                var peopleInRoom = chatData;
                viewModel.setProp(conv.peopleInRoomToPeopleInRoom(peopleInRoom));
            } else if (chatData.type === 8 /* MessageHistory */) {
                var messageHistory = chatData;
                _this.vmChatMessages = new ViewModel.ChatMessages(messageHistory.messages.map(function (m) {
                    return conv.chatMessageToChatMessage(m);
                }));
                viewModel.setProp(_this.vmChatMessages);
            } else if (chatData.type === 14 /* ExtraMedia */) {
                var extraMedia = chatData;
                _this.vmExtraMedias.extraMedias.push(conv.extraMediaToExtraMedia(extraMedia));
                viewModel.setProp(_this.vmExtraMedias);
            } else if (chatData.type === 13 /* Thumbnail */) {
                var thumbnail = chatData;
                _this.vmThumbnails.thumbnails.push(conv.thumbnailToThumbnail(thumbnail));
                viewModel.setProp(_this.vmThumbnails);
            } else if (chatData.type === 12 /* RequestNameRejected */) {
                var nameRejected = chatData;
                _this.vmChatMessages.chatMessages.push(new ViewModel.ChatMessage(new ViewModel.Server(), [new ViewModel.Hightlight(nameRejected.reason)], 0, _this.messagesReceivedCounter, false, false));
                _this.messagesReceivedCounter = _this.messagesReceivedCounter + 1;
                viewModel.setProp(_this.vmChatMessages);
            } else if (chatData.type === 16 /* RequestChatConnectionAccepted */) {
                var accepted = chatData;
                _this.vmChatMessages.chatMessages.push(new ViewModel.ChatMessage(new ViewModel.Server(), [new ViewModel.Text("Enter a name you wish to use in the room")], 0, _this.messagesReceivedCounter, false, false));
                _this.messagesReceivedCounter = _this.messagesReceivedCounter + 1;
                viewModel.setProp(_this.vmChatMessages);
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
    PCHat.prototype.bufferToPChatData = function (arrayBuffer) {
        var reader = new NetworkData.ArrayBufferReader(arrayBuffer);
        var headerByte = reader.readByte();
        if (headerByte === 0) {
            var chatMessage = reader.readChatMessage();
            return chatMessage;
        } else if (headerByte === 1) {
            var personStartedTyping = reader.readPersonStartedTyping();
            return personStartedTyping;
        } else if (headerByte === 2) {
            var personStoppedTyping = reader.readPersonStoppedTyping();
            return personStoppedTyping;
        } else if (headerByte === 6) {
            var peopleInRoom = reader.readPeopleInRoom();
            return peopleInRoom;
        } else if (headerByte === 7) {
            var messageHistory = reader.readMessageHistory();
            return messageHistory;
        } else if (headerByte === 9) {
            var requestedNameAccepted = reader.readRequestNameAccepted();
            return requestedNameAccepted;
        } else if (headerByte === 10) {
            var extraMedia = reader.readExtraMedia();
            return extraMedia;
        } else if (headerByte === 11) {
            var thumbnail = reader.readThumbnail();
            return thumbnail;
        } else if (headerByte === 12) {
            var accepted = reader.readRequestChatConnectionAccepted();
            return accepted;
        } else if (headerByte === 13) {
            var rejected = reader.readRequestChatConnectionRejected();
            return rejected;
        } else if (headerByte === 14) {
            var rejected = reader.readRequestNameRejected();
            return rejected;
        }
    };
    return PCHat;
})();

function bin2String(array) {
    var result = "";
    for (var i = 0; i < array.length; i++) {
        result += String.fromCharCode(array[i]);
    }
    return result;
}

window.onload = function () {
    var jim = new ViewModel.Person(1, "Jim");

    var vm = new ViewModel.ViewModel([
        new ViewModel.Person(1, "Jim"),
        new ViewModel.PeopleInRoom([jim, jim])
    ], function (prop) {
        return ViewModel.IPChatViewModelEnum[prop.type];
    });

    var view = new PChatView.PChatView(vm);
    var pchat = new PCHat(vm);
};
//# sourceMappingURL=app.js.map
