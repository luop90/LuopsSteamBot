
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
