var Steam = require('steam'),
	  api = require('./api.js'),
	  fs = require('fs');

function Bot() {
  this.steamClient = new Steam.SteamClient(); // Base needed for everything.
  this.steamUser = new Steam.SteamUser(this.steamClient); // Used for logging in.
  this.steamFriends = new Steam.SteamFriends(this.steamClient); // Anything involving friends.
  this.steamTrading = new Steam.SteamTrading(this.steamClient); // So we can hook when someone sends a normal trade request.
}

/**
* @param (object) logonDetails - The login details for the bot { account_name, password, steamid }
*/
Bot.prototype.logOn = function (bot, logonDetails, callback) {
  /**
  * Setup variables.
  */
  bot._status = 0;
  bot.account_name = logonDetails.account_name;

  /**
  *	Initialize the client.
  */
  bot.steamClient.connect();
  bot.steamClient.on('connected', function() {
    bot.steamUser.logOn({
    	account_name: logonDetails.account_name,
    	password: logonDetails.password,
    	sha_sentryfile: (fs.existsSync(logonDetails.account_name + '.sentry') ? fs.readFileSync(logonDetails.account_name + '.sentry') : undefined)
    });
  });

  /**
  * We've logged in successfully.
  */
  bot.steamClient.on('logOnResponse', function(response) {
  	if(response.eresult === Steam.EResult.OK) {
  		Bot._status = 1;
  		api.logEvent('system', 'Bot ' + bot.account_name + ' logged in.');
  		bot.steamFriends.setPersonaState(Steam.EPersonaState.Online);
      callback(bot, 1);
  	} else if (response.eresult == Steam.EResult.AccountLogonDenied) {
  		api.logEvent('error', 'SteamGuard denied login of bot ' + logonDetails.account_name);
      callback(null, false);
  	} else if (response.eresult == 5) {
  		api.logEvent('error', 'Wrong username/password for bot ' + logonDetails.account_name);
      callback(null, false);
  	} else {
			api.logEvent('error', 'Bot ' + logonDetails.account_name + ' failed to sign in. ' + response.eresult);
      callback(null, false);
		}
  });
};

Bot.prototype.hookSteamEvents = function (bot) {
  /**
  * Any friend event (logging on / off, or being added / removed) goes through here.
  * @param source - steamid
  * @param change - the state change. EFriendRelationship.None = we were removed from their friends list :'(
  */
  bot.steamFriends.on('friend', function(source, change) {
    if(change == Steam.EFriendRelationship.RequestRecipient) {
      // TODO: Have a list of donors, or something.
      bot.steamFriends.addFriend(source);
      bot.steamFriends.sendMessage(source, '“We were all at once terribly alone; and alone we must see it through.” ― Erich Maria Remarque, All Quiet on the Western Front', Steam.EChatEntryType.ChatMsg);
    } else {
      // logged on / off. Possible for stalking purposes? :P
    }
  });

  /**
  * Any message a friend sends us goes through here.
  * @param source - steamid
  * @param message - the message sent.
  * @param type - either EChatEntryType.ChatMsg or EChatEntryType.Emote
  */
  bot.steamFriends.on('friendMsg', function(source, message, type) {
    if(type == Steam.EChatEntryType.ChatMsg && message != '') {
      // Parse the chat commands here.
      bot.steamFriends.sendMessage(source, '“Who is it that can tell me who I am?” ― William Shakespeare, King Lear', Steam.EChatEntryType.ChatMsg);
    } else {
      // 'source' is typing to us.
      // And we can hook that. Even if they are not our friend.
      // Not sure what I can do here...
    }
  });

  /**
  * Seperate chat invites go through here.
  * @param chatid - The steamid of the chat we were invited too.
  * @param name - The name of the chat.
  * @param source - steamid
  */
  bot.steamFriends.on('chatInvite', function(chatid, name, source) {
    bot.steamFriends.leaveChat(chatid); // Fails silently, so this might not do anything.
    bot.steamFriends.sendMessage(source, '“The force that through the green fuse drives the flower / Drives my green age; that blasts the roots of trees / Is my destroyer.” ― Dylan Thomas', Steam.EChatEntryType.ChatMsg);
  });

  /**
  * All group-related events fall through here.
  * @param groupid - The steamid of the group.
  * @param type - EClanRelationship
  */
  bot.steamFriends.on('group', function(groupid, type) {
    // Not sure what we can do here. I was hoping for an 'ignore' button...
  });

  /**
  * All trading via the steam client is sent through here.
  * @param tradeid - the trade id used to control everything.
  * @param source - steamid
  */
  bot.steamTrading.on('tradeProposed', function(tradeid, source) {
    bot.steamTrading.respondToTrade(tradeid, false);
    bot.steamFriends.sendMessage(source, 'Legacy trading is not supported. Check back soon!', Steam.EChatEntryType.ChatMsg);
    bot.steamFriends.sendMessage(source, '“This is a hell of dull talk... How about some of that champagne?” ― Ernest Hemingway, The Sun Also Rises', Steam.EChatEntryType.ChatMsg);
  });

  // Hook the bot going offline, or something here.
  api.logEvent('bot', 'Bot ' + bot.account_name + ' has successfully hooked steam events.');
};

module.exports = Bot;
