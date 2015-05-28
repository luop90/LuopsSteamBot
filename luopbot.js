/***********************
* This is the main file for the bot.
* TO EXECUTE-
*   - Install NodeJS
*   - Install Node Package Manager (npm).
*   - Install steamkit (npm install steam)
*   - Install steam-trade (npm install npm install git://github.com/seishun/node-steam-trade.git)
*   - Install express (npm install express --save)
*   - *****OPTIONAL***** Install forever (npm install forever -g) - This allows it to automadically restart should it crash.
*   - Edit config_example.json with information related to the server/bot, rename to config.json
*   - Run the script (node luopbot.js) or, if you installed forever use that. (forever start luopbot.js)
*   - ???
*   - Profit!
*
The MIT License (MIT)

Copyright (c) 2015 Lucas Henke

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
************************/
var Steam = require("steam");
var fs = require("fs");
var http = require("http");
var express = require("express");
var app = new express();
var SteamTrade = require("steam-trade");
var readline = require("readline");

var api = require("./api.js");
var Chat = require("./chat_commands.js");

var _config = [];
var _cookies = [];
// Setup readline to read from console.
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//Set the config file up.
if(fs.existsSync("./config.json")) {
  _config = JSON.parse(fs.readFileSync("./config.json"));
} else {
  api.throwError(true, "Config file not found", "Did you remember to rename config_example.json to config.json?");
}

//Create the bot.
var bot = new Steam.SteamClient();
var trade = new SteamTrade(); //Set up the trade.
bot.logOn({
  accountName: _config.steam.bot_username,
  password: _config.steam.bot_password,
  shaSentryfile: (fs.existsSync("sentryfile") ? fs.readFileSync("sentryfile") : undefined)
});
//Successfully logged in.
bot.on("loggedOn", function() {
  console.log("{Bot Status} Bot logged in. :]");
  bot.setPersonaState(Steam.EPersonaState.Online); //Set to online.
  bot.setPersonaName(_config.steam.bot_displayname); //Set the name.
});
//Make sure steamguard doesn't fuck us.
bot.on("sentry",function(sentryHash) {
  fs.writeFile("sentryfile",sentryHash,function(err) {
    if(err){
      console.log(err);
    } else {
      console.log("{Bot Status} Sentry file saved as sentry file. (You should never see this message again.)");
    }
  });
});
bot.on("error", function(e) {
  if (e.eresult == Steam.EResult.AccountLogonDenied) { //Also is Steam Error Code 63.
    // Prompt the user for Steam Guard code
    rl.question("Steam Guard Code: ", function(code) {
      // Try logging on again
      bot.logOn({
          accountName: _config.steam.bot_username,
          password: _config.steam.bot_password,
          authCode: code
      });
    });
  } else {
    console.log("{Bot Status} ERROR: " + e.cause + "|" + e.eresult);
  }
});

//Trade stuff.
var inventory;
var client;
var keys;
var numOfKeys;
var inTrade;
var tradeNumber;
var trade_timer;

bot.on("webSessionId", function(sessionID) {
  console.log("{Bot Status} New session id retrieved: %s", sessionID);
  trade.sessionID = sessionID; //Update this sucka.
  bot.webLogOn(function(cookies) {
    console.log("{Bot Status} Got a new cookie (NOM NOM): %s", cookies);
    cookies.forEach(function(cookie) {
      trade.setCookie(cookie);
    });
  });
});
bot.on("tradeProposed", function(tradeID, steamID) {
  console.log("{Trade Event} Trade request from: %s (Trade ID: %s)", steamID, tradeID);
  var tradeNumber = tradeID;
  bot.respondToTrade(tradeID, true);
});
trade.on("sessionStart", function(source) {
  //Clear out variables per session.
  invetory = [];
  keys = [];
  numOfKeys = 0;
  client = source;
  inTrade = true;

  trade.open(client); //Open the trade.
  console.log("{Trade Event} Opened trade from: %s", client);
  bot.setPersonaState(Steam.EPersonaState.Busy); //Set to busy.

  //Set up our timer.
  trade.ChatMsg("The trade will be canceled in 120 seconds if it has not been completed by then.");
  trade_timer = setTimeout(function() {
    trade.ChatMsg("The trade took too long. Canceling...");
    trade.cancel();
  }, 120 * 1000); //2 minutes in milliseconds.
});
trade.on("offerChanged", function(added, item) {
  console.log(item.name); //will be removed once testing is over.
  console.log(added);
  if(item.name == "Mann Co. Supply Crate Key") {
    numOfKeys += added ? 1 : -1; //Added is a bool.
    console.log("{Trade Event} " + (added ? "Key added." : "Key removed."));
  } else {
    trade.ChatMsg("Only keys will get you donation benefits. Any other item given is not counted towards this.");
    console.log("{Trade Event} Another item was " + (added ? "added" : "removed"));
  }
});
trade.on("ready", function() {
  if(numOfKeys % 3 == 0 && numOfKeys > 0) { //Divisible by 3, not negative or zero (how would one have negative keys?).
    trade.ready(function() {
      trade.confirm();
    });
  } else {
    trade.chatMsg("Cannot ready the trade. Number of keys must be divisible by 3.");
  }
});
trade.on("end", function(result) {
  console.log("{Trade Event} Trade %s", result);
  inTrade = false;
  bot.setPersonaState(Steam.EPersonaState.Online); //Set back to online.
  clearTimeout(trade_timer);
  //api.sendSteamMessage(bot, client, _config.steam.bot_endtrademessage);
  if(result == "success") {
    api.sendSteamMessage(bot, client, _config.steam.bot_endtrademessage);
    api.addDonorToList(client, numOfKeys);
    api.sendSteamMessage(bot, _config.donate.alertSteamID, "A new person has donated! Check donors.txt please =)");
  } else {
    // Well that was disappoiting.
    api.sendSteamMessage(bot, client, "Trade was not a success :'( Click 'Invite to Trade' to try again.");
  }
});

//Hook friend events.
bot.on("friend", function(source, status) {
  //Add pending invite
  if(status == Steam.EClanRelationship.Invited) {
    bot.addFriend(source); //Accept the friend request.
    //api.addUser(source, 0); //Add steamid to the user list.
    api.sendSteamMessage(bot, source, _config.steam.bot_welcomemessage);
    console.log("{Friend Event} Added %s to friends list.", source);
  }
  //Log someone removing the bot from their friends list :'(
  else if(status == Steam.EFriendRelationship.None) {
    //api.removeUser(source); //Remove steamid from the user list.
    console.log("{Friend Event} %s removed from friends list.", source);
  }
  else {
    console.log("{Friend Event} Other friend event occured. (User: %s) (Event: %s)", source, status);
  }
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
  //res.sendStatus(100); //The query has been recieved.
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
  console.log("{Bot Status} Server set up on %s:%s", host, port);
});
