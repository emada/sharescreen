// new function() {
// 	var ws = null;
// 	var connected = false;

// 	var serverUrl;
// 	var connectionStatus;
// 	var sendMessage;
	
// 	var connectButton;
// 	var disconnectButton; 
// 	var sendButton;

// 	var open = function() {
// 		var url = serverUrl.val();
// 		ws = new WebSocket(url);
// 		ws.onopen = onOpen;
// 		ws.onclose = onClose;
// 		ws.onmessage = onMessage;
// 		ws.onerror = onError;

// 		connectionStatus.text('OPENING ...');
// 		serverUrl.attr('disabled', 'disabled');
// 		connectButton.hide();
// 		disconnectButton.show();
// 	}
	
// 	var close = function() {
// 		if (ws) {
// 			console.log('CLOSING ...');
// 			ws.close();
// 		}
// 		connected = false;
// 		connectionStatus.text('CLOSED');

// 		serverUrl.removeAttr('disabled');
// 		connectButton.show();
// 		disconnectButton.hide();
// 		sendMessage.attr('disabled', 'disabled');
// 		sendButton.attr('disabled', 'disabled');
// 	}
	
// 	var clearLog = function() {
// 		$('#messages').html('');
// 	}
	
// 	var onOpen = function() {
// 		console.log('OPENED: ' + serverUrl.val());
// 		connected = true;
// 		connectionStatus.text('OPENED');
// 		sendMessage.removeAttr('disabled');
// 		sendButton.removeAttr('disabled');
// 	};
	
// 	var onClose = function() {
// 		console.log('CLOSED: ' + serverUrl.val());
// 		ws = null;
// 	};
	
// 	var onMessage = function(event) {
// 		var data = event.data;
// 		addMessage(data);
// 	};
	
// 	var onError = function(event) {
// 		alert(event.data);
// 	}
	
// 	var addMessage = function(data, type) {
// 		var msg = $('<pre>').text(data);
// 		if (type === 'SENT') {
// 			msg.addClass('sent');
// 		}
// 		var messages = $('#messages');
// 		messages.append(msg);
		
// 		var msgBox = messages.get(0);
// 		while (msgBox.childNodes.length > 1000) {
// 			msgBox.removeChild(msgBox.firstChild);
// 		}
// 		msgBox.scrollTop = msgBox.scrollHeight;
// 	}

// 	WebSocketClient = {
// 		init: function() {
// 			serverUrl = $('#serverUrl');
// 			connectionStatus = $('#connectionStatus');
// 			sendMessage = $('#sendMessage');
			
// 			connectButton = $('#connectButton');
// 			disconnectButton = $('#disconnectButton'); 
// 			sendButton = $('#sendButton');
			
// 			connectButton.click(function(e) {
// 				close();
// 				open();
// 			});
		
// 			disconnectButton.click(function(e) {
// 				close();
// 			});
			
// 			sendButton.click(function(e) {
// 				var msg = $('#sendMessage').val();
// 				addMessage(msg, 'SENT');
// 				ws.send(msg);
// 			});
			
// 			$('#clearMessage').click(function(e) {
// 				clearLog();
// 			});
			
// 			var isCtrl;
// 			sendMessage.keyup(function (e) {
// 				if(e.which == 17) isCtrl=false;
// 			}).keydown(function (e) {
// 				if(e.which == 17) isCtrl=true;
// 				if(e.which == 13 && isCtrl == true) {
// 					sendButton.click();
// 					return false;
// 				}
// 			});
// 		}
// 	};
// }

// $(function() {
// 	WebSocketClient.init();
// });






	var special_keys = [112, 113, 114, 115, 117, 118, 119, 120, 121, 16, 18, 2, 20, 27, 37, 38, 39, 4, 40, 8, 93, 91];
	var objects = new Array();
	var already_loaded = false;
	var connection;

	$(function() {
		var nickname = prompt("Choose a nickname")
		if (nickname) {
			connection = new WebSocket("ws://localhost:8001")
			// connection = new WebSocket("ws://"+window.location.hostname+":8001")
			
			connection.onopen = function() {
				console.log("Connection opened")
				// connection.send(nickname)
				connection.send(JSON.stringify({
          type: 'nickname',
          value: nickname
        }))

				// Send message
				// document.getElementById("form").onsubmit = function (event) {
				// 	var msg = document.getElementById("msg")
				// 	if (msg.value) {
				// 		// connection.send(msg.value)
				// 		connection.send(JSON.stringify({
		  //         type: 'message',
		  //         value: msg.value
		  //       }))
				// 	}
				// 	msg.value = ""
				// 	event.preventDefault()
				// }	

			  // load_jquery();
				// window.setInterval(setup_env, 2000);
				setup_env();
			}

			// Receive message
			connection.onmessage = function (event) {
				// var div = document.createElement("div")
				// div.textContent = event.data
				// document.body.appendChild(div)
				console.log(event.data);
				alert_clients(event.data);
			}

			connection.onclose = function() {
				console.log("Connection closed")
			}

			connection.onerror = function() {
				console.error("Connection error")
			}
		}
	})

	function setup_env() {
		if (!already_loaded) {
		  map_objects();

		  $(document).mousemove(function(event) {
		    var x = event.pageX - 4;
		    var y = event.pageY - 3;
		    var position = "{left : " + x  + ", top  : " + y + "}"
		    var command = "$('#pointer_ema').offset(" + position + ")";
		    connection.send(JSON.stringify({
		      type: 'call_function', 
		      value: command
		    }));
		  });
		  
		  $(document).bind("keydown",function(event) {
		    if ($(':focus') && $(':focus').val()) {
		      var entry = (event.keyCode ? event.keyCode : event.which);
		      if (entry == 13) { //Enter keycode
		        command = "$('form').submit();";
		        connection.send(JSON.stringify({
		          type: 'call_function',
		          value: command
		        }));
		      }
		    }
		  });

		  $(document).bind("keyup",function(event) {
		    if ($(':focus') && $(':focus').val()) {
		      var entry = (event.keyCode ? event.keyCode : event.which);
		      if (entry == 13) { //Enter keycode
		        if ($('#uri_to_go').is(":focus")) {
		          goto_uri($('#uri_to_go').val());
		        } else if ($(':focus').is("input")) {
		          command = "$('form').submit();";
		          connection.send(JSON.stringify({
		            type: 'call_function',
		            value: command
		          }));
		        }
		      }
		      if (!is_special_key(entry)) {
		        entry = $(':focus').val();
		        connection.send(JSON.stringify({
		          type: 'keypressed',
		          value: entry
		        }));
		      }
		    }
		  });

		  $(document).bind("mousewheel DOMMouseScroll",function(event){
		    xy = getScrollXY();
		    var command = "window.scrollTo(" + xy[0] + "," + xy[1] + ");";
		    connection.send(JSON.stringify({
		      type: 'call_function', 
		      value: command
		    }));
		  });

		  $(document).click(clicked_object);
		  already_loaded = true;
		}
	}



	///////////////////////////////////////////////////////
	// 
	// Auxiliary functions
	// 
	function load_jquery() {
	  var newscript = document.createElement('script');
	  newscript.type = 'text/javascript';
	  newscript.async = true;
	  newscript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js';
	  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(newscript);
	}

	function alert_clients(e) {
		var msg = JSON.parse(e);
	  // console.log(e);
	  // console.log(msg);
	  switch (msg.type) {
	    case "call_function":
	      eval(msg.value);
	      break;
	    
	    case "clicked_object":
	      // Check if object has 'onClick' property 
	      var clicked_object = objects[msg.value];
	      var function_called = clicked_object.attr('onClick');
	      if (function_called) {
	        eval(function_called);
	        // console.log('function_called: '+ function_called);
	      } else {
	        clicked_object.focus();
	        // console.log("changing focus to: " + clicked_object);
	      }
	      break;
	    
	    case "keypressed":
	      $(document.activeElement).val(msg.value);
	      break;

	    case "message":
				var div = document.createElement("div");
				div.textContent = msg.value;
				document.body.appendChild(div);
	      break;

	    default:
	      console.log("Don't know what to do with the type of message " + msg.type + "with value " + msg.value);
	  }
	}
	  
	function clicked_object(event) {
	  var clicked_span = $(event.target);
	  // console.log(clicked_span);
	  $.each(objects, function(i, val) {
	    if (objects[i].data() === clicked_span.data()) {
	      connection.send(JSON.stringify({
	        type: 'clicked_object', 
	        value: i
	      }));
	      return false;
	    }
	  }); 
	}

	function getScrollXY() {
	  var scrOfX = 0, scrOfY = 0;
	  if( typeof( window.pageYOffset ) == 'number' ) {
	    //Netscape compliant
	    scrOfY = window.pageYOffset;
	    scrOfX = window.pageXOffset;
	  } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
	    //DOM compliant
	    scrOfY = document.body.scrollTop;
	    scrOfX = document.body.scrollLeft;
	  } else if( document.documentElement && ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
	    //IE6 standards compliant mode
	    scrOfY = document.documentElement.scrollTop;
	    scrOfX = document.documentElement.scrollLeft;
	  }
	  return [ scrOfX, scrOfY ];
	}

	function is_special_key(key) {
	  return $.inArray(key, special_keys) > -1;
	}

	function map_objects() {
	  $('*').each(function(i) {
	    objects[i] = $(this);
	  });
	}

	function goto_uri(uri) {
	  $.getJSON('http://whateverorigin.org/get?url=' + encodeURIComponent(uri) + '&callback=?',
	    function(data){
	      save_jquery();
	      $("#inner_content").html(data.contents);
	      load_jquery();
	      setup_env(); 
	  });
	}

