var SteamBot = require('./steambot.js'),
    fs = require('fs'),
    readline = require('readline'),
    express = require('express'),
    app = express(),
    http = require('http').Server(app);

var api = require('./api.js');
var Chat = require('./chat_commands.js');

var _config = [];
var _bots = [];

/**
* Setup readline, so that steamguard can't whine at us.
*/
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//Set the config file up.
if(fs.existsSync('./config.json')) {
  _config = JSON.parse(fs.readFileSync('./config.json'));
} else {
  api.throwError(true, 'Config file not found', 'Did you remember to rename config_example.json to config.json?');
}

// Temp variable for logon details.
var logonDetails1 = {
  "account_name": _config.steam.bot_username,
  "password": _config.steam.bot_password
};

var bot1 = new SteamBot;

bot1.logOn(bot1, logonDetails1, function(bot, status) {
  if (status) {
    bot1 = bot;
    bot1.hookSteamEvents(bot1);
    _bots.push(bot1);
  }
});

/**
* Setup the server for API Calls.
* See ReadMe.md for valid calls.
*/
app.get('/', function(req, res) {
  /**
  * We only care about apikey and type at first.
  * The rest is added on, depending on the type.
  */
  var api_key = req.query.apikey;
  var type = req.query.type;
  console.log('{Query Event} New query: ');
  console.log(req.query);

  if(api_key != _config.server.apikey) { //Check the API Key.
    console.log('{Query Event} Unauthorized query blocked. Invalid API Key: %s', api_key);
    res.sendStatus(403); //Give them a 403 error - wrong API key.
  } else {
    switch(type) {
      case 'readyup':
        /**
        * Get / parse our variables.
        */
        var steamids = api.parseSteamIds(req.query.steamids);
        var lobby_number = req.query.lobbynumber;

        var message = 'Lobby #' + lobby_number + ' is readying up! https://tf2center.com/lobbies/' + lobby_number;

        //Send the message.
        for (var i = 0; i < steamids.length; i++) {
          api.sendSteamMessage(bot1, steamids[i], message);
        }

        // Successfully sent.
        res.sendStatus(200);
        console.log('{Query Event} Query successful.');
        break;

      case 'lobbystart':
        /**
        * Get / parse our variables.
        */
        var steamids = api.parseSteamIds(req.query.steamids);
        var lobby_number = req.query.lobbynumber;
        var server_address = req.query.serverinfo;
        var server_password = req.query.password;

        var message = 'Lobby #' + lobby_number + ' has started! steam://connect/' + server_address + '/' + server_password;

        //Send the message.
        for (var i = 0; i < steamids.length; i++) {
          api.sendSteamMessage(bot1, steamids[i], message);
        }

        //Successfully sent.
        res.sendStatus(200);
        console.log('{Query Event} Query successful.');
        break;
      case 'addfriend':
        var steamids = api.parseSteamIds(req.query.steamids);

        for (var i = 0; i < steamids.length; i++) {
          bot1.addFriend(steamids[i]); // Send the friend request.
          console.log('{Friend Event} Added %s to friends list.', steamids[i]);
        }

        // Query was successful.
        res.sendStatus(200);
        break;
    }
  }
});
/**
* Grab our server variables.
*/
var _port = _config.server.port;
var _hostname = _config.server.hostname;

/**
* Push the server...
*/
http.listen(_port, function() {
  api.logEvent('system', 'Listening on: ' + _port);
});
