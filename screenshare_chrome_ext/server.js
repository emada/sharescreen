var http = require("http")
var ws = require("../../")
var fs = require("fs")

// Http server 
http.createServer(function (req, res) {
	fs.createReadStream("index.html").pipe(res)
}).listen(8000)

// Sockets server
var server = ws.createServer(function (connection) {
	connection.nickname = null
	// connection.on("text", function (str) {
	// 	if (connection.nickname === null) {
	// 		connection.nickname = str
	// 		broadcast(str+" entered")
	// 	} else
	// 		broadcast("["+connection.nickname+"] "+str)
	// })

	connection.on("text", function (e) {
		var msg = JSON.parse(e);
	 //  console.log(msg);
		switch (msg.type) {
	    case "nickname":
				connection.nickname = msg.value;
				msg.value = connection.nickname + " entered";
				msg.type = 'message';
	      break;

	    case "message":
				msg.value = "[" + connection.nickname + "] " + msg.value;
				msg.type = 'message';
	      break;
    }
		msg = JSON.stringify(msg);
	  // console.log(msg);
		broadcast(msg);
	});

	connection.on("close", function () {
		var msg = new Object();
		msg.value = connection.nickname + " left";
		msg.type = 'message';
		msg = JSON.stringify(msg);
	  // console.log(msg);
		broadcast(msg);
	});
})
server.listen(8001)

function broadcast(str) {
	server.connections.forEach(function (connection) {
		connection.sendText(str)
	})
}
