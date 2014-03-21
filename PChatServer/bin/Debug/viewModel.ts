/// <reference path="core.ts" />
module ViewModel {

    export class ViewModel<T>
    {
        dict: { [key: string]: T; }  = {}

        propChangedListenerList: { (prop: T): void; } [] = []
        

        constructor(properties: Array<T>, public getPropertyKey: (prop: T) => string) {
            properties.forEach(
                (property) =>
                    this.dict[getPropertyKey(property)] = property);
        }

        setProp(prop: T) {
            this.dict[this.getPropertyKey(prop)] = prop;
            this.propChangedListenerList.forEach(
                (listener) =>
                    listener(prop));
        }

        getProperties() {
            var props: T[] = [];
            for (var key in this.dict)
                props.push(this.dict[key]);
            return props;
        }

        addPropertyChangedListener(listener: (prop: T) => void) {
            if (this.propChangedListenerList.every((listnr) => listnr !== listener))
                this.propChangedListenerList.push(listener)
        }

        removePropertyChangedListener(listener: (prop: T) => void) {
            this.propChangedListenerList = this.propChangedListenerList.filter((listnr) => listnr !== listener) 
        }
    }

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
    export class ViewModelBase { }
    export class ViewModelMessageSpanBase { }
    export class ViewModelMessageTypeBase { }
    export class ViewModelMediaTypeBase { }

    // /base classes
    
    export class Person implements ViewModelBase {
        constructor(
            public id: number,
            public name: string
            ) { }
    }
    
    export class Theme implements ViewModelBase  {
        constructor(
            public themeName: string
            ) {  }
    }

    //  MessageSpan
    export class Text implements ViewModelMessageSpanBase {
            constructor(
            public text: string
            ) { }
    }

    export class Hightlight implements ViewModelMessageSpanBase {
            constructor(
            public text: string
            ) { }
    }

    export class Hyperlink implements ViewModelMessageSpanBase {
            constructor(
            public text: string,
            public url: string
            ) { }
    }
    // /MessageSpan

    //  MessageType
    export class Normal implements ViewModelMessageTypeBase {
            constructor(
            public person: Person
            ) { }
    }

    export class Server implements ViewModelMessageTypeBase {
            constructor() { }
    }
    // /MessageType
    export class MessageContent implements ViewModelBase {
        constructor(
            public messageContent: ViewModelMessageSpanBase[]
            ) { }
    }

    export class ChatMessage implements ViewModelBase  {
        constructor(
            public messageType: ViewModelMessageTypeBase,
            public messageContent: MessageContent,
            public timeStamp: number,
            public id: number,
            public hasThumbnail: boolean,
            public hasExtraMedia: boolean
            ) { }
    }

    export class ChatMessages implements ViewModelBase  {
        constructor(
            public chatMessages: ChatMessage[]
            ) { }
    }

    export class PeopleInRoom implements ViewModelBase {
        constructor(
            public people: Person[]
            ) { }
    }

    export class Me implements ViewModelBase {
        constructor(
            public me: Person
            ) { }
    }
    
    export class PeopleTyping implements ViewModelBase {
        constructor(
            public people: Person[]        
        ){}
    }

    export class SendMessageText implements ViewModelBase {
        constructor(
            public messageText: string
            ) { }
    }

    export class SendMessageButtonClick implements ViewModelBase {
        constructor() { }
    }
    
    export class AutoCompleteText implements ViewModelBase {
        constructor(
            public autoCompleteText: string       
        ){}
    }
    
    export class SendImage implements ViewModelBase {
        constructor(
            public imageData: Maybe<Uint8Array>    
        ){}
    }

    export class SendDrawing implements ViewModelBase {
        constructor(
            public drawingData: Maybe<Uint8Array>
            ) { }
    }

    export class Thumbnail implements ViewModelBase {
        constructor(
            public messageId: number,
            public ref: number
            ) { }
    }

    export class Thumbnails implements ViewModelBase{
        constructor(
            public thumbnails: Thumbnail[]
            ) { }
    }

    export class ExtraMedia implements ViewModelBase{
        constructor(
            public messageId: number,
            public extraMedia: ViewModelMediaTypeBase
            ) { }
    }

    export class ExtraMedias implements ViewModelBase{
        constructor(
            public extraMedias: ExtraMedia[]
            ) { }
    }

    //Media types:
    export class Image implements ViewModelMediaTypeBase {
        constructor(
            public imageData: Uint8Array
            ) { }
    }

    export class Drawing implements ViewModelMediaTypeBase {
        constructor(
            public drawingRef: number
            ) { }
    }

    export class TwitterMedia implements ViewModelMediaTypeBase {
        constructor(
            public title: string,
            public description: string,
            public image: Maybe<Uint8Array>
            ) { }
    }

    export class TwitterSummary implements ViewModelMediaTypeBase {
        constructor(
            public twitterMedia: TwitterMedia
            ) { }
    }

    export class TwitterVideo implements ViewModelMediaTypeBase {
        constructor(
            public twitterMedia: TwitterMedia,
            public videoIFrame: string,
            public size: Size
            ) { }
    }
}