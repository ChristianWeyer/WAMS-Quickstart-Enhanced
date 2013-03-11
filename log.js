'use strict';
var exec = require('child_process').exec;
var util = require('util');

// set the polling interval in milliseconds to your pleasure
// don't be too aggressive, Azure may think you're
// DOSing the API ;)
var pollingInterval = 10000;
var service = process.argv[2];  
var lastLog = new Date(1,1,1970);
var isBusy = false;
var lastWrite = ".";

// console font
var red, blue, green, yellow, bold, reset;
bold  = '\u001b[1m';
red   = '\u001b[31m';
blue  = '\u001b[34m';
yellow= '\u001b[33m';
green = '\u001b[32m';
reset = '\u001b[0m';

console.log(bold + 'LOG WATCHER');
console.log('Mobile Service name: ', service, reset);

// This little function can be used to help invoke the 
// CLI on a child process. It always appends --json to the
// specified command and attempts to parse a non-error body
// into JavaScript objects to pass to the callback
function executeJsonCmd(cmd, callback) {
  exec(cmd + " --json", function(err, stdout, stderror) {
    if (err) { 
      callback(err);
    }
    else if (stderror) {
      callback(stderror);
    }
    else {
      if (stdout) {
        callback(null, JSON.parse(stdout));
      }
      else {
        callback(null, null);
      }
    }
  });
}

function readLog() {
	isBusy = true;
	animate();
	executeJsonCmd("azure mobile log " + service, function (err, response) {

		isBusy = false;
		process.stdout.write("                           \r");
		if (err) {
			console.error(err);
		}
		else {
			var color;
			var logs = response.results.sort(function(l) {
				return l.timeCreated
			}).reverse();
			response.results.forEach(function(l) {
				switch (l.type.toUpperCase()){
					case "ERROR":
						color = red;
						break;
					case "WARNING":
						color = yellow;
						break;
					case "INFORMATION":
						color = green;
						break;
					default:
						color = reset;
				}
				if (Date.parse(l.timeCreated) > lastLog) {
					console.log("-----")
					console.log(color + l.type.toUpperCase() + reset);
					console.log(l.timeCreated);
					console.log("source: ", l.source);
					console.log(l.message);
				}
			})
		}
		process.stdout.write(reset);
		try {lastLog = Date.parse(response.results[response.results.length-1].timeCreated);}catch(err){}
		setTimeout(readLog, pollingInterval);
	})
}

function animate() {
	if (isBusy) {
		lastWrite += ".";
		if (lastWrite.length >= 6)
		{
			lastWrite = "";
		}
		process.stdout.write("              \r");
		process.stdout.write(" polling" + lastWrite + "\r");
		setTimeout(animate, 150)
	}
}

readLog();


