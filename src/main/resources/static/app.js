var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;
    var canvas, context;

    var drawPoint = function (x, y) {
        context.beginPath();
        context.arc(x, y, 3, 0, 2 * Math.PI);
        context.fillStyle = 'black';  // Corregido: 'fillStyle' en lugar de 'fillstyle'
        context.fill();
    };

    var handleCanvasClick = function (event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        var pt = new Point(x, y);
        console.info("Publishing point at ", pt);

        if (stompClient && stompClient.connected) {
            stompClient.send("/topic/newpoint", {}, JSON.stringify(pt));
        } else {
            console.error("WebSocket not connected");
        }
        drawPoint(x, y);
    };

    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newpoint', function (eventbody) {
                var receivedPoint = JSON.parse(eventbody.body);
                drawPoint(receivedPoint.x, receivedPoint.y);
            });
        }, function (error) {
            console.error("WebSocket connection error:", error);
        });
    };

    return {

        init: function () {
            canvas = document.getElementById("canvas");  // Ahora asignado correctamente
            if (!canvas) {
                console.error("Canvas element not found");
                return;
            }
            context = canvas.getContext("2d");

            connectAndSubscribe();

            // Agregar evento de clic al canvas
            canvas.addEventListener("click", handleCanvasClick);
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        }
    };

})();

// Llamar a la inicialización después de que el DOM esté cargado
document.addEventListener("DOMContentLoaded", function () {
    app.init();
});
