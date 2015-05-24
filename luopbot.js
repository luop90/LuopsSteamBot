/***********************
* This is the main file for the bot.
* BEFORE EXECUTING-
*   - Install NodeJS
*   - Install steamkit for nodejs (npm install steam)
*   - Edit config_example.js with username/password, rename to config.js
*   - Run the script (node luopbot.js)
*   - ???
*   - Profit!
* <insert MIT license here>
*
************************/
var Steam = require("steam");
var fs = require("fs");
var http = require("http");
var express = require("express");
var server = new express();
var api = require("./api.js");
var Chat = require("./chat_commands.js");

var _config = [];
//var _users = [];

//Set the config file up.
if(fs.existsSync("./config.json")) {
  _config = JSON.parse(fs.readFileSync("./config.json"));
} else {
  throwError(true, "Config file not found", "Did you remember to rename config_example.json to config.json?");
}
//Set the users file up.
/*if(fs.existsSync("./users.json")) {
  _users = JSON.parse(fs.readFileSync("./users.json"));
} else {
  throwError(true, "Users file not found.", "Did you delete the users.json file?");
}*/

//Create the bot.
var bot = new Steam.SteamClient();
bot.logOn({
  accountName: _config.steam.bot_username,
  password: _config.steam.bot_password
});
//Successfully logged in.
bot.on("loggedOn", function() {
  console.log("{Bot Status} Bot logged in. :]");
  bot.setPersonaState(Steam.EPersonaState.Online); //Set to online.
  bot.setPersonaName(_config.steam.bot_displayname); //Set the name.
});
//Hook friend events.
bot.on("friend", function(source, status) {
  //Add pending invite
  if(status == Steam.EClanRelationship.Invited) {
    bot.addFriend(source); //Accept the friend request.
    api.addUser(source, 0); //Add steamid to the user list.
    console.log("{Friend Event} Added %s to friends list.", source);
  }
  //Log someone removing the bot from their friends list :'(
  else if(status == Steam.EFriendRelationship.None) {
    api.removeUser(source); //Remove steamid from the user list.
    console.log("{Friend Event} %s removed from friends list.", source);
  }
  else {
    console.log("{Friend Event} Other friend event occured. (User: %s) (Event: %s)", source, status);
  }
});
bot.on("error", function(e) {
  //log any errors thrown.
  console.log("Error thrown: " + e);
});
bot.on("message", function(source, message, type, chatter) {
  if(message != "") { //Check its not empty.
    var reply = Chat.getChatResponse(source, message); //Generate our reply.
    if(reply != "")
      api.sendSteamMessage(bot, source, reply); //Send z message.

  } else {
    // wat.
  }
});

//Set up the server.
//We want to match (for testing purposes): /?apikey=DCBAC29915216B45838FCDA6FDBA8&type=readyup&steamids=765,765,765&lobbynumber=115664
server.get("/", function(req, res)) {
  //The only thing required for every request is the type and the API key. Other variables are expected depending on the type.
  var api_key = req.query.apikey;
  var type = req.query.type;
  if(api_key != _config.server.apikey) { //Check the API Key.
    res.send(403); //Give them a 403 error - wrong API key.
  } else {
    switch(type) {
      case "readyup":
        var steamids = api.parseSteamIds(req.query.steamids);
        var lobby_number = req.query.lobbynumber;
        var message = "Lobby #" + lobby_number + " is readying up! https://tf2center.com/lobbies/" + lobby_number;

        break;
      case "lobbystart":
        // Ideas: Retrieve server ip & password. Make a steam://connect/<link>/<password> link in the message.
        var steamids = api.parseSteamIds(req.query.steamids);
        var lobby_number = req.query.lobbynumber;
        var message = "Lobby #" + lobby_number + " has started!";

        break;
      //case "steam+message+annoucement"
    }
  }
  //var steamids = req.query.steamids;
  //var lobbynumber = req.query.lobbynumber;
}
