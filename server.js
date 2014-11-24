var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 8001

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var wss = new WebSocketServer({server: server})
console.log("websocket server created")

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    var msg = JSON.parse(message);
    switch (msg.type) {
      case "nickname":
        wss.nickname = msg.value;
        msg.value = wss.nickname + " entered";
        msg.type = 'message';
        break;

      case "message":
        msg.value = "[" + wss.nickname + "] " + msg.value;
        msg.type = 'message';
        break;
    }
    msg = JSON.stringify(msg);
    wss.broadcast(msg);
  });

  ws.on("close", function() {
    console.log("websocket connection close")
    var msg = new Object();
    msg.value = wss.nickname + " left";
    msg.type = 'message';
    msg = JSON.stringify(msg);
    wss.broadcast(msg);
  })
});

wss.broadcast = function broadcast(data) {
  for(var i in this.clients) {
    this.clients[i].send(data);
  }
};
