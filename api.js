// MIT License here.
var fs = require("fs");
var Steam = require("steam");

var _users = [];
if(fs.existsSync("./users.json")) {
  _users = JSON.parse(fs.readFileSync("./users.json"));
} else {
  throwError(true, "Users file not found.", "Did you delete the users.json file?");
}

exports.throwError = function(fatal, error, description) {
  //fatal is a bool, error and description are strings.
  if(fatal) {
    console.log("-------- FATAL ERROR --------");
    console.log("%s : %s", error, description);
    process.exit(1); //Exit with an error code.
  } else {
    console.log("-Whoops!- (Non-fatal error)");
    console.log("%s : %s", error, description);
  }
}
///////////////// Steam Functions /////////////////
/*exports.sendSteamMessageAnnoucement = function(bot, accesslevel, message) {
  //Bot is the steambot, accesslevel is an int, message is a string.
  for(user in _users) {
    if(_users[user.permissions] == accesslevel) {
      //Check if access level is what we want. If so, send the annoucement.
      bot.sendMessage(user, message, Steam.EChatEntryType.ChatMsg);
    }
  }
  console.log("{Message Annoucement} Sent annoucement: %s to user level: %s", message, accesslevel);
}*/
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
  var access = "0"; //If theyre not on the user list, give them access of zero.
  for(var i = 0; i < _users.users.length; i++) {
    //console.log(_users.users[i]);
    if(_users.users[i].SteamID64 == source) {
      access = _users.users[i].permission;
    }
  }
  return access;
}
exports.addDonorToList = function(client, numOfKeys) {
  // Client is the steam64, numOfKeys is the number of keys they sent in.
  // I really want to sourcepawn this javascript and do !client :-(

  //Set our variables.
  var months = numOfKeys / 3;
  var name = getNameOfClient(client);
  var message = name +" (" +client+ ") Keys: " +numOfKeys+ " Months: " +months+ "\n";

  //Small check regarding the donor file.
  var donor_file_exists = ((fs.existsSync("./donors.txt")) ? true : false);
  if(donor_file_exists)
    console.log("{Donor Event} Created donor file.");

  //IF EXISTS update ELSE create (Why am I doing mySQL comments?)
  fs.appendFile("donors.txt", message, function(err) {
    if(err)
      throw err; // I too like to live dangeriously.
    console.log("{Donor Event} Added donor: %s (%s), months: %s", client, name, months);
  });
}
///////////////// HTTP Functions /////////////////
exports.parseSteamIds = function(list) {
  //This function expects all the steamids from the query, seperated by commas.
  var output = list.split(",");
  return output;
}
