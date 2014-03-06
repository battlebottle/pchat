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
        function DrawCanvas(canvas) {
            var _this = this;
            this.canvas = canvas;
            this.mouseDown = false;
            this.mouseDownFrames = 0;
            this.previousMousePosition = new Point(0, 0);
            this.currentMousePosition = new Point(0, 0);
            this.previousLineWidth = 2;
            this.currentLineWidth = 2;
            this.drawingMade = false;
            this.brushMode = 0 /* Pen */;
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
                e.preventDefault();
            }, false);
            canvas.addEventListener("mouseup", function (e) {
                classThis.mouseDown = false;
            }, false);
            canvas.addEventListener("mouseout", function (e) {
                classThis.mouseDown = false;
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
            $('#drawCanvasButton_redBrush').click(function () {
                return _this.setBrushMode(1 /* RedBrush */);
            });
            $('#drawCanvasButton_greenBrush').click(function () {
                return _this.setBrushMode(2 /* GreenBrush */);
            });
            $('#drawCanvasButton_blueBrush').click(function () {
                return _this.setBrushMode(3 /* BlueBrush */);
            });
            $('#drawCanvasButton_clear').click(function () {
                return _this.reset();
            });
            $('#drawCanvasButton_image').click(function () {
            });
        }
        DrawCanvas.prototype.setBrushMode = function (brushMode) {
            this.brushMode = brushMode;
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

        DrawCanvas.prototype.getMousePosition = function (e) {
            var point = new Point(e.offsetX == undefined ? e.layerX : e.offsetX, e.offsetY == undefined ? e.layerY : e.offsetY);
            return point;
        };

        DrawCanvas.prototype.getTouchPosition = function (e) {
            var offset = this.findPos(this.canvas);
            var point = new Point(e.targetTouches[0].pageX - offset.x - (window.pageXOffset || window.document.body.scrollLeft) + (window.document.body.clientLeft || 0), e.targetTouches[0].pageY - offset.y - (window.pageYOffset || window.document.body.scrollTop) + (window.document.body.clientTop || 0));
            return point;
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

        DrawCanvas.prototype.drawLine = function () {
            if (this.brushMode === 0 /* Pen */) {
                this.drawingMade = true;

                this.renderingContext.beginPath();
                this.renderingContext.moveTo(this.previousMousePosition.x, this.previousMousePosition.y);
                this.renderingContext.lineTo(this.currentMousePosition.x, this.currentMousePosition.y);
                var dist = DrawCanvas.getDistance(this.previousMousePosition, this.currentMousePosition);
                var t = Math.min(1 / dist, 1).toString();
                this.renderingContext.strokeStyle = "black"; //"rgba(0,0,0,%a)".replace("%a", Math.min(1 / dist, 1).toString());
                this.previousLineWidth = this.currentLineWidth;
                this.currentLineWidth = Math.max(Math.min(2 + dist / 2, 20), 2);
                this.renderingContext.lineWidth = this.currentLineWidth;
                this.renderingContext.stroke();
                this.renderingContext.closePath();
            } else {
                this.drawLine_();
            }
        };

        DrawCanvas.prototype.getTessalatedPoints = function (start, end, steps) {
            var getInnerPoint = function (start, end, offset) {
                return new Point((start.x - end.x) * offset + start.x, (start.y - end.y) * offset + start.y);
            };

            var points = [];
            for (var i = 0; i < steps - 1; i++) {
                points.push(getInnerPoint(start, end, (i + 1) / steps));
            }
            points.push(end);
            return points;
        };

        DrawCanvas.prototype.rand = function (num) {
            return (Math.random() * num) - (num / 2);
        };

        DrawCanvas.prototype.drawLine_ = function () {
            var _this = this;
            this.drawingMade = true;

            this.renderingContext.beginPath();

            //this.renderingContext.moveTo(this.previousMousePosition.x, this.previousMousePosition.y);
            //this.renderingContext.lineTo(this.currentMousePosition.x, this.currentMousePosition.y);
            var dist = DrawCanvas.getDistance(this.previousMousePosition, this.currentMousePosition);

            //if (this.mouseDownFrames % 150 == 0) {
            //    //alert(this.previousMousePosition.x + "," + this.previousMousePosition.y + " " +
            //    //    this.currentMousePosition.x + "," + this.currentMousePosition.y
            //    //    );
            //    //alert((window.pageYOffset || window.document.body.scrollTop) - (window.document.body.clientTop || 0));
            //    alert(1 / dist);
            //}
            var t = Math.min(1 / dist, 1).toString();

            //this.renderingContext.strokeStyle = "rgba(0,0,0,%a)".replace("%a", Math.min(1 / dist, 1).toString());
            this.previousLineWidth = this.currentLineWidth;
            this.currentLineWidth = Math.max(Math.min(2 + dist / 2, 20), 2);
            this.renderingContext.fillStyle = "rgba(0,0,0,%a)".replace("%a", (0.2).toString());
            this.renderingContext.lineWidth = 3;

            //this.renderingContext.lineWidth = this.currentLineWidth;
            //this.renderingContext.stroke();
            var rnd = function () {
                return _this.rand(dist);
            };

            var drawDot = function (point, radius, opacity) {
                var x = point.x;
                var y = point.y;
                _this.renderingContext.beginPath();
                var grd = _this.renderingContext.createRadialGradient(x, y, radius * 0.7, x, y, radius);
                var colStr = "%r,%g,%b".replace("%r", Math.floor(50 + _this.rand(10)).toString()).replace("%g", Math.floor(130 + _this.rand(10)).toString()).replace("%b", Math.floor(10 + _this.rand(10)).toString());
                grd.addColorStop(0, "rgba(%col,%opacity)".replace("%col", colStr).replace("%opacity", (0.03 * opacity).toString()));
                grd.addColorStop(1, "rgba(%col,0)".replace("%col", colStr));
                _this.renderingContext.fillStyle = grd;
                _this.renderingContext.arc(x, y, radius, 0, 2 * Math.PI);
                _this.renderingContext.fill();
                _this.renderingContext.closePath();
            };

            var minBrush = 5;
            this.getTessalatedPoints(this.previousMousePosition, this.currentMousePosition, 8 * (Math.min(dist, minBrush) / minBrush)).forEach(function (point) {
                drawDot(new Point(point.x + rnd(), point.y + rnd()), Math.min(30, dist + minBrush), 1);
                //for (var i = 0; i < 3; i++) {
                //    drawDot(new Point(point.x + rnd() * 2, point.y + rnd() * 2), Math.min(30, rnd() + dist / 2 + 2), Math.min(1, dist / 5));
                //}
            });
        };

        DrawCanvas.prototype.drawLine4 = function () {
            var _this = this;
            this.drawingMade = true;

            this.renderingContext.beginPath();

            //this.renderingContext.moveTo(this.previousMousePosition.x, this.previousMousePosition.y);
            //this.renderingContext.lineTo(this.currentMousePosition.x, this.currentMousePosition.y);
            var dist = DrawCanvas.getDistance(this.previousMousePosition, this.currentMousePosition);

            //if (this.mouseDownFrames % 150 == 0) {
            //    //alert(this.previousMousePosition.x + "," + this.previousMousePosition.y + " " +
            //    //    this.currentMousePosition.x + "," + this.currentMousePosition.y
            //    //    );
            //    //alert((window.pageYOffset || window.document.body.scrollTop) - (window.document.body.clientTop || 0));
            //    alert(1 / dist);
            //}
            var t = Math.min(1 / dist, 1).toString();

            //this.renderingContext.strokeStyle = "rgba(0,0,0,%a)".replace("%a", Math.min(1 / dist, 1).toString());
            this.previousLineWidth = this.currentLineWidth;
            this.currentLineWidth = Math.max(Math.min(2 + dist / 2, 20), 2);
            this.renderingContext.fillStyle = "rgba(0,0,0,%a)".replace("%a", (0.2).toString());
            this.renderingContext.lineWidth = 3;

            //this.renderingContext.lineWidth = this.currentLineWidth;
            //this.renderingContext.stroke();
            var rnd = function () {
                return _this.rand(dist);
            };

            var drawDot = function (point, radius, opacity) {
                var x = point.x;
                var y = point.y;
                _this.renderingContext.beginPath();
                var grd = _this.renderingContext.createRadialGradient(x, y, radius * 0.4, x, y, radius);
                var colStr = "%r,%g,%b".replace("%r", Math.floor(50 + _this.rand(10)).toString()).replace("%g", Math.floor(130 + _this.rand(10)).toString()).replace("%b", Math.floor(10 + _this.rand(10)).toString());
                grd.addColorStop(0, "rgba(%col,%opacity)".replace("%col", colStr).replace("%opacity", (0.3 * opacity).toString()));
                grd.addColorStop(1, "rgba(%col,0)".replace("%col", colStr));
                _this.renderingContext.fillStyle = grd;
                _this.renderingContext.arc(x, y, radius, 0, 2 * Math.PI);
                _this.renderingContext.fill();
                _this.renderingContext.closePath();
            };

            drawDot(new Point(this.currentMousePosition.x + rnd(), this.currentMousePosition.y + rnd()), Math.min(30, dist + 2), Math.min(1, dist / 5));
            for (var i = 0; i < 3; i++) {
                drawDot(new Point(this.currentMousePosition.x + rnd() * 2, this.currentMousePosition.y + rnd() * 2), Math.min(30, rnd() + dist / 2 + 2), Math.min(1, dist / 5));
            }
        };

        DrawCanvas.prototype.getPngArrayBuffer = function () {
            var dataURL = this.canvas.toDataURL("image/jpeg", 0.8);

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
