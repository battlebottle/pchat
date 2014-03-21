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

    //export enum IPChatViewModelEnum
    //{
    //    Person,
    //    Me,
    //    Theme,
    //    ChatMessage,
    //    ChatMessages,
    //    PeopleInRoom,
    //    PeopleTyping,
    //    SendMessageText,
    //    SendMessageButtonClick,
    //    AutoCompleteText,
    //    SendImage,
    //    SendDrawing,
    //    Thumbnail,
    //    Thumbnails,
    //    ExtraMedia,
    //    ExtraMedias
    //}
    //
    //export enum IViewModelMediaType {
    //    Image,
    //    Drawing,
    //    TwitterSummary,
    //    TwitterVideo
    //}
    //
    //export enum IViewModelMessageSpan {
    //    Text,
    //    Hightlight,
    //    Hyperlink
    //}
    //
    //export enum IViewModelMessageType {
    //    Normal,
    //    Server
    //}
    //export interface ViewModelData<T>
    //{
    //    type:T
    //}
    //export interface ViewModelMediaType {
    //    mediaType: IViewModelMediaType
    //}
    //
    //export interface ViewModelMessageSpan {
    //    messageSpanType: IViewModelMessageSpan
    //}
    //
    //export interface ViewModelMessageType {
    //    messageTypeType: IViewModelMessageType
    //}
    //base classes
    var ViewModelBase = (function () {
        function ViewModelBase() {
        }
        return ViewModelBase;
    })();
    _ViewModel.ViewModelBase = ViewModelBase;
    var ViewModelMessageSpanBase = (function () {
        function ViewModelMessageSpanBase() {
        }
        return ViewModelMessageSpanBase;
    })();
    _ViewModel.ViewModelMessageSpanBase = ViewModelMessageSpanBase;
    var ViewModelMessageTypeBase = (function () {
        function ViewModelMessageTypeBase() {
        }
        return ViewModelMessageTypeBase;
    })();
    _ViewModel.ViewModelMessageTypeBase = ViewModelMessageTypeBase;
    var ViewModelMediaTypeBase = (function () {
        function ViewModelMediaTypeBase() {
        }
        return ViewModelMediaTypeBase;
    })();
    _ViewModel.ViewModelMediaTypeBase = ViewModelMediaTypeBase;

    // /base classes
    var Person = (function () {
        function Person(id, name) {
            this.id = id;
            this.name = name;
        }
        return Person;
    })();
    _ViewModel.Person = Person;

    var Theme = (function () {
        function Theme(themeName) {
            this.themeName = themeName;
        }
        return Theme;
    })();
    _ViewModel.Theme = Theme;

    //  MessageSpan
    var Text = (function () {
        function Text(text) {
            this.text = text;
        }
        return Text;
    })();
    _ViewModel.Text = Text;

    var Hightlight = (function () {
        function Hightlight(text) {
            this.text = text;
        }
        return Hightlight;
    })();
    _ViewModel.Hightlight = Hightlight;

    var Hyperlink = (function () {
        function Hyperlink(text, url) {
            this.text = text;
            this.url = url;
        }
        return Hyperlink;
    })();
    _ViewModel.Hyperlink = Hyperlink;

    // /MessageSpan
    //  MessageType
    var Normal = (function () {
        function Normal(person) {
            this.person = person;
        }
        return Normal;
    })();
    _ViewModel.Normal = Normal;

    var Server = (function () {
        function Server() {
        }
        return Server;
    })();
    _ViewModel.Server = Server;

    // /MessageType
    var MessageContent = (function () {
        function MessageContent(messageContent) {
            this.messageContent = messageContent;
        }
        return MessageContent;
    })();
    _ViewModel.MessageContent = MessageContent;

    var ChatMessage = (function () {
        function ChatMessage(messageType, messageContent, timeStamp, id, hasThumbnail, hasExtraMedia) {
            this.messageType = messageType;
            this.messageContent = messageContent;
            this.timeStamp = timeStamp;
            this.id = id;
            this.hasThumbnail = hasThumbnail;
            this.hasExtraMedia = hasExtraMedia;
        }
        return ChatMessage;
    })();
    _ViewModel.ChatMessage = ChatMessage;

    var ChatMessages = (function () {
        function ChatMessages(chatMessages) {
            this.chatMessages = chatMessages;
        }
        return ChatMessages;
    })();
    _ViewModel.ChatMessages = ChatMessages;

    var PeopleInRoom = (function () {
        function PeopleInRoom(people) {
            this.people = people;
        }
        return PeopleInRoom;
    })();
    _ViewModel.PeopleInRoom = PeopleInRoom;

    var Me = (function () {
        function Me(me) {
            this.me = me;
        }
        return Me;
    })();
    _ViewModel.Me = Me;

    var PeopleTyping = (function () {
        function PeopleTyping(people) {
            this.people = people;
        }
        return PeopleTyping;
    })();
    _ViewModel.PeopleTyping = PeopleTyping;

    var SendMessageText = (function () {
        function SendMessageText(messageText) {
            this.messageText = messageText;
        }
        return SendMessageText;
    })();
    _ViewModel.SendMessageText = SendMessageText;

    var SendMessageButtonClick = (function () {
        function SendMessageButtonClick() {
        }
        return SendMessageButtonClick;
    })();
    _ViewModel.SendMessageButtonClick = SendMessageButtonClick;

    var AutoCompleteText = (function () {
        function AutoCompleteText(autoCompleteText) {
            this.autoCompleteText = autoCompleteText;
        }
        return AutoCompleteText;
    })();
    _ViewModel.AutoCompleteText = AutoCompleteText;

    var SendImage = (function () {
        function SendImage(imageData) {
            this.imageData = imageData;
        }
        return SendImage;
    })();
    _ViewModel.SendImage = SendImage;

    var SendDrawing = (function () {
        function SendDrawing(drawingData) {
            this.drawingData = drawingData;
        }
        return SendDrawing;
    })();
    _ViewModel.SendDrawing = SendDrawing;

    var Thumbnail = (function () {
        function Thumbnail(messageId, ref) {
            this.messageId = messageId;
            this.ref = ref;
        }
        return Thumbnail;
    })();
    _ViewModel.Thumbnail = Thumbnail;

    var Thumbnails = (function () {
        function Thumbnails(thumbnails) {
            this.thumbnails = thumbnails;
        }
        return Thumbnails;
    })();
    _ViewModel.Thumbnails = Thumbnails;

    var ExtraMedia = (function () {
        function ExtraMedia(messageId, extraMedia) {
            this.messageId = messageId;
            this.extraMedia = extraMedia;
        }
        return ExtraMedia;
    })();
    _ViewModel.ExtraMedia = ExtraMedia;

    var ExtraMedias = (function () {
        function ExtraMedias(extraMedias) {
            this.extraMedias = extraMedias;
        }
        return ExtraMedias;
    })();
    _ViewModel.ExtraMedias = ExtraMedias;

    //Media types:
    var Image = (function () {
        function Image(imageData) {
            this.imageData = imageData;
        }
        return Image;
    })();
    _ViewModel.Image = Image;

    var Drawing = (function () {
        function Drawing(drawingRef) {
            this.drawingRef = drawingRef;
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
        }
        return TwitterSummary;
    })();
    _ViewModel.TwitterSummary = TwitterSummary;

    var TwitterVideo = (function () {
        function TwitterVideo(twitterMedia, videoIFrame, size) {
            this.twitterMedia = twitterMedia;
            this.videoIFrame = videoIFrame;
            this.size = size;
        }
        return TwitterVideo;
    })();
    _ViewModel.TwitterVideo = TwitterVideo;
})(ViewModel || (ViewModel = {}));
//# sourceMappingURL=viewModel.js.map
