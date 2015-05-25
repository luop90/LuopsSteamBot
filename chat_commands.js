var api = require("./api.js");
var fs = require("fs");

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

getNewDonors = function() {
  var count = 0;
  var output;
  var file = [];
  if(fs.existsSync("./donors.txt")) {
    file = fs.readFile("./donors.txt");
  } else {
    api.throwError(false, "Donor File Missing", "donors.txt could not be found. Has no one donated? :-(");
  }
  //Go through the lines of 'file' here.

  //Format our return string.
  if(count == 1) //Lets, idk, make this proper grammar or something. (Why is zero plural in this language of England? xD)
    output = "There is currently " + count + " new donor.";
  else
    output = "There are currently " + count + " new donors.";

  return output;
}
get8ballResult = function() {
  var answers = ["Yes", "It is decidely so", "It is certain", "Without a doubt", "You may rely on it", "As I see it, yes", "Most likely", "MasterNoob says yes.", "Better not tell you now", "My reply is no", "My sources say no", "No", "Very doubtful", "Don't count on it.", "GabeN says no.", "When Half-Life 3 comes out, yes."];
  var random = Math.floor(Math.random() * (15 - 0 + 1) + 0); //The formula: (max - min + 1) + min
  return answers[random];
}
var _commands = [
  new command("!ping", "PONG", PERMISSION.USER),
  new command("!pong", "PING", PERMISSION.USER),
  new command("!8ball", get8ballResult(), PERMISSION.USER),
  new command("!help", "Command list: !ping, !pong, !about, !status, !8ball, !help", PERMISSION.USER),
  new command("!about", "Credits: created for TF2Center by Luop90 using NodeJS. This program is completely open-source, head over to Luop's GitHub if you are intersted in viewing it :-)", PERMISSION.USER),
  new command("!status", "All systems GREEN! (Message Luop if you know that reference =D)", PERMISSION.USER),
  new command("!newdonors", getNewDonors(), PERMISSION.STAFF),
];
