/// <reference path="core.ts" />
/// <reference path="networkData.ts" />

class ChatDataWebSocket {
    private socket: WebSocket;
    private hostname: string;
    constructor(hostname: string) {
        this.hostname = hostname;
        this.reconnect();
    }

    onopen(ev: Event) { }

    onclose(ev: CloseEvent) { }

    onerror(ev: ErrorEvent) { }

    onchatdata(chatData: NetworkData.NetworkDataBase) { }

    send(chatData: NetworkData.NetworkDataSendable) {
        if (this.isOpen()) {
            this.socket.send(NetworkData.NetworkDataBase.serialise(chatData));
        }
    }

    isOpen() { return this.socket.readyState === this.socket.OPEN; }

    reconnect() {
        if (this.socket !== undefined) {
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onclose = null;
            this.socket.onerror = null;

        }
        this.socket = new WebSocket('ws://' + this.hostname + ':1900/');
        this.socket.binaryType = "arraybuffer";
        this.socket.onopen = (ev) => this.onopen(ev);
        this.socket.onmessage = (ev) => this.onchatdata(NetworkData.NetworkDataBase.deserialiseBuffer(ev.data));
        this.socket.onclose = (ev) => this.onclose(ev);
        this.socket.onerror = (ev) => this.onerror(ev);
    }
}