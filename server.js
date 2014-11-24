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




    "use strict";

    var fs = require('fs');

    // you'll probably load configuration from config
    var cfg = {
        ssl: true,
        port: 8080,
        ssl_key: '/path/to/you/ssl.key',
        ssl_cert: '/path/to/you/ssl.crt'
    };

    var httpServ = ( cfg.ssl ) ? require('https') : require('http');
    var WebSocketServer   = require('../').Server;
    var app      = null;

    // dummy request processing
    var processRequest = function( req, res ) {
        res.writeHead(200);
        res.end("All glory to WebSockets!\n");
    };

    if ( cfg.ssl ) {
        app = httpServ.createServer({
            // providing server with  SSL key/cert
            key: fs.readFileSync( cfg.ssl_key ),
            cert: fs.readFileSync( cfg.ssl_cert )
        }, processRequest ).listen( cfg.port );
    } else {
        app = httpServ.createServer( processRequest ).listen( cfg.port );
    }

    // passing or reference to web server so WS would knew port and SSL capabilities
    var wss = new WebSocketServer( { server: app } );





// var wss = new WebSocketServer({server: server})
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



// var WebSocketServer = require("ws").Server
// var http = require("http")
// var express = require("express")
// var app = express()
// var port = process.env.PORT || 8001

// app.use(express.static(__dirname + "/"))

// var server = http.createServer(app)
// server.listen(port)

// console.log("http server listening on %d", port)

// var wss = new WebSocketServer({server: server})
// console.log("websocket server created")

// wss.on('connection', function connection(ws) {
//   ws.on('message', function incoming(message) {
//     var msg = JSON.parse(message);
//     switch (msg.type) {
//       case "nickname":
//         wss.nickname = msg.value;
//         msg.value = wss.nickname + " entered";
//         msg.type = 'message';
//         break;

//       case "message":
//         msg.value = "[" + wss.nickname + "] " + msg.value;
//         msg.type = 'message';
//         break;
//     }
//     msg = JSON.stringify(msg);
//     wss.broadcast(msg);
//   });

//   ws.on("close", function() {
//     console.log("websocket connection close")
//     var msg = new Object();
//     msg.value = wss.nickname + " left";
//     msg.type = 'message';
//     msg = JSON.stringify(msg);
//     wss.broadcast(msg);
//   })
// });

// wss.broadcast = function broadcast(data) {
//   for(var i in this.clients) {
//     this.clients[i].send(data);
//   }
// };
