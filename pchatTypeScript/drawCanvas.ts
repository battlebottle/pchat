"use strict";
module DrawCanvas {
    class Point {
        constructor(public x: number, public y: number) { }
    }

    enum BrushMode {
        Pen,
        RedBrush,
        GreenBrush,
        BlueBrush,
        Eraser
    }

    export class DrawCanvas {
        private mouseDown = false
        private mouseDownFrames = 0
        private previousMousePosition = new Point(0, 0)
        private currentMousePosition = new Point(0, 0)
        private renderingContext: CanvasRenderingContext2D
        private previousLineWidth = 2;
        private currentLineWidth = 2;
        private drawingMade = false;

        private brushMode = BrushMode.Pen

        private setBrushMode(brushMode: BrushMode) {
            this.brushMode = brushMode;
        }

        getDrawingMade() {
            return this.drawingMade;
        }

        private findPos(obj) {
            var curleft = 0, curtop = 0;
            if (obj.offsetParent) {
                do {
                    curleft += obj.offsetLeft - window.screenX;
                    curtop += obj.offsetTop - window.screenY;
                } while (obj = obj.offsetParent);
            }
            return new Point(curleft, curtop);
        }


        private getMousePosition(e: MouseEvent) {
            var point = new Point(
                e.offsetX == undefined ? e.layerX : e.offsetX,
                e.offsetY == undefined ? e.layerY : e.offsetY);
            return point;
        }

        private getTouchPosition(e: any) {
            var offset = this.findPos(this.canvas);
            var point = new Point(
                e.targetTouches[0].pageX - offset.x - (window.pageXOffset || window.document.body.scrollLeft) + (window.document.body.clientLeft || 0),
                e.targetTouches[0].pageY - offset.y - (window.pageYOffset || window.document.body.scrollTop) + (window.document.body.clientTop || 0));
            return point;
        }

        constructor(private canvas: HTMLCanvasElement) {
            this.renderingContext = canvas.getContext("2d");
            this.renderingContext.lineCap = "round";
            this.reset();
            //this.renderingContext.
            var classThis = this;
            canvas.addEventListener("mousemove", (e) => {
                if (classThis.mouseDown) {
                    classThis.mouseDownFrames = classThis.mouseDownFrames + 1
                    classThis.previousMousePosition = classThis.currentMousePosition;
                    classThis.currentMousePosition = classThis.getMousePosition(e);
                    if (classThis.mouseDownFrames > 1) {
                        classThis.drawLine();
                    }
                }
                e.preventDefault();
            }, false);
            canvas.addEventListener("mousedown", (e) => {
                classThis.mouseDown = true;
                classThis.mouseDownFrames = 0;
                e.preventDefault();
            }, false);
            canvas.addEventListener("mouseup", (e) => {
                classThis.mouseDown = false;
            }, false);
            canvas.addEventListener("mouseout", (e) => {
                classThis.mouseDown = false;
            }, false);



            canvas.addEventListener("touchmove", (e) => {
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
            canvas.addEventListener("touchstart", (e) => {
                classThis.mouseDown = true;
                classThis.mouseDownFrames = 0;
                e.preventDefault();
            });
            canvas.addEventListener("touchup", (e) => {
                classThis.mouseDown = false;
            });
            canvas.addEventListener("mouseout", (e) => {
                classThis.mouseDown = false;
            });

            //wire up buttons

            $('#drawCanvasButton_pen').click(() => this.setBrushMode(BrushMode.Pen));
            $('#drawCanvasButton_eraser').click(() => this.setBrushMode(BrushMode.Eraser));
            $('#drawCanvasButton_redBrush').click(() => this.setBrushMode(BrushMode.RedBrush));
            $('#drawCanvasButton_greenBrush').click(() => this.setBrushMode(BrushMode.GreenBrush));
            $('#drawCanvasButton_blueBrush').click(() => this.setBrushMode(BrushMode.BlueBrush));
            $('#drawCanvasButton_clear').click(() => this.reset());
            $('#drawCanvasButton_image').click(() => { });
        }

        reset() {
            this.drawingMade = false;
            this.renderingContext.rect(0, 0, 420, 420);
            this.renderingContext.fillStyle = "white";
            this.renderingContext.fill();
        }


        private static getDistance(point1 : Point, point2 : Point) {
            return Math.sqrt(
                Math.pow(point2.x - point1.x, 2) +
                Math.pow(point2.y - point1.y, 2)
                );
        }

        private drawLine() {
            if (this.brushMode === BrushMode.Pen) {
                this.drawingMade = true;

                this.renderingContext.beginPath();
                this.renderingContext.moveTo(this.previousMousePosition.x, this.previousMousePosition.y);
                this.renderingContext.lineTo(this.currentMousePosition.x, this.currentMousePosition.y);
                var dist = DrawCanvas.getDistance(this.previousMousePosition, this.currentMousePosition);
                var t = Math.min(1 / dist, 1).toString();
                this.renderingContext.strokeStyle = "black";//"rgba(0,0,0,%a)".replace("%a", Math.min(1 / dist, 1).toString());
                this.previousLineWidth = this.currentLineWidth;
                this.currentLineWidth = Math.max(Math.min(2 + dist / 2, 20), 2);
                this.renderingContext.lineWidth = this.currentLineWidth;
                this.renderingContext.stroke();
                this.renderingContext.closePath();
            } else {
                this.drawLine_();
            }

        }

        private getTessalatedPoints(start: Point, end: Point, steps: number) {
            var getInnerPoint = (start: Point, end: Point, offset: number) => {
                return new Point(
                    (start.x - end.x) * offset + start.x,
                    (start.y - end.y) * offset + start.y
                    );
            };

            var points = [];
            for (var i = 0; i < steps - 1; i++) {
                points.push(getInnerPoint(start, end, (i + 1) / steps));
            }
            points.push(end);
            return points;
        }

        private rand(num) {
            return (Math.random() * num) - (num / 2);
        }

        private drawLine_() {
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
            var rnd = () => { return this.rand(dist) };

            var drawDot = (point: Point, radius: number, opacity: number) => {
                var x = point.x;
                var y = point.y;
                this.renderingContext.beginPath();
                var grd = this.renderingContext.createRadialGradient(x, y, radius * 0.7, x, y, radius);
                var colStr = "%r,%g,%b"
                    .replace("%r", Math.floor(50 + this.rand(10)).toString())
                    .replace("%g", Math.floor(130 + this.rand(10)).toString())
                    .replace("%b", Math.floor(10 + this.rand(10)).toString());
                grd.addColorStop(0, "rgba(%col,%opacity)".replace("%col", colStr).replace("%opacity", (0.03 * opacity).toString()));
                grd.addColorStop(1, "rgba(%col,0)".replace("%col", colStr));
                this.renderingContext.fillStyle = grd;
                this.renderingContext.arc(x, y, radius, 0, 2 * Math.PI);
                this.renderingContext.fill();
                this.renderingContext.closePath();
            }

            var minBrush = 5;
            this.getTessalatedPoints(this.previousMousePosition, this.currentMousePosition, 8 * (Math.min(dist, minBrush) / minBrush)).forEach((point) => {
                drawDot(new Point(point.x + rnd(), point.y + rnd()), Math.min(30, dist + minBrush), 1);
                //for (var i = 0; i < 3; i++) {
                //    drawDot(new Point(point.x + rnd() * 2, point.y + rnd() * 2), Math.min(30, rnd() + dist / 2 + 2), Math.min(1, dist / 5));
                //}
            });

        }

        private drawLine4() {
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
            var rnd = () => { return this.rand(dist) };

            var drawDot = (point: Point, radius: number, opacity: number) => {
                var x = point.x;
                var y = point.y;
                this.renderingContext.beginPath();
                var grd = this.renderingContext.createRadialGradient(x, y, radius * 0.4, x, y, radius);
                var colStr = "%r,%g,%b"
                    .replace("%r", Math.floor(50 + this.rand(10)).toString())
                    .replace("%g", Math.floor(130 + this.rand(10)).toString())
                    .replace("%b", Math.floor(10 + this.rand(10)).toString());
                grd.addColorStop(0, "rgba(%col,%opacity)".replace("%col", colStr).replace("%opacity", (0.3 * opacity).toString()));
                grd.addColorStop(1, "rgba(%col,0)".replace("%col", colStr));
                this.renderingContext.fillStyle = grd;
                this.renderingContext.arc(x, y, radius, 0, 2 * Math.PI);
                this.renderingContext.fill();
                this.renderingContext.closePath();
            }

            drawDot(new Point(this.currentMousePosition.x + rnd(), this.currentMousePosition.y + rnd()), Math.min(30, dist + 2), Math.min(1, dist / 5));
            for (var i = 0; i < 3; i++) {
                drawDot(new Point(this.currentMousePosition.x + rnd() * 2, this.currentMousePosition.y + rnd() * 2), Math.min(30, rnd() + dist / 2 + 2), Math.min(1, dist / 5));
            }
        }

    getPngArrayBuffer() {
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
    }
    }
}