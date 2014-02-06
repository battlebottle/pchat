/// <reference path="Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="viewModel.ts" />
/// <reference path="drawCanvas.ts" />
/// <reference path="HTMLTemplates.ts" />
"use strict";
var PChatView;
(function (_PChatView) {
    var PChatView = (function () {
        function PChatView(viewModel) {
            var _this = this;
            this.viewModel = viewModel;
            this.previousInputText = "";
            this.peopleInRoom = [];
            this.peopleTyping = [];
            this.extraMedias = [];
            this.thumbnails = [];
            $('#messageListDiv').empty();
            var drawCanvasDiv = $("#drawCanvasDiv");

            var drawCanvasVisible = function (visible) {
                if (visible) {
                    drawCanvasDiv.css('visibility', 'visible');
                } else {
                    drawCanvasDiv.css('visibility', 'hidden');
                }
            };

            //set up canvas
            var canvas = document.getElementById('drawCanvas');
            var canvasControl = new DrawCanvas.DrawCanvas(canvas);

            var sendMessage = function () {
                drawCanvasVisible(false);

                var getDrawingData = function () {
                    if (canvasControl.getDrawingMade()) {
                        return new Maybe(canvasControl.getPngArrayBuffer());
                    } else {
                        return Maybe.createNone();
                    }
                };

                viewModel.setProp(new ViewModel.SendDrawing(getDrawingData()));
                canvasControl.reset();

                viewModel.setProp(new ViewModel.SendMessageButtonClick());
                $("#textInput").val("");
                viewModel.setProp(new ViewModel.SendMessageText(""));
            };

            $("#textInputButton").click(sendMessage);
            $("#textInput").keyup(function (e) {
                var text = $("#textInput").val();
                if (text !== _this.previousInputText) {
                    viewModel.setProp(new ViewModel.SendMessageText(text));
                }
                if (e.keyCode == 13) {
                    sendMessage();
                }
            });

            var templates = HTMLTemplates.HTMLTemplates;

            var scrollToBottom = function () {
                $("html, body").stop();
                $("html, body").animate({
                    scrollTop: document.body.scrollHeight - window.innerHeight
                }, 500, "easeOutExpo");
            };

            viewModel.addPropertyChangedListener(function (prop) {
                if (prop.type === 4 /* ChatMessages */) {
                    var chatMessages = prop;

                    //document.getElementById('content').innerHTML = chatMessages.sender.name + ":" + chatMessages.message;
                    //$('#messageListDiv').empty();
                    //$('#messageListDiv').append('<div id="topDiv" />');
                    chatMessages.chatMessages.forEach(function (m) {
                        var messageDivs = $(".messageDiv");
                        var messageInView = false;
                        for (var i = 0; i < messageDivs.length; i++) {
                            if ($(messageDivs[i]).data("messageID") === m.id) {
                                messageInView = true;
                            }
                        }
                        if (!messageInView) {
                            var messageDiv = $(templates.messageDiv(m.sender.name, m.message, m.hasThumbnail, m.hasExtraMedia));
                            messageDiv.data("messageID", m.id);
                            messageDiv.data("thumbnailReceived", false);
                            messageDiv.data("extraMediaReceived", false);

                            messageDiv.data("animating", false);
                            messageDiv.data("expanded", false);
                            var exp = $(".expandedContentDiv", messageDiv);
                            exp.hide();

                            $('#messageListDiv').append(messageDiv);
                        }
                    });

                    //$('#messageListDiv').append('<div id="bottomDiv" />');
                    scrollToBottom();
                } else if (prop.type === 5 /* PeopleInRoom */) {
                    var peopleInRoom = prop;
                    _this.peopleInRoom = peopleInRoom.people;
                    _this.redrawPeopleList();
                } else if (prop.type === 6 /* PeopleTyping */) {
                    var peopleTyping = prop;
                    _this.peopleTyping = peopleTyping.people;
                    _this.redrawPeopleList();
                } else if (prop.type === 15 /* ExtraMedias */) {
                    var extraMedia = prop;
                    extraMedia.extraMedias.forEach(function (feem) {
                        if (!_this.extraMedias.some(function (em) {
                            return em.messageId === feem.messageId;
                        })) {
                            _this.extraMedias.push(feem);

                            var messageDivs = $('.messageDiv');
                            messageDivs.each(function (index, div) {
                                var jDiv = $(div);
                                var messageID = jDiv.data("messageID");
                                if (messageID === feem.messageId) {
                                    if (!jDiv.data("extraMediaReceived")) {
                                        jDiv.data("extraMediaReceived", true);
                                        var exp = $(".expandedContentDiv", jDiv);
                                        exp.empty();
                                        if (feem.extraMedia.mediaType === 1 /* Drawing */) {
                                            var drawing = feem.extraMedia;
                                            exp.append($(templates.innerContentDiv_Drawing(drawing.drawingData)));
                                        }

                                        $(div).click(function (evnt) {
                                            var exp = $(".expandedContentDiv", $(evnt.currentTarget));
                                            var animating = exp.data("animating");
                                            var expanded = exp.data("expanded");

                                            if (!animating) {
                                                exp.data("animating", true);
                                                if (expanded) {
                                                    exp.data("expanded", false);
                                                    exp.slideUp(500, function () {
                                                        exp.data("animating", false);
                                                    });
                                                } else {
                                                    exp.data("expanded", true);
                                                    exp.slideDown(500, function () {
                                                        exp.data("animating", false);
                                                    });
                                                }
                                            }
                                        });

                                        scrollToBottom();
                                    }

                                    scrollToBottom();
                                }
                            });
                        }
                    });
                } else if (prop.type === 13 /* Thumbnails */) {
                    var thumbnails = prop;
                    thumbnails.thumbnails.forEach(function (fetn) {
                        if (!_this.thumbnails.some(function (tn) {
                            return tn.messageId === fetn.messageId;
                        })) {
                            _this.thumbnails.push(fetn);

                            var messageDivs = $('.messageDiv');
                            messageDivs.each(function (index, div) {
                                var jDiv = $(div);
                                var messageID = jDiv.data("messageID");
                                if (messageID === fetn.messageId) {
                                    var thumbnailImg = $(".thumbnailImg", jDiv);
                                    thumbnailImg.height(100);
                                    thumbnailImg.width(100);
                                    thumbnailImg.attr('src', _this.imageBytesTobase64(fetn.data));
                                }
                            });
                        }
                    });
                }
            });

            //w = canvas.width;
            //h = canvas.height;
            $("#viewDrawBoxButton").click(function () {
                return drawCanvasVisible(drawCanvasDiv.css('visibility') !== 'visible');
            });

            $(".messageDiv").data("animating", false);
            $(".messageDiv").data("expanded", false);

            $(".messageDiv").click(function (evnt) {
                var exp = $(".expandedContentDiv", $(evnt.currentTarget));
                var animating = exp.data("animating");
                var expanded = exp.data("expanded");

                if (!animating) {
                    exp.data("animating", true);
                    if (expanded) {
                        exp.data("expanded", false);
                        exp.slideUp(500, function () {
                            exp.data("animating", false);
                        });
                    } else {
                        exp.data("expanded", true);
                        exp.slideDown(500, function () {
                            exp.data("animating", false);
                        });
                    }
                }
            });
        }
        PChatView.prototype.imageBytesTobase64 = function (bytes) {
            var byteArrayTobase64 = function (data) {
                return btoa(String.fromCharCode.apply(null, data));
            };
            return "data:image/png;base64," + byteArrayTobase64(bytes);
        };

        PChatView.prototype.redrawPeopleList = function () {
            var _this = this;
            var peopleList = $('#peopleList');
            peopleList.empty();
            this.peopleInRoom.forEach(function (p) {
                var style = "";
                if (_this.peopleTyping.some(function (pt) {
                    return p.id === pt.id;
                })) {
                    style = "typing";
                } else {
                    style = "normal";
                }
                peopleList.append('<li><div class="personBullitDiv personBullitDiv_#style"><span class="personBullitSpan">#name</span></div></li>'.replace('#name', p.name).replace('#style', style));
            });
        };
        return PChatView;
    })();
    _PChatView.PChatView = PChatView;
})(PChatView || (PChatView = {}));
//# sourceMappingURL=chatView.js.map
