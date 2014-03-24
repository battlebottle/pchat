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
        private previousMouseTime = Date.now()

        private brushMode = BrushMode.Pen

        private static createEmptyWidthHistory() {
            var array : number[] = []
            for (var i = 0; i < 10; i++) {
                array.push(1);
            }
            return array;
        }

        private lastLineWidths: number[] = DrawCanvas.createEmptyWidthHistory();

        private setBrushMode(brushMode: BrushMode) {
            this.brushMode = brushMode;
            if (this.brushMode === BrushMode.Pen) {
                $('#drawCanvasButton_pen').addClass("drawCanvasButtonDivSelected");
                $('#drawCanvasButton_eraser').removeClass("drawCanvasButtonDivSelected");
            }
            else {
                $('#drawCanvasButton_pen').removeClass("drawCanvasButtonDivSelected");
                $('#drawCanvasButton_eraser').addClass("drawCanvasButtonDivSelected");
            }
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

        private static scalePoint(point: Point) {
            var scale = 420 / $('#drawCanvas').width();
            return new Point(point.x * scale, point.y * scale);
        }


        private getMousePosition(e: MouseEvent) {
            var point = new Point(
                e.offsetX == undefined ? e.layerX : e.offsetX,
                e.offsetY == undefined ? e.layerY : e.offsetY);
            return DrawCanvas.scalePoint(point);
        }

        private getTouchPosition(e: any) {
            var offset = this.findPos(this.canvas);
            var point = new Point(
                e.targetTouches[0].pageX - offset.x - (window.pageXOffset || window.document.body.scrollLeft) + (window.document.body.clientLeft || 0),
                e.targetTouches[0].pageY - offset.y - (window.pageYOffset || window.document.body.scrollTop) + (window.document.body.clientTop || 0));
            return DrawCanvas.scalePoint(point);
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
                classThis.previousMouseTime = Date.now();
                classThis.lastLineWidths = DrawCanvas.createEmptyWidthHistory();
                classThis.previousLineWidth = 1;
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
            $('#drawCanvasButton_clear').click(() => this.reset());
            $('#drawCanvasButton_image').click(() => $('#file').click());
            $('#file').bind("change",
                (ev) => {
                    var file = ev.target['files'][0];
                    var reader = new FileReader();

                    reader.onload = (fev) => {
                        var image = new Image()
                        image.onload = (iev) => {
                            this.reset();
                            this.drawingMade = true;
                            this.renderingContext.drawImage(image, 0, 0, 420, 420);


                            this.renderingContext.rect(0, 0, 420, 420);
                            this.renderingContext.fillStyle = "rgba(255, 255, 255, 0.25)";
                            this.renderingContext.fill();
                        }
                        image.src = fev.target.result;

                    };

                    reader.readAsDataURL(file);
                });
        }

        reset() {
            this.drawingMade = false;
            this.renderingContext.rect(0, 0, 420, 420);
            this.renderingContext.fillStyle = "white";
            this.renderingContext.fill();
        }


        private static getDistance(point1: Point, point2: Point) {
            return Math.sqrt(
                Math.pow(point2.x - point1.x, 2) +
                Math.pow(point2.y - point1.y, 2)
                );
        }

        private static getInnerPoint(point1: Point, point2: Point, progress: number) {
            return new Point(point1.x * (progress) + point2.x * (1 - progress), point1.y * (progress) + point2.y * (1 - progress));
        }

        private drawLine() {
            var currentTime = Date.now();
            var timeDif = currentTime - this.previousMouseTime;
            console.log("" + timeDif);
            
            var penMode = (this.brushMode === BrushMode.Pen)
            this.drawingMade = true;

            var dist = DrawCanvas.getDistance(this.previousMousePosition, this.currentMousePosition);
            var lineWidthMult = dist / (timeDif / 10)
            this.renderingContext.strokeStyle = penMode ? "black" : "white";//"rgba(0,0,0,%a)".replace("%a", Math.min(1 / dist, 1).toString());
            this.currentLineWidth = Math.max(Math.min(2 + lineWidthMult / 2, 20), 2) * (penMode ? 1 : 3);

            this.currentLineWidth > this.previousLineWidth * 5 ? this.previousLineWidth : this.currentLineWidth;
            this.lastLineWidths.push(this.currentLineWidth);
            while (this.lastLineWidths.length > 3)
                this.lastLineWidths.splice(0, 1);
            var avgLineWidth = this.lastLineWidths.reduce((prev, cur) => prev + cur, 0) / this.lastLineWidths.length;

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

        }


    getPngArrayBuffer() {
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
    }
    }
}