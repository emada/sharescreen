// var url = "ws://localhost:8001";
var url = "ws://floating-ocean-5528.herokuapp.com";
var ws = null;
var already_loaded = false;
var nickname = '';
var special_keys = [112, 113, 114, 115, 117, 118, 119, 120, 121, 16, 18, 2, 20, 27, 37, 38, 39, 4, 40, 8, 93, 91];
var unique_id = '';
var connected = false;
var listening_to_actions = false;


$(document).ready(function() {
  WebSocketClient.init();
});

new function() {
  // var ws = null;
  // var connected = false;

  var nickname;
  var serverUrl;
  var connectionStatus;
  var sendMessage;
  
  var connectButton;
  var disconnectButton; 
  var sendButton;

  // Insert command bar on top of the page
  var cursor_img = chrome.extension.getURL("resources/cursor_pointer.png");
  $('body').prepend('<div>   <label>User name:</label>   <input type="text" id="nickname" autocomplete="on" value=""/>   <button id="connectButton">Open</button>   <button id="disconnectButton" style="display: none;">Close</button>   <label>Status:</label>   <span id="connectionStatus">CLOSED</span> </div>');
  $('body').append('<img style="pointer-events: none; z-index: 9999" id="pointer_ema" width="15px" src="' + cursor_img + '"/> ');
  $('#pointer_ema').hide();


  var open = function() {
    // try {
      ws = new WebSocket(url);
    // }
    // catch(err) {
      // console.log(err);
      // ws = null;
    // }

    // if (ws) {
      ws.onopen = onOpen;
      ws.onclose = onClose;
      ws.onmessage = onMessage;
      ws.onerror = onError;

      connectionStatus.text('OPENING ...');
      serverUrl.attr('disabled', 'disabled');
      connectButton.hide();
      disconnectButton.show();
    // }
  }
  
  var close = function() {
    if (ws) {
      console.log('CLOSING ...');
      ws.close();
      $('#pointer_ema').hide();
      stop_listen_to_actions();
    }
    connected = false;
    connectionStatus.text('CLOSED');

    serverUrl.removeAttr('disabled');
    connectButton.show();
    disconnectButton.hide();
    sendMessage.attr('disabled', 'disabled');
    sendButton.attr('disabled', 'disabled');
    $('#pointer_ema').hide();
  }
  
  var clearLog = function() {
    $('#messages').html('');
  }
  
  var onOpen = function() {
    connected = true;
    connectionStatus.text('OPENED');
    sendMessage.removeAttr('disabled');
    sendButton.removeAttr('disabled');

    unique_id = guid();

    console.log("Connection with websocket opened")
    msg = create_message('nickname', nickname.val());
    ws.send(msg);

    start_listen_to_actions();
  };
  
  var onClose = function() {
    console.log('CLOSED: ' + serverUrl.val());
    ws = null;
    // stop_listen_to_actions();
    // $('#pointer_ema').hide();
    close();
  };
  
  var onMessage = function(event) {
    var msg = JSON.parse(event.data);
    // if (msg.id != unique_id) {
      $('#pointer_ema').show();
      act_on_me(msg);
    // } else {
      // $('#pointer_ema').hide();
    // }
  };
  
  var onError = function(event) {
    // alert(event.data);
    alert('Could not connect to the server! Aborting!');
    close();
  }
  
  var addMessage = function(data, type) {
    var msg = $('<pre>').text(data);
    if (type === 'SENT') {
      msg.addClass('sent');
    }
    var messages = $('#messages');
    messages.append(msg);
    
    var msgBox = messages.get(0);
    while (msgBox.childNodes.length > 1000) {
      msgBox.removeChild(msgBox.firstChild);
    }
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  WebSocketClient = {
    init: function() {
      nickname = $('#nickname');
      serverUrl = $('#serverUrl');
      connectionStatus = $('#connectionStatus');
      sendMessage = $('#sendMessage');
      
      connectButton = $('#connectButton');
      disconnectButton = $('#disconnectButton'); 
      sendButton = $('#sendButton');
      
      connectButton.click(function(e) {
        close();
        open();
      });
    
      disconnectButton.click(function(e) {
        close();
      });
      
      sendButton.click(function(e) {
        var msg = $('#sendMessage').val();
        addMessage(msg, 'SENT');
        ws.send(msg);
      });
      
      $('#clearMessage').click(function(e) {
        clearLog();
      });
      
      var isCtrl;
      sendMessage.keyup(function (e) {
        if(e.which == 17) isCtrl=false;
      }).keydown(function (e) {
        if(e.which == 17) isCtrl=true;
        if(e.which == 13 && isCtrl == true) {
          sendButton.click();
          return false;
        }
      });
    }
  };
}




// 
// Apply actions on the current page
// 
function act_on_me(msg) {
  switch (msg.type) {
    case "call_function":
      eval(msg.value);
      break;
    
    case "clicked_object":
      // Check if object has 'onClick' property 
      var clicked_object = $(msg.value);
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
      // console.log(msg);
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


function stop_listen_to_actions() {
  $(document).off('mousemove.share_screen_namespace');
  $(document).off('keydown.share_screen_namespace');
  $(document).off('keyup.share_screen_namespace');
  // $(document).off('mousewheel.share_screen_namespace DOMMouseScroll.share_screen_namespace');
  $(document).off('click.share_screen_namespace');
}


function start_listen_to_actions() {
  // $(document).mousemove(function(event) {
  $(document).on('mousemove.share_screen_namespace', function(event) {
    var x = event.pageX - 4;
    var y = event.pageY - 3;
    var position = "{left : " + x  + ", top  : " + y + "}"
    var command = "$('#pointer_ema').offset(" + position + ")";
    // console.log({type: 'call_function', value: command});
    msg = create_message('call_function', command);
    ws.send(msg);
  });
  
  // $(document).bind("keydown",function(event) {
  $(document).on('keydown.share_screen_namespace', function(event) {
    if ($(':focus') && $(':focus').val()) {
      var entry = (event.keyCode ? event.keyCode : event.which);
      if (entry == 13) { //Enter keycode
        command = "$('form').submit();";
        msg = create_message('call_function', command);
        ws.send(msg);
      }
    }
  });

  // $(document).bind("keyup",function(event) {
  $(document).on('keyup.share_screen_namespace', function(event) {
    if ($(':focus') && $(':focus').val()) {
      var entry = (event.keyCode ? event.keyCode : event.which);
      if (entry == 13) { //Enter keycode
        if ($('#uri_to_go').is(":focus")) {
          goto_uri($('#uri_to_go').val());
        } else if ($(':focus').is("input")) {
          command = "$('form').submit();";
          msg = create_message('call_function', command);
          ws.send(msg);
        }
      }
      if (!is_special_key(entry)) {
        entry = $(':focus').val();
        msg = create_message('keypressed', entry);
        ws.send(msg);
      }
    }
  });

  // $(document).on('mousewheel.share_screen_namespace DOMMouseScroll.share_screen_namespace', function(event) {
  // $(document).bind("mousewheel DOMMouseScroll",function(event){
  //   xy = getScrollXY();
  //   var command = "window.scrollTo(" + xy[0] + "," + xy[1] + ");";
  //   msg = create_message('call_function', command);
  //   ws.send(msg);
  // });

  $(document).on('click.share_screen_namespace', function(event) {
  // $(document).click(function(event) {
    var clicked_span = $(event.target).getPath();
    msg = create_message('clicked_object', clicked_span);
    ws.send(msg);
  });
}




///////////////////////////////////////////////////////
// 
// Auxiliary functions
// 
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

jQuery.fn.getPath = function () {
    if (this.length != 1) throw 'Requires one element.';

    var path, node = this;
    while (node.length) {
        var realNode = node[0], name = realNode.localName;
        if (!name) break;
        name = name.toLowerCase();

        var parent = node.parent();

        var siblings = parent.children(name);
        if (siblings.length > 1) { 
            name += ':eq(' + siblings.index(realNode) + ')';
        }

        path = name + (path ? '>' + path : '');
        node = parent;
    }

    return path;
};

var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

function create_message(type_val, value_val) {
  msg = {type: type_val, value: value_val, id: unique_id};
  return JSON.stringify(msg);
}









// vvvvvvv FUNFANDO vvvvvvvvv

// // background -> aqui
// // - escutar por porta aberta pelo contentscript
// // - executar ações de acordo com as mensagens que chegam do contentscript

// if (!already_loaded) {

//   // Insert command bar on top of the page
//   var cursor_img = chrome.extension.getURL("resources/cursor_pointer.png");
//   $('body').prepend('<img style="pointer-events: none; z-index: 9999" id="pointer_ema" width="15px" src="' + cursor_img + '" /> <div>   <label>User name:</label>   <input type="text" id="username" autocomplete="on" value=""/>   <button id="connectButton">Open</button>   <button id="disconnectButton">Close</button>   <label>Status:</label>   <span id="connectionStatus">CLOSED</span> </div> ');


//   connection = new WebSocket("ws://localhost:8001")

//   // if (!nickname) {  
//     nickname = prompt("Choose a nickname");
//   // } else {
    

//     connection.onopen = function() {
//       console.log("Connection with websocket opened")
//       connection.send(JSON.stringify({type: 'nickname', value: nickname}));

//       setup_env();
//     }
//   // }




//   // Act on received message
//   connection.onmessage = function (event) {
//     var msg = JSON.parse(event.data);
//     console.log(msg);
//     act_on_me(msg)
//   }



//   connection.onclose = function() {
//     console.log("Connection closed")
//   }


//   connection.onerror = function() {
//     console.error("Connection error")
//   }





//   function act_on_me(msg) {
//     switch (msg.type) {
//       case "call_function":
//         eval(msg.value);
//         break;
      
//       case "clicked_object":
//         // Check if object has 'onClick' property 
//         // var clicked_object = objects[msg.value];
//         var clicked_object = $(msg.value);
//         var function_called = clicked_object.attr('onClick');
//         if (function_called) {
//           eval(function_called);
//           console.log('function_called: '+ function_called);
//         } else {
//           clicked_object.focus();
//           console.log("changing focus to: " + clicked_object);
//         }
//         break;
      
//       case "keypressed":
//         $(document.activeElement).val(msg.value);
//         console.log(msg);
//         break;

//       case "message":
//         var div = document.createElement("div");
//         div.textContent = msg.value;
//         document.body.appendChild(div);
//         break;

//       default:
//         console.log("Don't know what to do with the type of message " + msg.type + "with value " + msg.value);
//     }
//   }

//   setup_env();
// }




// function setup_env() {
//   if (already_loaded) {
//     return;
//   }

//   // map_objects();

//   $(document).mousemove(function(event) {
//     var x = event.pageX - 4;
//     var y = event.pageY - 3;
//     var position = "{left : " + x  + ", top  : " + y + "}"
//     var command = "$('#pointer_ema').offset(" + position + ")";
//     // console.log({type: 'call_function', value: command});
//     connection.send(JSON.stringify({type: 'call_function', value: command}));
//   });
  
//   $(document).bind("keydown",function(event) {
//     if ($(':focus') && $(':focus').val()) {
//       var entry = (event.keyCode ? event.keyCode : event.which);
//       if (entry == 13) { //Enter keycode
//         command = "$('form').submit();";
//         connection.send(JSON.stringify({type: 'call_function',value: command}));
//       }
//     }
//   });

//   $(document).bind("keyup",function(event) {
//     if ($(':focus') && $(':focus').val()) {
//       var entry = (event.keyCode ? event.keyCode : event.which);
//       if (entry == 13) { //Enter keycode
//         if ($('#uri_to_go').is(":focus")) {
//           goto_uri($('#uri_to_go').val());
//         } else if ($(':focus').is("input")) {
//           command = "$('form').submit();";
//           connection.send(JSON.stringify({type: 'call_function',value: command}));
//         }
//       }
//       if (!is_special_key(entry)) {
//         entry = $(':focus').val();
//         connection.send(JSON.stringify({type: 'keypressed',value: entry}));
//       }
//     }
//   });

//   // $(document).bind("mousewheel DOMMouseScroll",function(event){
//   //   xy = getScrollXY();
//   //   var command = "window.scrollTo(" + xy[0] + "," + xy[1] + ");";
//   //   connection.send(JSON.stringify({type: 'call_function', value: command}));
//   // });

//   $(document).click(function(event) {
//     // var clicked_span = $(event.target);
//     // console.log(clicked_span);
//     // $.each(objects, function(i, val) {
//     //   if (objects[i].data() === clicked_span.data()) {
//     //     connection.send(JSON.stringify({type: 'clicked_object', value: i}));
//     //     return false;
//     //   }
//     // });
//     var clicked_span = $(event.target).getPath();
//     connection.send(JSON.stringify({type: 'clicked_object', value: clicked_span}));
//   });

//   already_loaded = true;
// }



// ///////////////////////////////////////////////////////
// // 
// // Auxiliary functions
// // 
// function load_jquery() {
//   var newscript = document.createElement('script');
//   newscript.type = 'text/javascript';
//   newscript.async = true;
//   newscript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js';
//   (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(newscript);
// }

// function getScrollXY() {
//   var scrOfX = 0, scrOfY = 0;
//   if( typeof( window.pageYOffset ) == 'number' ) {
//     //Netscape compliant
//     scrOfY = window.pageYOffset;
//     scrOfX = window.pageXOffset;
//   } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
//     //DOM compliant
//     scrOfY = document.body.scrollTop;
//     scrOfX = document.body.scrollLeft;
//   } else if( document.documentElement && ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
//     //IE6 standards compliant mode
//     scrOfY = document.documentElement.scrollTop;
//     scrOfX = document.documentElement.scrollLeft;
//   }
//   return [ scrOfX, scrOfY ];
// }

// function is_special_key(key) {
//   return $.inArray(key, special_keys) > -1;
// }

// // function map_objects() {
// //   $('*').each(function(i) {
// //     objects[i] = $(this);
// //   });
// // }


// jQuery.fn.getPath = function () {
//     if (this.length != 1) throw 'Requires one element.';

//     var path, node = this;
//     while (node.length) {
//         var realNode = node[0], name = realNode.localName;
//         if (!name) break;
//         name = name.toLowerCase();

//         var parent = node.parent();

//         var siblings = parent.children(name);
//         if (siblings.length > 1) { 
//             name += ':eq(' + siblings.index(realNode) + ')';
//         }

//         path = name + (path ? '>' + path : '');
//         node = parent;
//     }

//     return path;
// };
