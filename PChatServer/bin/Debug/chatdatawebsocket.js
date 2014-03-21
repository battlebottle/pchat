/// <reference path="core.ts" />
/// <reference path="networkData.ts" />
var ChatDataWebSocket = (function () {
    function ChatDataWebSocket(hostname) {
        this.hostname = hostname;
        this.reconnect();
    }
    ChatDataWebSocket.prototype.onopen = function (ev) {
    };

    ChatDataWebSocket.prototype.onclose = function (ev) {
    };

    ChatDataWebSocket.prototype.onerror = function (ev) {
    };

    ChatDataWebSocket.prototype.onchatdata = function (chatData) {
    };

    ChatDataWebSocket.prototype.send = function (chatData) {
        if (this.isOpen()) {
            this.socket.send(NetworkData.NetworkDataBase.serialise(chatData));
        }
    };

    ChatDataWebSocket.prototype.isOpen = function () {
        return this.socket.readyState === this.socket.OPEN;
    };

    ChatDataWebSocket.prototype.reconnect = function () {
        var _this = this;
        if (this.socket !== undefined) {
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onclose = null;
            this.socket.onerror = null;
        }
        this.socket = new WebSocket('ws://' + this.hostname + ':1900/');
        this.socket.binaryType = "arraybuffer";
        this.socket.onopen = function (ev) {
            return _this.onopen(ev);
        };
        this.socket.onmessage = function (ev) {
            return _this.onchatdata(NetworkData.NetworkDataBase.deserialiseBuffer(ev.data));
        };
        this.socket.onclose = function (ev) {
            return _this.onclose(ev);
        };
        this.socket.onerror = function (ev) {
            return _this.onerror(ev);
        };
    };
    return ChatDataWebSocket;
})();
//# sourceMappingURL=chatdatawebsocket.js.map
