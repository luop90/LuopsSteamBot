/***********************
* This is the main file for the bot.
* BEFORE EXECUTING-
*   - Install steamkit for nodejs (npm install steam)
*   - Edit config_example.js with username/password, rename to config.js
*   - ???
*   - Profit!
* <insert MIT license here>
*
************************/
var Steam = require("steam");
var fs = require("fs");
var api = require("./api.js");

//Get the config file loaded up.
var _config = [];
if(fs.existsSync("./config.json")) {
  _config = JSON.parse(fs.readFileSync("./config.json"));
  throwError(true, "Config file found!", "You did set config.json, didnt you?");
} else {
  throwError(true, "Config file not found", "Did you remember to rename config_example.json to config.json?");
}
//Create the bot.
var bot = new Steam.SteamClient();
bot.logOn({
  accountName: _config.steam.bot_username,
  password: _config.steam.bot_password
});

bot.on("loggedOn", function() {
  console.log("Bot loaded. :]");
  bot.setPersonaState(Steam.EPersonaState.Online); //Set to online.
  bot.setPersonaName(_config.steam.bot_displayname); //Set the name.
});
