var api = require("./api.js");

var PERMISSION = {
  "USER": 0,
  "MEMBER": 1,
  "MODERATOR": 2,
  "ADMIN": 3,
  "STAFF": 4,
  "ROOT": 5
}
var ACCESSLEVEL = {
  0: "USER",
  1: "MEMBER",
  2: "MODERATOR",
  3: "ADMIN",
  4: "STAFF",
  5: "ROOT"
}
function command(trigger, output, access) {
  this.trigger = trigger;
  this.output = output;
  this.access = access;
}

exports.getChatResponse = function(source, message) {
  var output = "";
  var is_command = ((message.substring(0, 1) == "!") ? true : false);
  var user_access = api.getUserAccessLevel(source);
  //console.log(user_access); //This was for testing.
  if(is_command == true) {
    // This is a command.
    for(command in _commands) {
      if(message.toLowerCase().trim() == _commands[command].trigger) {
        if(user_access >= _commands[command].access) {
          output = _commands[command].output;
        } else {
          output = "You do not have access to this command. (Access level needed: " + _commands[command].access + " | Current access level: " + user_access + ")";
        }
        // Imma just pretend that, I, idk, didnt derp this up real bad :ph34r:
      }
    }
  }
  return output;
}
var _commands = [
  new command("!ping", "PONG", PERMISSION.USER),
  new command("!pong", "PING", PERMISSION.USER),
  new command("!help", "You have access to: 2 commands: !ping and !pong", PERMISSION.USER),
  new command("!about", "Created by Luop90 using NodeJS.", PERMISSION.USER)
];
