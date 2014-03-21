/// <reference path="Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="viewModel.ts" />
/// <reference path="chatView.ts" />
/// <reference path="networkData.ts" />
/// <reference path="converters.ts" />
/// <reference path="networkData.ts" />
/// <reference path="chatdatawebsocket.ts" />
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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

        var serialise = NetworkData.NetworkDataBase.serialise;

        viewModel.addPropertyChangedListener(function (prop) {
            if (prop instanceof ViewModel.ChatMessage) {
                var tprop = prop;
            } else if (prop instanceof ViewModel.SendMessageText) {
                var sendMessageText = prop;
                if (sendMessageText.messageText.length > _this.sendMessageText.length && _this.me !== null) {
                    _this.userTyping = true;
                    connection.send(new NetworkData.PersonStartedTyping(_this.me));
                    _this.lastTypingTime = Date.now();
                    setTimeout(function () {
                        if (Date.now() - _this.lastTypingTime > 2500) {
                            _this.userTyping = false;
                            connection.send(new NetworkData.PersonStoppedTyping(_this.me));
                        }
                    }, 3000);
                }

                _this.sendMessageText = sendMessageText.messageText;
            } else if (prop instanceof ViewModel.SendMessageButtonClick) {
                if (_this.me === null) {
                    connection.send(new NetworkData.RequestName(_this.sendMessageText));
                } else {
                    if (_this.sendMessageText !== "" || _this.vmSendDrawing.drawingData.isSome()) {
                        _this.messagesSentCounter = _this.messagesSentCounter + 1;
                        connection.send(new NetworkData.ChatMessage(new NetworkData.Normal(_this.me), new NetworkData.MessageContent([new NetworkData.Text(_this.sendMessageText)]), _this.messagesSentCounter, _this.vmSendDrawing.drawingData.isSome(), _this.vmSendDrawing.drawingData.isSome(), _this.messagesSentCounter));
                        _this.userTyping = false;
                        connection.send(new NetworkData.PersonStoppedTyping(_this.me));
                        if (_this.vmSendDrawing.drawingData.isSome()) {
                            connection.send(new NetworkData.ExtraMedia(_this.messagesSentCounter, new NetworkData.Drawing(new NetworkData.ImageEmbdedded(_this.vmSendDrawing.drawingData.getValue()))));
                        }
                    }
                }
            } else if (prop instanceof ViewModel.SendDrawing) {
                var sendDrawing = prop;
                _this.vmSendDrawing = sendDrawing;
            }
        });

        var connection;

        var setUpConnection = function () {
            connection = new ChatDataWebSocket(window.location.hostname);

            connection.onopen = function (ev) {
                connection.send(new NetworkData.RequestChatConnection(_this.chatRoomNum));

                connection.onclose = function (ev) {
                    viewModel.setProp(new ViewModel.PeopleInRoom([]));
                    addMessage(createServerMessage("Connection to server lost...", true));
                    var connectionAttempCount = 0;
                    var reconnect = function () {
                        if (!connection.isOpen()) {
                            connectionAttempCount += 1;
                            if (connectionAttempCount > 1) {
                                addMessage(createServerMessage("reconnection attempt failed.", true));
                            }
                            addMessage(createServerMessage("attempting to reconnect... (attempt %%)".replace("%%", connectionAttempCount.toString()), false));
                            setUpConnection();
                            setTimeout(reconnect, 5000);
                        }
                    };
                    reconnect();
                };
            };

            var createServerMessage = function (message, highlight) {
                return new ViewModel.ChatMessage(new ViewModel.Server(), new ViewModel.MessageContent([(highlight ? new ViewModel.Hightlight(message) : new ViewModel.Text(message))]), Date.now(), _this.messagesReceivedCounter, false, false);
            };

            var addMessage = function (chatMessage) {
                _this.messagesReceivedCounter = _this.messagesReceivedCounter + 1;
                _this.vmChatMessages.chatMessages.push(chatMessage);
                viewModel.setProp(_this.vmChatMessages);
            };

            var conv = Converters.NetworkToVMConverter;

            connection.onchatdata = function (chatData) {
                if (chatData instanceof NetworkData.ChatMessage) {
                    _this.messagesReceivedCounter = _this.messagesReceivedCounter + 1;
                    var vmChatMessage = conv.chatMessageToChatMessage(chatData);
                    _this.vmChatMessages.chatMessages.push(vmChatMessage);
                    viewModel.setProp(_this.vmChatMessages);
                } else if (chatData instanceof NetworkData.PersonStartedTyping) {
                    var vmp = conv.personToPerson(chatData.person);
                    if (!_this.vmPeopleTyping.people.some(function (p) {
                        return p.id === vmp.id && p.name === vmp.name;
                    })) {
                        _this.vmPeopleTyping.people.push(vmp);
                        viewModel.setProp(_this.vmPeopleTyping);
                    }
                } else if (chatData instanceof NetworkData.PersonStoppedTyping) {
                    var vmp = conv.personToPerson(chatData.person);
                    if (_this.vmPeopleTyping.people.some(function (p) {
                        return p.id === vmp.id && p.name === vmp.name;
                    })) {
                        _this.vmPeopleTyping.people = _this.vmPeopleTyping.people.filter(function (p) {
                            return p.id !== vmp.id || p.name !== vmp.name;
                        });
                        viewModel.setProp(_this.vmPeopleTyping);
                    }
                } else if (chatData instanceof NetworkData.RequestNameAccepted) {
                    var requestNameAccepted = chatData;
                    _this.me = requestNameAccepted.person;
                    viewModel.setProp(new ViewModel.Me(conv.personToPerson(requestNameAccepted.person)));
                    _this.vmChatMessages.chatMessages = [];
                    viewModel.setProp(_this.vmChatMessages);
                } else if (chatData instanceof NetworkData.PeopleInRoom) {
                    var peopleInRoom = chatData;
                    viewModel.setProp(conv.peopleInRoomToPeopleInRoom(peopleInRoom));
                } else if (chatData instanceof NetworkData.MessageHistory) {
                    var messageHistory = chatData;
                    _this.vmChatMessages = new ViewModel.ChatMessages(messageHistory.messages.map(function (m) {
                        return conv.chatMessageToChatMessage(m);
                    }));
                    _this.vmExtraMedias = new ViewModel.ExtraMedias(messageHistory.extraMedia.map(function (em) {
                        return conv.extraMediaToExtraMedia(em);
                    }));
                    _this.vmThumbnails = new ViewModel.Thumbnails(messageHistory.thumbnails.map(function (t) {
                        return conv.thumbnailToThumbnail(t);
                    }));
                    viewModel.setProp(_this.vmChatMessages);
                    viewModel.setProp(_this.vmExtraMedias);
                    viewModel.setProp(_this.vmThumbnails);
                } else if (chatData instanceof NetworkData.ExtraMedia) {
                    var extraMedia = chatData;
                    _this.vmExtraMedias.extraMedias.push(conv.extraMediaToExtraMedia(extraMedia));
                    viewModel.setProp(_this.vmExtraMedias);
                } else if (chatData instanceof NetworkData.Thumbnail) {
                    var thumbnail = chatData;
                    _this.vmThumbnails.thumbnails.push(conv.thumbnailToThumbnail(thumbnail));
                    viewModel.setProp(_this.vmThumbnails);
                } else if (chatData instanceof NetworkData.RequestNameRejected) {
                    var nameRejected = chatData;
                    _this.vmChatMessages.chatMessages.push(new ViewModel.ChatMessage(new ViewModel.Server(), new ViewModel.MessageContent([new ViewModel.Hightlight(nameRejected.reason)]), 0, _this.messagesReceivedCounter, false, false));
                    _this.messagesReceivedCounter = _this.messagesReceivedCounter + 1;
                    viewModel.setProp(_this.vmChatMessages);
                } else if (chatData instanceof NetworkData.RequestChatConnectionAccepted) {
                    var accepted = chatData;
                    _this.vmChatMessages.chatMessages.push(new ViewModel.ChatMessage(new ViewModel.Server(), new ViewModel.MessageContent([new ViewModel.Text("Enter a name you wish to use in the room")]), 0, _this.messagesReceivedCounter, false, false));
                    _this.messagesReceivedCounter = _this.messagesReceivedCounter + 1;
                    viewModel.setProp(_this.vmChatMessages);
                }
            };
        };
        setUpConnection();
    }
    return PCHat;
})();

function bin2String(array) {
    var result = "";
    for (var i = 0; i < array.length; i++) {
        result += String.fromCharCode(array[i]);
    }
    return result;
}

var Test = (function () {
    function Test() {
    }
    return Test;
})();

var Test2 = (function (_super) {
    __extends(Test2, _super);
    function Test2() {
        _super.apply(this, arguments);
    }
    return Test2;
})(Test);
var Test3 = (function (_super) {
    __extends(Test3, _super);
    function Test3() {
        _super.apply(this, arguments);
    }
    return Test3;
})(Test);

window.onload = function () {
    var jim = new ViewModel.Person(1, "Jim");

    var getName = function () {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec((this).constructor.toString());
        return (results && results.length > 1) ? results[1] : "";
    };

    var vm = new ViewModel.ViewModel([
        new ViewModel.Person(1, "Jim"),
        new ViewModel.PeopleInRoom([jim, jim])
    ], function (prop) {
        var t = getName.call(prop);
        return t;
    });

    var view = new PChatView.PChatView(vm);
    var pchat = new PCHat(vm);

    var testFunc = function (testObj) {
        if (testObj instanceof Test2) {
            console.log("test2");
        } else if (testObj instanceof Test3) {
            console.log("test3");
        }
    };

    var test = new Test2();
    testFunc(test);
    test = new Test3();
    testFunc(test);
};
//# sourceMappingURL=app.js.map
