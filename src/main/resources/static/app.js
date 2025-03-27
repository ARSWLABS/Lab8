var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;
    var canvas, context;
    var currentDrawingId = null;

    var drawPoint = function (x, y) {
        context.beginPath();
        context.arc(x, y, 3, 0, 2 * Math.PI);
        context.fillStyle = 'black';
        context.fill();
    };

    var handleCanvasClick = function (event) {
        if (!stompClient || !currentDrawingId) {
            alert("Debes conectarte primero.");
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        var pt = new Point(x, y);

        console.info("Publishing point at ", pt);
        stompClient.send(`/app/newpoint.${currentDrawingId}`, {}, JSON.stringify(pt));
        drawPoint(x, y);
    };

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
    };

    var connectAndSubscribe = function () {
        var drawingId = document.getElementById("drawingId").value;
        if (!drawingId) {
            alert("Por favor ingrese un identificador de dibujo.");
            return;
        }

        currentDrawingId = drawingId;
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            let topic = `/topic/newpoint.${currentDrawingId}`;
            console.log("Subscribed to: " + topic);
            stompClient.subscribe(topic, function (eventbody) {
                var receivedPoint = JSON.parse(eventbody.body);
                addPointToCanvas(receivedPoint);
            });
        });
    };

    return {
        init: function () {
            canvas = document.getElementById("canvas");
            context = canvas.getContext("2d");

            document.getElementById("connectBtn").addEventListener("click", connectAndSubscribe);

            canvas.addEventListener("click", function (evt) {
                handleCanvasClick(evt);
            });
        }
    };

})();
