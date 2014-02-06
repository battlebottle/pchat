module DrawCanvas {
    class Point {
        constructor(public x: number, public y: number) { }
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

        getDrawingMade() {
            return this.drawingMade;
        }

        private getMousePosition(e: MouseEvent) {
            var point = new Point(
                e.offsetX == undefined ? e.layerX : e.offsetX,
                e.offsetY == undefined ? e.layerY : e.offsetY);
            return point;
        }

        constructor(private canvas: HTMLCanvasElement) {
            this.renderingContext = canvas.getContext("2d");
            this.renderingContext.lineCap = "round";
            this.reset();
            //this.renderingContext.
            var classThis = this;
            canvas.addEventListener("mousemove", function (e) {
                if (classThis.mouseDown) {
                    classThis.mouseDownFrames = classThis.mouseDownFrames + 1
                    classThis.previousMousePosition = classThis.currentMousePosition;
                    classThis.currentMousePosition = classThis.getMousePosition(e);
                    if (classThis.mouseDownFrames > 1) {
                        classThis.drawLine();
                    }
                }
            }, false);
            canvas.addEventListener("mousedown", function (e) {
                classThis.mouseDown = true;
                classThis.mouseDownFrames = 0
            }, false);
            canvas.addEventListener("mouseup", function (e) {
                classThis.mouseDown = false;
            }, false);
            canvas.addEventListener("mouseout", function (e) {
                classThis.mouseDown = false;
            }, false);
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
            this.drawingMade = true;   
            this.renderingContext.beginPath();
            this.renderingContext.moveTo(this.previousMousePosition.x, this.previousMousePosition.y);
            this.renderingContext.lineTo(this.currentMousePosition.x, this.currentMousePosition.y);
            this.renderingContext.strokeStyle = "black";
            var dist = DrawCanvas.getDistance(this.previousMousePosition, this.currentMousePosition);
            this.previousLineWidth = this.currentLineWidth;
            this.currentLineWidth = Math.max(Math.min(2 + dist / 2, 20), 2);
            this.renderingContext.lineWidth = this.currentLineWidth;
            this.renderingContext.stroke();
            this.renderingContext.closePath();
        }

    getPngArrayBuffer() {
        var dataURL = this.canvas.toDataURL("image/png");

        var string_base64 = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");

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