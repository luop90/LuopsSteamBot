//Create the bot.
var bot = new Steam.SteamClient();
var trade = new SteamTrade(); //Set up the trade.
bot.logOn({
  accountName: _config.steam.bot_username,
  password: _config.steam.bot_password,
  shaSentryfile: (fs.existsSync('sentryfile') ? fs.readFileSync('sentryfile') : undefined)
});
//Successfully logged in.
bot.on('loggedOn', function() {
  console.log('{Bot Status} Bot logged in. :]');
  bot.setPersonaState(Steam.EPersonaState.Online); //Set to online.
  bot.setPersonaName(_config.steam.bot_displayname); //Set the name.
});
//Make sure steamguard doesn't fuck us.
bot.on('sentry',function(sentryHash) {
  fs.writeFile('sentryfile',sentryHash,function(err) {
    if(err){
      console.log(err);
    } else {
      console.log('{Bot Status} Sentry file saved as sentry file. (You should never see this message again.)');
    }
  });
});
bot.on('servers', function(servers) {
  // Update the servers file, that way we never fail to login.
  fs.writeFile('servers', JSON.stringify(servers));
});
bot.on('error', function(e) {
  if (e.eresult == Steam.EResult.AccountLogonDenied) { //Also is Steam Error Code 63.
    // Prompt the user for Steam Guard code
    rl.question('Steam Guard Code: ', function(code) {
      // Try logging on again
      bot.logOn({
          accountName: _config.steam.bot_username,
          password: _config.steam.bot_password,
          authCode: code
      });
    });
  } else {
    console.log('{Bot Status} ERROR: ' + e.cause + '|' + e.eresult);
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

bot.on('webSessionId', function(sessionID) {
  console.log('{Bot Status} New session id retrieved: %s', sessionID);
  trade.sessionID = sessionID; //Update this sucka.
  bot.webLogOn(function(cookies) {
    console.log('{Bot Status} Got a new cookie (NOM NOM): %s', cookies);
    cookies.forEach(function(cookie) {
      trade.setCookie(cookie);
    });
  });
});
bot.on('tradeProposed', function(tradeID, steamID) {
  console.log('{Trade Event} Trade request from: %s (Trade ID: %s)', steamID, tradeID);
  var tradeNumber = tradeID;
  bot.respondToTrade(tradeID, true);
});
trade.on('sessionStart', function(source) {
  //Clear out variables per session.
  invetory = [];
  keys = [];
  numOfKeys = 0;
  client = source;
  inTrade = true;

  trade.open(client); //Open the trade.
  console.log('{Trade Event} Opened trade from: %s', client);
  bot.setPersonaState(Steam.EPersonaState.Busy); //Set to busy.

  //Set up our timer.
  trade.ChatMsg('The trade will be canceled in 120 seconds if it has not been completed by then.');
  trade_timer = setTimeout(function() {
    trade.ChatMsg('The trade took too long. Canceling...');
    trade.cancel();
  }, 120 * 1000); //2 minutes in milliseconds.
});
trade.on('offerChanged', function(added, item) {
  console.log(item.name); //will be removed once testing is over.
  console.log(added);
  if(item.name == 'Mann Co. Supply Crate Key') {
    numOfKeys += added ? 1 : -1; //Added is a bool.
    console.log('{Trade Event} ' + (added ? 'Key added.' : 'Key removed.'));
  } else {
    trade.ChatMsg('Only keys will get you donation benefits. Any other item given is not counted towards this.');
    console.log('{Trade Event} Another item was ' + (added ? 'added' : 'removed'));
  }
});
trade.on('ready', function() {
  if(numOfKeys % 3 == 0 && numOfKeys > 0) { //Divisible by 3, not negative or zero (how would one have negative keys?).
    trade.ready(function() {
      trade.confirm();
    });
  } else {
    trade.chatMsg('Cannot ready the trade. Number of keys must be divisible by 3.');
  }
});
trade.on('end', function(result) {
  console.log('{Trade Event} Trade %s', result);
  inTrade = false;
  bot.setPersonaState(Steam.EPersonaState.Online); //Set back to online.
  clearTimeout(trade_timer);
  //api.sendSteamMessage(bot, client, _config.steam.bot_endtrademessage);
  if(result == 'success') {
    api.sendSteamMessage(bot, client, _config.steam.bot_endtrademessage);
    api.addDonorToList(client, numOfKeys);
    api.sendSteamMessage(bot, _config.donate.alertSteamID, 'A new person has donated! Check donors.txt please =)');
  } else {
    // Well that was disappoiting.
    api.sendSteamMessage(bot, client, 'Trade was not a success :\'( Click 'Invite to Trade' to try again.');
  }
});

//Hook friend events.
bot.on('friend', function(source, status) {
  //Add pending invite
  if(status == Steam.EClanRelationship.Invited) {
    bot.addFriend(source); //Accept the friend request.
    //api.addUser(source, 0); //Add steamid to the user list.
    api.sendSteamMessage(bot, source, _config.steam.bot_welcomemessage);
    console.log('{Friend Event} Added %s to friends list.', source);
  }
  //Log someone removing the bot from their friends list :'(
  else if(status == Steam.EFriendRelationship.None) {
    //api.removeUser(source); //Remove steamid from the user list.
    console.log('{Friend Event} %s removed from friends list.', source);
  }
  else {
    console.log('{Friend Event} Other friend event occured. (User: %s) (Event: %s)', source, status);
  }
});
bot.on('message', function(source, message, type, chatter) {
  if(message != '') { //Check its not empty.
    var reply = Chat.getChatResponse(source, message); //Generate our reply.
    if(reply != '')
      api.sendSteamMessage(bot, source, reply); //Send z message.

  } else {
    // wat.
  }
});


var server = app.listen(_port, _hostname, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('{Bot Status} Server set up on %s:%s', host, port);
});
