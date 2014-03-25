"use strict";
var DrawCanvas;
(function (_DrawCanvas) {
    var Point = (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    })();

    var BrushMode;
    (function (BrushMode) {
        BrushMode[BrushMode["Pen"] = 0] = "Pen";
        BrushMode[BrushMode["RedBrush"] = 1] = "RedBrush";
        BrushMode[BrushMode["GreenBrush"] = 2] = "GreenBrush";
        BrushMode[BrushMode["BlueBrush"] = 3] = "BlueBrush";
        BrushMode[BrushMode["Eraser"] = 4] = "Eraser";
    })(BrushMode || (BrushMode = {}));

    var DrawCanvas = (function () {
        function DrawCanvas(canvas, viewModel) {
            var _this = this;
            this.canvas = canvas;
            this.viewModel = viewModel;
            this.mouseDown = false;
            this.mouseDownFrames = 0;
            this.previousMousePosition = new Point(0, 0);
            this.currentMousePosition = new Point(0, 0);
            this.previousLineWidth = 2;
            this.currentLineWidth = 2;
            this.drawingMade = false;
            this.previousMouseTime = Date.now();
            this.brushMode = 0 /* Pen */;
            this.lastLineWidths = DrawCanvas.createEmptyWidthHistory();
            this.renderingContext = canvas.getContext("2d");
            this.renderingContext.lineCap = "round";
            this.reset();

            //this.renderingContext.
            var classThis = this;
            canvas.addEventListener("mousemove", function (e) {
                if (classThis.mouseDown) {
                    classThis.mouseDownFrames = classThis.mouseDownFrames + 1;
                    classThis.previousMousePosition = classThis.currentMousePosition;
                    classThis.currentMousePosition = classThis.getMousePosition(e);
                    if (classThis.mouseDownFrames > 1) {
                        classThis.drawLine();
                    }
                }
                e.preventDefault();
            }, false);
            canvas.addEventListener("mousedown", function (e) {
                classThis.mouseDown = true;
                classThis.mouseDownFrames = 0;
                classThis.previousMouseTime = Date.now();
                classThis.lastLineWidths = DrawCanvas.createEmptyWidthHistory();
                classThis.previousLineWidth = 1;
                viewModel.setProp(new ViewModel.DrawingMouseDown());
                e.preventDefault();
            }, false);
            canvas.addEventListener("mouseup", function (e) {
                classThis.mouseDown = false;
                viewModel.setProp(new ViewModel.DrawingMouseUp());
            }, false);
            canvas.addEventListener("mouseout", function (e) {
                classThis.mouseDown = false;
                viewModel.setProp(new ViewModel.DrawingMouseUp());
            }, false);

            canvas.addEventListener("touchmove", function (e) {
                if (classThis.mouseDown) {
                    classThis.mouseDownFrames = classThis.mouseDownFrames + 1;
                    classThis.previousMousePosition = classThis.currentMousePosition;
                    classThis.currentMousePosition = classThis.getTouchPosition(e);
                    if (classThis.mouseDownFrames > 1) {
                        classThis.drawLine();
                    }
                }
                e.preventDefault();
            });
            canvas.addEventListener("touchstart", function (e) {
                classThis.mouseDown = true;
                classThis.mouseDownFrames = 0;
                e.preventDefault();
            });
            canvas.addEventListener("touchup", function (e) {
                classThis.mouseDown = false;
            });
            canvas.addEventListener("mouseout", function (e) {
                classThis.mouseDown = false;
            });

            //wire up buttons
            $('#drawCanvasButton_pen').click(function () {
                return _this.setBrushMode(0 /* Pen */);
            });
            $('#drawCanvasButton_eraser').click(function () {
                return _this.setBrushMode(4 /* Eraser */);
            });
            $('#drawCanvasButton_clear').click(function () {
                return _this.reset();
            });
            $('#drawCanvasButton_image').click(function () {
                return $('#file').click();
            });
            $('#file').bind("change", function (ev) {
                var file = ev.target['files'][0];
                var reader = new FileReader();

                reader.onload = function (fev) {
                    var image = new Image();
                    image.onload = function (iev) {
                        _this.reset();
                        _this.drawingMade = true;
                        _this.renderingContext.drawImage(image, 0, 0, 420, 420);

                        _this.renderingContext.rect(0, 0, 420, 420);
                        _this.renderingContext.fillStyle = "rgba(255, 255, 255, 0.25)";
                        _this.renderingContext.fill();
                    };
                    image.src = fev.target.result;
                };

                reader.readAsDataURL(file);
            });
        }
        DrawCanvas.createEmptyWidthHistory = function () {
            var array = [];
            for (var i = 0; i < 10; i++) {
                array.push(1);
            }
            return array;
        };

        DrawCanvas.prototype.setBrushMode = function (brushMode) {
            this.brushMode = brushMode;
            if (this.brushMode === 0 /* Pen */) {
                $('#drawCanvasButton_pen').addClass("drawCanvasButtonDivSelected");
                $('#drawCanvasButton_eraser').removeClass("drawCanvasButtonDivSelected");
            } else {
                $('#drawCanvasButton_pen').removeClass("drawCanvasButtonDivSelected");
                $('#drawCanvasButton_eraser').addClass("drawCanvasButtonDivSelected");
            }
        };

        DrawCanvas.prototype.getDrawingMade = function () {
            return this.drawingMade;
        };

        DrawCanvas.prototype.findPos = function (obj) {
            var curleft = 0, curtop = 0;
            if (obj.offsetParent) {
                do {
                    curleft += obj.offsetLeft - window.screenX;
                    curtop += obj.offsetTop - window.screenY;
                } while(obj = obj.offsetParent);
            }
            return new Point(curleft, curtop);
        };

        DrawCanvas.scalePoint = function (point) {
            var scale = 420 / $('#drawCanvas').width();
            return new Point(point.x * scale, point.y * scale);
        };

        DrawCanvas.prototype.getMousePosition = function (e) {
            var point = new Point(e.offsetX == undefined ? e.layerX : e.offsetX, e.offsetY == undefined ? e.layerY : e.offsetY);
            return DrawCanvas.scalePoint(point);
        };

        DrawCanvas.prototype.getTouchPosition = function (e) {
            var offset = this.findPos(this.canvas);
            var point = new Point(e.targetTouches[0].pageX - offset.x - (window.pageXOffset || window.document.body.scrollLeft) + (window.document.body.clientLeft || 0), e.targetTouches[0].pageY - offset.y - (window.pageYOffset || window.document.body.scrollTop) + (window.document.body.clientTop || 0));
            return DrawCanvas.scalePoint(point);
        };

        DrawCanvas.prototype.reset = function () {
            this.drawingMade = false;
            this.renderingContext.rect(0, 0, 420, 420);
            this.renderingContext.fillStyle = "white";
            this.renderingContext.fill();
        };

        DrawCanvas.getDistance = function (point1, point2) {
            return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
        };

        DrawCanvas.getInnerPoint = function (point1, point2, progress) {
            return new Point(point1.x * (progress) + point2.x * (1 - progress), point1.y * (progress) + point2.y * (1 - progress));
        };

        DrawCanvas.prototype.drawLine = function () {
            var currentTime = Date.now();
            var timeDif = currentTime - this.previousMouseTime;
            console.log("" + timeDif);

            var penMode = (this.brushMode === 0 /* Pen */);
            this.drawingMade = true;

            var dist = DrawCanvas.getDistance(this.previousMousePosition, this.currentMousePosition);
            var lineWidthMult = dist / (timeDif / 10);
            this.renderingContext.strokeStyle = penMode ? "black" : "white"; //"rgba(0,0,0,%a)".replace("%a", Math.min(1 / dist, 1).toString());
            this.currentLineWidth = Math.max(Math.min(2 + lineWidthMult / 2, 20), 2) * (penMode ? 1 : 3);

            this.currentLineWidth > this.previousLineWidth * 5 ? this.previousLineWidth : this.currentLineWidth;
            this.lastLineWidths.push(this.currentLineWidth);
            while (this.lastLineWidths.length > 3)
                this.lastLineWidths.splice(0, 1);
            var avgLineWidth = this.lastLineWidths.reduce(function (prev, cur) {
                return prev + cur;
            }, 0) / this.lastLineWidths.length;

            this.currentLineWidth = avgLineWidth;

            var steps = Math.ceil(dist / 3) + 1;

            for (var i = 1; i < steps; i++) {
                var point1 = DrawCanvas.getInnerPoint(this.previousMousePosition, this.currentMousePosition, (i - 1) / (steps - 1));
                var point2 = DrawCanvas.getInnerPoint(this.previousMousePosition, this.currentMousePosition, i / (steps - 1));

                //point1 = this.previousMousePosition;
                //point2 = this.currentMousePosition;
                this.renderingContext.beginPath();
                this.renderingContext.moveTo(point1.x, point1.y);
                this.renderingContext.lineTo(point2.x, point2.y);
                this.renderingContext.lineWidth = this.currentLineWidth + (this.previousLineWidth - this.currentLineWidth) * (i / (steps - 1));
                this.renderingContext.stroke();
                this.renderingContext.closePath();
                this.previousMouseTime = currentTime;
            }
            this.previousLineWidth = this.currentLineWidth;
        };

        DrawCanvas.prototype.getPngArrayBuffer = function () {
            var dataURL = this.canvas.toDataURL("image/jpeg", 0.85);

            var string_base64 = dataURL.replace(/^data:image\/(png|jpeg);base64,/, "");

            var binary_string = window.atob(string_base64);
            var len = binary_string.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                var ascii = binary_string.charCodeAt(i);
                bytes[i] = ascii;
            }
            console.log("getPngArrayBuffer: " + bytes.length);
            return bytes;
        };
        return DrawCanvas;
    })();
    _DrawCanvas.DrawCanvas = DrawCanvas;
})(DrawCanvas || (DrawCanvas = {}));
//# sourceMappingURL=drawCanvas.js.map
