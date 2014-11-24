// var url = "ws://localhost:8001";
var url = "ws://floating-ocean-5528.herokuapp.com";
var ws = null;
var already_loaded = false;
var nickname = '';
var special_keys = [112, 113, 114, 115, 117, 118, 119, 120, 121, 16, 18, 2, 20, 27, 37, 38, 39, 4, 40, 8, 93, 91];
var unique_id = '';
var connected = false;
var listening_to_actions = false;
var mouse_position = '';
var last_mouse_position = '';
var current_slide = '';

$(document).ready(function() {
  prepare_communication_with_page();
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
  // $('body').prepend('<div>   <label>User name:</label>   <input type="text" id="nickname" autocomplete="on" value=""/>   <button id="connectButton">Open</button>   <button id="disconnectButton" style="display: none;">Close</button>   <label>Status:</label>   <span id="connectionStatus">CLOSED</span> </div>');
  // $('body').prepend('<div style="position:absolute; left:31%">   <button id="previous_slide">Previous</button>   <input type="text" id="current_slide" value="1"/>   <button id="next_slide">Next</button>  <label>User name:</label>   <input type="text" id="nickname" autocomplete="on" value=""/>   <button id="connectButton">Open</button>   <button id="disconnectButton" style="display: none;">Close</button>   <label>Status:</label>   <span id="connectionStatus">CLOSED</span> </div>');
  // $('body').prepend('<div style="position:absolute; left:31%">   <button id="previous_slide">Previous</button>     <button id="next_slide">Next</button>  <label>User name:</label>   <input type="text" id="nickname" autocomplete="on" value=""/>   <button id="connectButton">Open</button>   <button id="disconnectButton" style="display: none;">Close</button>   <label>Status:</label>   <span id="connectionStatus">CLOSED</span> </div>');
  $('body').prepend('<div style="position:absolute; left:39%">   <button id="connectButton" style="margin-right:120px;">Connect</button>   <button id="disconnectButton" style="display: none;margin-right:105px;">Disconnect</button>   <button id="previous_slide">Previous</button>     <button id="next_slide">Next</button>   </div>');
  $('body').append('<img style="pointer-events: none; z-index: 9999" id="pointer_ema" width="15px" src="' + cursor_img + '"/> ');
  $('#pointer_ema').hide();

  
  function correct_position_slides() {
    $('#stageArea').css('top', 20);
  }
  window.setInterval(correct_position_slides, 500);


  function jump_num_slides(num_slides) {
    command_to_page = 'gShowController.currentSlideIndex';
    eval_on_page_data(command_to_page, function(current_slide) {
      slide_to_go = current_slide + num_slides + 1;
      goto_slide = 'location.href="javascript:gShowController.jumpToSlide(' + slide_to_go + '); void 0";'
      eval(goto_slide);

      if (connected) {
        msg = create_message('call_function', goto_slide);
        console.log(msg.value);
        ws.send(msg);
      }
    });
    return false;    
  }

  $('#previous_slide').on('click', function() {
    jump_num_slides(-1);
    return false;
  });

  $('#next_slide').on('click', function() {
    jump_num_slides(1);
    return false;
  });


  var open = function() {
      ws = new WebSocket(url);
      ws.onopen = onOpen;
      ws.onclose = onClose;
      ws.onmessage = onMessage;
      ws.onerror = onError;

      connectionStatus.text('OPENING ...');
      serverUrl.attr('disabled', 'disabled');
      connectButton.hide();
      disconnectButton.show();
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
    if (msg.id != unique_id) {
      $('#pointer_ema').show();
      act_on_me(msg);
    } else {
      $('#pointer_ema').hide();
    }
  };
  
  var onError = function(event) {
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
        return false;
      });
    
      disconnectButton.click(function(e) {
        close();
        return false;
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
  window.clearTimeout(send_mouse_position_timer_ID);
  $(document).off('keydown.share_screen_namespace');
  $(document).off('keyup.share_screen_namespace');
  $(document).off('mousewheel.share_screen_namespace DOMMouseScroll.share_screen_namespace');
  $(document).off('click.share_screen_namespace');
}


function start_listen_to_actions() {
  $(document).on('mousemove.share_screen_namespace', function(event) {
    var x = event.pageX - 4;
    var y = event.pageY - 3;
    mouse_position = "{left : " + x  + ", top  : " + y + "}"
  });
  function send_mouse_position() {
    if (mouse_position != last_mouse_position) {
      var command = "$('#pointer_ema').offset(" + mouse_position + ")";
      // console.log({type: 'call_function', value: command});
      msg = create_message('call_function', command);
      ws.send(msg);
      last_mouse_position = mouse_position;
    }
  }
  send_mouse_position_timer_ID = window.setInterval(send_mouse_position, 100);

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

  $(document).on('mousewheel.share_screen_namespace DOMMouseScroll.share_screen_namespace', function(event) {
    xy = getScrollXY();
    var command = "window.scrollTo(" + xy[0] + "," + xy[1] + ");";
    msg = create_message('call_function', command);
    ws.send(msg);
  });

  $(document).on('click.share_screen_namespace', function(event) {
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



// 
// Comunication between page and content script variables and functions
// 

function prepare_communication_with_page() {
  // Prepare page environment to the communication
  location.href = "javascript:   " +
  "  window.addEventListener('message', function(event) {" +
  "    if (event.source != window) {" +
  "      return;" +
  "    }" +
  "    msg = event.data;" +
  "    if (msg.origin && (msg.origin == 'FROM_CONTENTSCRIPT')) {" +
  "      rs = eval(msg.value);" +
  "      msg = {" +
  "        origin: 'FROM_PAGE'," +
  "        value: rs" +
  "      };" +
  "      event.source.postMessage(msg, '*');" +
  "    }" +
  "  }, false); // ; void 0" +
  ";  "
}

// Send a command to the page environment and run locally a function on the result
function eval_on_page_data(command_to_page, command_local) {
  // Wait for the results and run a function locally
  var wait_response = function(param) {
    // Accept only messages from the window
    if (event.source != window)
      return;

    if (event.data.origin && (event.data.origin == "FROM_PAGE")) {
      // console.log("Contentscript received: " + event.data.value);
      command_local(event.data.value);
      window.removeEventListener("message", wait_response, false)
    }
  }

  window.addEventListener("message", wait_response, false)

  // Send command to be run at the page enviroment
  msg = {origin:'FROM_CONTENTSCRIPT', value:command_to_page};
  window.parent.postMessage(msg, "*");
}

