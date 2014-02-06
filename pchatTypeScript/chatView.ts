﻿/// <reference path="Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="viewModel.ts" />
/// <reference path="drawCanvas.ts" />
/// <reference path="HTMLTemplates.ts" />
"use strict";
module PChatView {
    export class PChatView {

        private imageBytesTobase64(bytes: Uint8Array) {
            var byteArrayTobase64 = (data: Uint8Array) => {
                return btoa(String.fromCharCode.apply(null, data));
            }
            return "data:image/png;base64," + byteArrayTobase64(bytes);
        }

        private previousInputText = ""

        private peopleInRoom: ViewModel.Person[] = []
        private peopleTyping: ViewModel.Person[] = []
        private extraMedias: ViewModel.ExtraMedia[] = []
        private thumbnails: ViewModel.Thumbnail[] = []

        constructor(private viewModel: ViewModel.ViewModel<ViewModel.IPChatViewModelEnum>) {
            $('#messageListDiv').empty();
            var drawCanvasDiv = $("#drawCanvasDiv");

            var drawCanvasVisible = (visible : boolean) => {
                if (visible) {
                    drawCanvasDiv.css('visibility', 'visible');
                } else {
                    drawCanvasDiv.css('visibility', 'hidden');
                }
            }

            //set up canvas
            var canvas = <HTMLCanvasElement>document.getElementById('drawCanvas');
            var canvasControl = new DrawCanvas.DrawCanvas(canvas);

            var sendMessage = () => {
                drawCanvasVisible(false);

                var getDrawingData = () => {
                    if (canvasControl.getDrawingMade()) {
                        return new Maybe<Uint8Array>(canvasControl.getPngArrayBuffer());
                    } else {
                        return Maybe.createNone<Uint8Array>();
                    }
                }

                viewModel.setProp(new ViewModel.SendDrawing(getDrawingData()));
                canvasControl.reset();

                viewModel.setProp(new ViewModel.SendMessageButtonClick())
                $("#textInput").val("");
                viewModel.setProp(new ViewModel.SendMessageText(""));
            };

            $("#textInputButton").click(sendMessage);
            $("#textInput").keyup((e) => {
                var text = $("#textInput").val();
                if (text !== this.previousInputText) {
                    viewModel.setProp(new ViewModel.SendMessageText(text));
                }
                if (e.keyCode == 13) { sendMessage(); }
            });


            var templates = HTMLTemplates.HTMLTemplates;

            var scrollToBottom = () => {
                $("html, body").stop();
                $("html, body").animate({
                    scrollTop: document.body.scrollHeight - window.innerHeight
                }, 500, "easeOutExpo");
            }


            viewModel.addPropertyChangedListener(
                (prop) => {
                    if (prop.type === ViewModel.IPChatViewModelEnum.ChatMessages) {
                        var chatMessages = (<ViewModel.ChatMessages> prop);
                        //document.getElementById('content').innerHTML = chatMessages.sender.name + ":" + chatMessages.message;
                        //$('#messageListDiv').empty();
                        //$('#messageListDiv').append('<div id="topDiv" />');

                        chatMessages.chatMessages.forEach(
                            (m) => {
                                var messageDivs = $(".messageDiv");
                                var messageInView = false;
                                for (var i = 0; i < messageDivs.length; i++) {
                                    if ($(messageDivs[i]).data("messageID") === m.id) {
                                        messageInView = true;
                                    }
                                }
                                if (!messageInView) {
                                    var messageDiv = $(templates.messageDiv(m.sender.name, m.message, m.hasThumbnail, m.hasExtraMedia))
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
                    }
                    else if (prop.type === ViewModel.IPChatViewModelEnum.PeopleInRoom) {
                        var peopleInRoom = <ViewModel.PeopleInRoom> prop;
                        this.peopleInRoom = peopleInRoom.people
                        this.redrawPeopleList();
                    }
                    else if (prop.type === ViewModel.IPChatViewModelEnum.PeopleTyping) {
                        var peopleTyping = <ViewModel.PeopleTyping> prop;
                        this.peopleTyping = peopleTyping.people
                        this.redrawPeopleList();
                    }
                    else if (prop.type === ViewModel.IPChatViewModelEnum.ExtraMedias) {
                        var extraMedia = <ViewModel.ExtraMedias> prop;
                        extraMedia.extraMedias.forEach((feem) => {
                            if (!this.extraMedias.some((em) => em.messageId === feem.messageId)) {
                                this.extraMedias.push(feem);

                                var messageDivs = $('.messageDiv');
                                messageDivs.each((index, div) => {

                                    var jDiv = $(div);
                                    var messageID = <number>jDiv.data("messageID");
                                    if (messageID === feem.messageId) {
                                        if (!(<boolean> jDiv.data("extraMediaReceived"))) {
                                            jDiv.data("extraMediaReceived", true)
                                            var exp = $(".expandedContentDiv", jDiv);
                                            exp.empty();
                                            if (feem.extraMedia.mediaType === ViewModel.IViewModelMediaType.Drawing) {
                                                var drawing = <ViewModel.Drawing>feem.extraMedia;
                                                exp.append($(templates.innerContentDiv_Drawing(drawing.drawingData)));
                                            }


                                            $(div).click((evnt) => {
                                                var exp = $(".expandedContentDiv", $(evnt.currentTarget));
                                                var animating = <boolean>exp.data("animating");
                                                var expanded = <boolean>exp.data("expanded");

                                                if (!animating) {
                                                    exp.data("animating", true);
                                                    if (expanded) {
                                                        exp.data("expanded", false);
                                                        exp.slideUp(500, () => {
                                                            exp.data("animating", false);
                                                        });
                                                    } else {
                                                        exp.data("expanded", true);
                                                        exp.slideDown(500, () => {
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
                    }
                    else if (prop.type === ViewModel.IPChatViewModelEnum.Thumbnails) {

                        var thumbnails = <ViewModel.Thumbnails> prop;
                        thumbnails.thumbnails.forEach((fetn) => {
                            if (!this.thumbnails.some((tn) => tn.messageId === fetn.messageId)) {
                                this.thumbnails.push(fetn);

                                var messageDivs = $('.messageDiv');
                                messageDivs.each((index, div) => {

                                    var jDiv = $(div);
                                    var messageID = <number>jDiv.data("messageID");
                                    if (messageID === fetn.messageId) {
                                        var thumbnailImg = $(".thumbnailImg", jDiv);
                                        thumbnailImg.height(100);
                                        thumbnailImg.width(100);
                                        thumbnailImg.attr('src', this.imageBytesTobase64(fetn.data));
                                    }
                                });
                            }
                        });
                    }
                
                    }
            //
                );


            //w = canvas.width;
            //h = canvas.height;
            $("#viewDrawBoxButton").click(() => drawCanvasVisible(drawCanvasDiv.css('visibility') !== 'visible') );
            
            $(".messageDiv").data("animating", false);
            $(".messageDiv").data("expanded", false);

            $(".messageDiv").click((evnt) => {
                var exp = $(".expandedContentDiv", $(evnt.currentTarget));
                var animating = <boolean>exp.data("animating");
                var expanded = <boolean>exp.data("expanded");

                if (!animating) {
                    exp.data("animating", true);
                    if (expanded) {
                        exp.data("expanded", false);
                        exp.slideUp(500, () => {
                            exp.data("animating", false);
                        });
                    } else {
                        exp.data("expanded", true);
                    exp.slideDown(500, () => {
                            exp.data("animating", false);
                        });
                }
            }

        });

        }

        redrawPeopleList() {
            var peopleList = $('#peopleList')
            peopleList.empty();
            this.peopleInRoom.forEach(
                (p) => {
                    var style = "";
                    if (this.peopleTyping.some((pt) => p.id === pt.id )) {
                        style = "typing";
                    }
                    else {
                        style = "normal";
                    }
                    peopleList.append('<li><div class="personBullitDiv personBullitDiv_#style"><span class="personBullitSpan">#name</span></div></li>'.replace('#name', p.name).replace('#style', style))
                })

        }
    }
}