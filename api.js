/*module.exports = {
  throwError: function()
}*/
throwError = function(fatal, error, description) {
  //fatal is a bool, error and description are strings.
  if(fatal) {
    console.log("Fatal error! The error thrown was: " + error);
    console.log(description);
    throw Error("Fatal error thrown! Name: " + error + " Description: " + description);
  } else {
    console.log("Non-fatal error thrown! The error thrown was: " + error);
    console.log(description);
  }
}
