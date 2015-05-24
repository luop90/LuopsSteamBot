/***********************
* This is the main file for the bot.
* TO EXECUTE-
*   - Install NodeJS
*   - Install Node Package Manager (npm).
*   - Install steamkit (npm install steam)
*   - Install express (npm install express --save)
*   - *****OPTIONAL***** Install forever (npm install forever -g) - This allows it to automadically restart should it crash.
*   - Edit config_example.json with information related to the server/bot, rename to config.json
*   - Run the script (node luopbot.js) or, if you installed forever use that. (forever start luopbot.js)
*   - ???
*   - Profit!
* <insert MIT license here>
*
************************/
var Steam = require("steam");
var fs = require("fs");
var http = require("http");
var express = require("express");
var app = new express();
var api = require("./api.js");
var Chat = require("./chat_commands.js");

var _config = [];

//Set the config file up.
if(fs.existsSync("./config.json")) {
  _config = JSON.parse(fs.readFileSync("./config.json"));
} else {
  throwError(true, "Config file not found", "Did you remember to rename config_example.json to config.json?");
}

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
    api.sendSteamMessage(bot, source, _config.steam.bot_welcomemessage);
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
/* Valid API:
- To Ready UP: /?apikey=DCBAC29915216B45838FCDA6FDBA8&type=readyup&steamids=76561198071430088&lobbynumber=115664
- To Start Lobby: /?apikey=DCBAC29915216B45838FCDA6FDBA8&type=lobbystart&steamids=76561198071430088&lobbynumber=115664&serverinfo=127.0.0.1:27015&password=luoprocks
- To send a message annoucement (Not ready yet!): /?apikey=DCBAC29915216B45838FCDA6FDBA8&type=messageannoucement&message=luop+is+the+besterest+person&accesslevel=0

*/
app.get("/", function(req, res) {
  //The only thing required for every request is the type and the API key. Other variables are expected depending on the type.
  var api_key = req.query.apikey;
  var type = req.query.type;
  console.log("{Query Event} New query: ");
  console.log(req.query);
  //res.send(req.query);
  //return;

  if(api_key != _config.server.apikey) { //Check the API Key.
    console.log("{Query Event} Unauthorized query blocked. Invalid API Key: %s", api_key);
    res.sendStatus(403); //Give them a 403 error - wrong API key.
  } else {
    switch(type) {
      case "readyup":
        //Get our variables.
        var steamids = api.parseSteamIds(req.query.steamids);
        var lobby_number = req.query.lobbynumber;

        //Set up the message.
        var message = "Lobby #" + lobby_number + " is readying up! https://tf2center.com/lobbies/" + lobby_number;

        //Send the message.
        for(steamid in steamids) {
          api.sendSteamMessage(bot, steamids[steamid], message);
        }

        // Successfully sent.
        res.sendStatus(200);
        console.log("{Query Event} Query successful.");
        break;
      case "lobbystart":
        //Variables.
        var steamids = api.parseSteamIds(req.query.steamids);
        var lobby_number = req.query.lobbynumber;
        var server_address = req.query.serverinfo;
        var server_password = req.query.password;
        //Format message.
        var message = "Lobby #" + lobby_number + " has started! steam://connect/" + server_address + "/" + server_password;
        //Send the message.
        for(steamid in steamids) {
          api.sendSteamMessage(bot, steamids[steamid], message);
        }
        //Successfully sent.
        res.sendStatus(200);
        console.log("{Query Event} Query successful.");
        break;
      /*case "messageannoucement"

        res.send(200);
        break;*/
    }
  }
});
var _port = _config.server.port;
var _hostname = _config.server.hostname;
var server = app.listen(_port, _hostname, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Server set up on  %s:%s", host, port);
});
