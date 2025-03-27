var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;
    var topic;

    var setTopic = function (number) {
        topic = number;
        if (!stompClient) {
            connectAndSubscribe();
        } else {
            stompClient.unsubscribe();
            connectAndSubscribe();
        }
    };
    

    var addPointToCanvas = function (point) {
        console.log('Received point:', point);
        if (typeof point.x !== 'undefined' && typeof point.y !== 'undefined') {
            var canvas = document.getElementById("canvas");
            var ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.stroke();
        } else {
            console.error('Invalid point format:', point);
        }
    };

    var getMousePosition = function (evt) {
        var canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var connectAndSubscribe = function () {
        console.info('Connecting to WebSocket...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);

            stompClient.subscribe('/topic/newpoint.' + topic, function (eventbody) {
                var receivedPoit = JSON.parse(eventbody.body);
                console.log('Received point:', receivedPoit);
                addPointToCanvas(receivedPoit);
            });
        });
    };

    var publishPoint = function(px, py) {
        var pt = new Point(px, py);
        console.info("Publishing point at: ", pt);
        stompClient.send("/topic/newpoint." + topic, {}, JSON.stringify(pt));
    };

    return {
        init: function () {
            var canvas = document.getElementById("canvas");
            canvas.addEventListener("click", function (evt) {
                var mousePos = getMousePosition(evt);
                publishPoint(mousePos.x, mousePos.y);
            }, false);
        },
        setTopic: setTopic,
        publishPoint: publishPoint,
        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        }
    };
})();

app.init();