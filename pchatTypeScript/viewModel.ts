/// <reference path="core.ts" />
module ViewModel {

    export class ViewModel<T>
    {
        dict: { [key: string]: ViewModelData<T>; }  = {}

        propChangedListenerList: { (prop: ViewModelData<T>): void; } [] = []
        

        constructor(properties: Array<ViewModelData<T>>, public getPropertyKey: (prop: ViewModelData<T>) => string) {
            properties.forEach(
                (property) =>
                    this.dict[getPropertyKey(property)] = property);
        }

        setProp(prop: ViewModelData<T>) {
            this.dict[this.getPropertyKey(prop)] = prop;
            this.propChangedListenerList.forEach(
                (listener) =>
                    listener(prop));
        }

        getProperties() {
            var props: ViewModelData<T>[] = [];
            for (var key in this.dict)
                props.push(this.dict[key]);
            return props;
        }

        addPropertyChangedListener(listener: (prop: ViewModelData<T>) => void) {
            if (this.propChangedListenerList.every((listnr) => listnr !== listener))
                this.propChangedListenerList.push(listener)
        }

        removePropertyChangedListener(listener: (prop: ViewModelData<T>) => void) {
            this.propChangedListenerList = this.propChangedListenerList.filter((listnr) => listnr !== listener) 
        }
    }

    export enum IPChatViewModelEnum
    {
        Person,
        Me,
        Theme,
        ChatMessage,
        ChatMessages,
        PeopleInRoom,
        PeopleTyping,
        SendMessageText,
        SendMessageButtonClick,
        AutoCompleteText,
        SendImage,
        SendDrawing,
        Thumbnail,
        Thumbnails,
        ExtraMedia,
        ExtraMedias
    }

    export enum IViewModelMediaType {
        Image,
        Drawing,
        TwitterSummary,
        TwitterVideo
    }

    export interface ViewModelData<T>
    {
        type:T
    }

    export interface ViewModelMediaType {
        mediaType: IViewModelMediaType
    }
    
    export class Person {
        type = IPChatViewModelEnum.Person
        constructor(
            public id: number,
            public name: string
        ){}
    }
    
    export class Theme {
        type = IPChatViewModelEnum.Theme
        constructor(
            public themeName: string
        ){}
    }

    export class ChatMessage {
        type = IPChatViewModelEnum.ChatMessage
        constructor(
            public sender: Person,
            public message: string,
            public timeStamp: number,
            public id: number,
            public hasThumbnail: boolean,
            public hasExtraMedia: boolean
            ) { }
    }

    export class ChatMessages {
        type = IPChatViewModelEnum.ChatMessages
        constructor(
            public chatMessages: ChatMessage[]
            ) { }
    }

    export class PeopleInRoom {
        type = IPChatViewModelEnum.PeopleInRoom
        constructor(
            public people: Person[]
            ) { }
    }

    export class Me {
        type = IPChatViewModelEnum.Me
        constructor(
            public me: Person
            ) { }
    }
    
    export class PeopleTyping {
        type = IPChatViewModelEnum.PeopleTyping
        constructor(
            public people: Person[]        
        ){}
    }

    export class SendMessageText {
        type = IPChatViewModelEnum.SendMessageText
        constructor(
            public messageText: string
            ) { }
    }

    export class SendMessageButtonClick {
        type = IPChatViewModelEnum.SendMessageButtonClick
        constructor() { }
    }
    
    export class AutoCompleteText {
        type = IPChatViewModelEnum.AutoCompleteText
        constructor(
            public autoCompleteText: string       
        ){}
    }
    
    export class SendImage {
        type = IPChatViewModelEnum.SendImage
        constructor(
            public imageData: Maybe<Uint8Array>    
        ){}
    }

    export class SendDrawing {
        type = IPChatViewModelEnum.SendDrawing
        constructor(
            public drawingData: Maybe<Uint8Array>
            ) { }
    }

    export class Thumbnail {
        type = IPChatViewModelEnum.Thumbnail
        constructor(
            public messageId: number,
            public data: Uint8Array
            ) { }
    }

    export class Thumbnails {
        type = IPChatViewModelEnum.Thumbnails
        constructor(
            public thumbnails: Thumbnail[]
            ) { }
    }

    export class ExtraMedia {
        type = IPChatViewModelEnum.ExtraMedia
        constructor(
            public messageId: number,
            public extraMedia: ViewModelMediaType
            ) { }
    }

    export class ExtraMedias {
        type = IPChatViewModelEnum.ExtraMedias
        constructor(
            public extraMedias: ExtraMedia[]
            ) { }
    }

    //Media types:
    export class Image implements ViewModelMediaType {
        mediaType = IViewModelMediaType.Image
        constructor(
            public imageData: Uint8Array
            ) { }
    }

    export class Drawing implements ViewModelMediaType {
        mediaType = IViewModelMediaType.Drawing
        constructor(
            public drawingData: Uint8Array
            ) { }
    }

    export class TwitterMedia {
        constructor(
            public title: string,
            public description: string,
            public image: Maybe<Uint8Array>
            ) { }
    }

    export class TwitterSummary implements ViewModelMediaType {
        mediaType = IViewModelMediaType.TwitterSummary
        constructor(
            public twitterMedia: TwitterMedia
            ) { }
    }

    export class TwitterVideo implements ViewModelMediaType {
        mediaType = IViewModelMediaType.TwitterVideo
        constructor(
            public twitterMedia: TwitterMedia,
            public videoIFrame: string,
            public size: Size
            ) { }
    }
}