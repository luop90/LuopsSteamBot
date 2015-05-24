// MIT License here.
var fs = require("fs");
var Steam = require("steam");

var _users = [];
if(fs.existsSync("./users.json")) {
  _users = JSON.parse(fs.readFileSync("./users.json"));
} else {
  throwError(true, "Users file not found.", "Did you delete the users.json file?");
}

throwError = function(fatal, error, description) {
  //fatal is a bool, error and description are strings.
  if(fatal) {
    console.log("-------- FATAL ERROR --------");
    console.log("%s : %s", error, description);
    process.exit(1);
  } else {
    console.log("-Whoops!- (Non-fatal error)");
    console.log("%s : %s");
  }
}
///////////////// Steam Functions /////////////////
exports.sendSteamMessageAnnoucement = function(bot, accesslevel, message) {
  //Bot is the steambot, accesslevel is an int, message is a string.
  for(user in _users) {
    if(user.permissions == accesslevel) {
      //Check if access level is what we want. If so, send the annoucement.
      bot.sendMessage(user, message, Steam.EChatEntryType.ChatMsg);
    }
  }
  console.log("{Message Annoucement} Sent annoucement: %s to user level: %s", message, accesslevel);
}
exports.sendSteamMessage = function(bot, user, message) {
  // Bot is the steambot, user is the steamid, message is a string.
  var output = message; //Incase we ever want to format this sucka.
  bot.sendMessage(user, output, Steam.EChatEntryType.ChatMsg);
  console.log("{Message Event} Message sent to: %s - Content: %s", user, message);
}
exports.createSteamAlertAnnoucement = function(bot, message) {
  //Bot is the steambot, message is the content of the steam alert.

  console.log("{Steam Annoucement} Annoucement: %s posted.");
}
///////////////// User Functions /////////////////
exports.addUser = function(user, accesslevel) {
  // User is the steamid, accesslevel is an int.

}
exports.removeUser = function(user) {
  // User is the steamid.
}
exports.getUserAccessLevel = function(source){
  //User is the steamid.
  var access = "unknown";
  for(var i = 0; i < _users.users.length; i++) {
    //console.log(_users.users[i]);
    if(_users.users[i].SteamID64 == source) {
      access = _users.users[i].permission;
    }
  }
  return access;
}
///////////////// HTTP Functions /////////////////
exports.parseSteamIds()
