/// <reference path="core.ts" />
var ViewModel;
(function (_ViewModel) {
    var ViewModel = (function () {
        function ViewModel(properties, getPropertyKey) {
            var _this = this;
            this.getPropertyKey = getPropertyKey;
            this.dict = {};
            this.propChangedListenerList = [];
            properties.forEach(function (property) {
                return _this.dict[getPropertyKey(property)] = property;
            });
        }
        ViewModel.prototype.setProp = function (prop) {
            this.dict[this.getPropertyKey(prop)] = prop;
            this.propChangedListenerList.forEach(function (listener) {
                return listener(prop);
            });
        };

        ViewModel.prototype.getProperties = function () {
            var props = [];
            for (var key in this.dict)
                props.push(this.dict[key]);
            return props;
        };

        ViewModel.prototype.addPropertyChangedListener = function (listener) {
            if (this.propChangedListenerList.every(function (listnr) {
                return listnr !== listener;
            }))
                this.propChangedListenerList.push(listener);
        };

        ViewModel.prototype.removePropertyChangedListener = function (listener) {
            this.propChangedListenerList = this.propChangedListenerList.filter(function (listnr) {
                return listnr !== listener;
            });
        };
        return ViewModel;
    })();
    _ViewModel.ViewModel = ViewModel;

    (function (IPChatViewModelEnum) {
        IPChatViewModelEnum[IPChatViewModelEnum["Person"] = 0] = "Person";
        IPChatViewModelEnum[IPChatViewModelEnum["Me"] = 1] = "Me";
        IPChatViewModelEnum[IPChatViewModelEnum["Theme"] = 2] = "Theme";
        IPChatViewModelEnum[IPChatViewModelEnum["ChatMessage"] = 3] = "ChatMessage";
        IPChatViewModelEnum[IPChatViewModelEnum["ChatMessages"] = 4] = "ChatMessages";
        IPChatViewModelEnum[IPChatViewModelEnum["PeopleInRoom"] = 5] = "PeopleInRoom";
        IPChatViewModelEnum[IPChatViewModelEnum["PeopleTyping"] = 6] = "PeopleTyping";
        IPChatViewModelEnum[IPChatViewModelEnum["SendMessageText"] = 7] = "SendMessageText";
        IPChatViewModelEnum[IPChatViewModelEnum["SendMessageButtonClick"] = 8] = "SendMessageButtonClick";
        IPChatViewModelEnum[IPChatViewModelEnum["AutoCompleteText"] = 9] = "AutoCompleteText";
        IPChatViewModelEnum[IPChatViewModelEnum["SendImage"] = 10] = "SendImage";
        IPChatViewModelEnum[IPChatViewModelEnum["SendDrawing"] = 11] = "SendDrawing";
        IPChatViewModelEnum[IPChatViewModelEnum["Thumbnail"] = 12] = "Thumbnail";
        IPChatViewModelEnum[IPChatViewModelEnum["Thumbnails"] = 13] = "Thumbnails";
        IPChatViewModelEnum[IPChatViewModelEnum["ExtraMedia"] = 14] = "ExtraMedia";
        IPChatViewModelEnum[IPChatViewModelEnum["ExtraMedias"] = 15] = "ExtraMedias";
    })(_ViewModel.IPChatViewModelEnum || (_ViewModel.IPChatViewModelEnum = {}));
    var IPChatViewModelEnum = _ViewModel.IPChatViewModelEnum;

    (function (IViewModelMediaType) {
        IViewModelMediaType[IViewModelMediaType["Image"] = 0] = "Image";
        IViewModelMediaType[IViewModelMediaType["Drawing"] = 1] = "Drawing";
        IViewModelMediaType[IViewModelMediaType["TwitterSummary"] = 2] = "TwitterSummary";
        IViewModelMediaType[IViewModelMediaType["TwitterVideo"] = 3] = "TwitterVideo";
    })(_ViewModel.IViewModelMediaType || (_ViewModel.IViewModelMediaType = {}));
    var IViewModelMediaType = _ViewModel.IViewModelMediaType;

    var Person = (function () {
        function Person(id, name) {
            this.id = id;
            this.name = name;
            this.type = 0 /* Person */;
        }
        return Person;
    })();
    _ViewModel.Person = Person;

    var Theme = (function () {
        function Theme(themeName) {
            this.themeName = themeName;
            this.type = 2 /* Theme */;
        }
        return Theme;
    })();
    _ViewModel.Theme = Theme;

    var ChatMessage = (function () {
        function ChatMessage(sender, message, timeStamp, id, hasThumbnail, hasExtraMedia) {
            this.sender = sender;
            this.message = message;
            this.timeStamp = timeStamp;
            this.id = id;
            this.hasThumbnail = hasThumbnail;
            this.hasExtraMedia = hasExtraMedia;
            this.type = 3 /* ChatMessage */;
        }
        return ChatMessage;
    })();
    _ViewModel.ChatMessage = ChatMessage;

    var ChatMessages = (function () {
        function ChatMessages(chatMessages) {
            this.chatMessages = chatMessages;
            this.type = 4 /* ChatMessages */;
        }
        return ChatMessages;
    })();
    _ViewModel.ChatMessages = ChatMessages;

    var PeopleInRoom = (function () {
        function PeopleInRoom(people) {
            this.people = people;
            this.type = 5 /* PeopleInRoom */;
        }
        return PeopleInRoom;
    })();
    _ViewModel.PeopleInRoom = PeopleInRoom;

    var Me = (function () {
        function Me(me) {
            this.me = me;
            this.type = 1 /* Me */;
        }
        return Me;
    })();
    _ViewModel.Me = Me;

    var PeopleTyping = (function () {
        function PeopleTyping(people) {
            this.people = people;
            this.type = 6 /* PeopleTyping */;
        }
        return PeopleTyping;
    })();
    _ViewModel.PeopleTyping = PeopleTyping;

    var SendMessageText = (function () {
        function SendMessageText(messageText) {
            this.messageText = messageText;
            this.type = 7 /* SendMessageText */;
        }
        return SendMessageText;
    })();
    _ViewModel.SendMessageText = SendMessageText;

    var SendMessageButtonClick = (function () {
        function SendMessageButtonClick() {
            this.type = 8 /* SendMessageButtonClick */;
        }
        return SendMessageButtonClick;
    })();
    _ViewModel.SendMessageButtonClick = SendMessageButtonClick;

    var AutoCompleteText = (function () {
        function AutoCompleteText(autoCompleteText) {
            this.autoCompleteText = autoCompleteText;
            this.type = 9 /* AutoCompleteText */;
        }
        return AutoCompleteText;
    })();
    _ViewModel.AutoCompleteText = AutoCompleteText;

    var SendImage = (function () {
        function SendImage(imageData) {
            this.imageData = imageData;
            this.type = 10 /* SendImage */;
        }
        return SendImage;
    })();
    _ViewModel.SendImage = SendImage;

    var SendDrawing = (function () {
        function SendDrawing(drawingData) {
            this.drawingData = drawingData;
            this.type = 11 /* SendDrawing */;
        }
        return SendDrawing;
    })();
    _ViewModel.SendDrawing = SendDrawing;

    var Thumbnail = (function () {
        function Thumbnail(messageId, data) {
            this.messageId = messageId;
            this.data = data;
            this.type = 12 /* Thumbnail */;
        }
        return Thumbnail;
    })();
    _ViewModel.Thumbnail = Thumbnail;

    var Thumbnails = (function () {
        function Thumbnails(thumbnails) {
            this.thumbnails = thumbnails;
            this.type = 13 /* Thumbnails */;
        }
        return Thumbnails;
    })();
    _ViewModel.Thumbnails = Thumbnails;

    var ExtraMedia = (function () {
        function ExtraMedia(messageId, extraMedia) {
            this.messageId = messageId;
            this.extraMedia = extraMedia;
            this.type = 14 /* ExtraMedia */;
        }
        return ExtraMedia;
    })();
    _ViewModel.ExtraMedia = ExtraMedia;

    var ExtraMedias = (function () {
        function ExtraMedias(extraMedias) {
            this.extraMedias = extraMedias;
            this.type = 15 /* ExtraMedias */;
        }
        return ExtraMedias;
    })();
    _ViewModel.ExtraMedias = ExtraMedias;

    //Media types:
    var Image = (function () {
        function Image(imageData) {
            this.imageData = imageData;
            this.mediaType = 0 /* Image */;
        }
        return Image;
    })();
    _ViewModel.Image = Image;

    var Drawing = (function () {
        function Drawing(drawingData) {
            this.drawingData = drawingData;
            this.mediaType = 1 /* Drawing */;
        }
        return Drawing;
    })();
    _ViewModel.Drawing = Drawing;

    var TwitterMedia = (function () {
        function TwitterMedia(title, description, image) {
            this.title = title;
            this.description = description;
            this.image = image;
        }
        return TwitterMedia;
    })();
    _ViewModel.TwitterMedia = TwitterMedia;

    var TwitterSummary = (function () {
        function TwitterSummary(twitterMedia) {
            this.twitterMedia = twitterMedia;
            this.mediaType = 2 /* TwitterSummary */;
        }
        return TwitterSummary;
    })();
    _ViewModel.TwitterSummary = TwitterSummary;

    var TwitterVideo = (function () {
        function TwitterVideo(twitterMedia, videoIFrame, size) {
            this.twitterMedia = twitterMedia;
            this.videoIFrame = videoIFrame;
            this.size = size;
            this.mediaType = 3 /* TwitterVideo */;
        }
        return TwitterVideo;
    })();
    _ViewModel.TwitterVideo = TwitterVideo;
})(ViewModel || (ViewModel = {}));
