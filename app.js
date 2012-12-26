var watch = require('watch');
var util = require('util');
var sys = require('sys');
var exec = require('child_process').exec; 
var service = process.argv[2];
var directory = process.argv[3] || __dirname;

console.log('Mobile Service name: ', service);
console.log('Directory: ', directory);

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

// first, download all the list of scripts and place them into the directory. 
// Overwrite if necessary.
executeJsonCmd("azure mobile script list " + service, function(error, scripts) {
    if (error) {
      console.error(error);
      return;
    }

    // we're only interested in table scripts for now
    var tableScripts = scripts.table;
    var downloadCount = 0;

    for (var i=0; i < tableScripts.length; i++) {
      var table = tableScripts[i];
      downloadScript(table, function(err) {
        if (err) {
          console.error(err);
        }
        else {
          downloadCount++;
          if (downloadCount == scripts.table.length) {
            startWatch();
          }
        }
      });
    }
});

// downloads a particular script and saves it to disk
function downloadScript(table, callback) {
  console.log("Downloading",table.table, table.operation);
  var file = util.format("%s.%s.js", table.table, table.operation)
  executeJsonCmd(util.format('azure mobile script download --override -f "%s/%s" %s table/%s', directory, file, service, file), 
  function(err, script) {
    console.log(util.format("Downloaded %s/%s.", directory, file));
    callback(err);
  });
}

// starts the file watch and uploads any changed files
function startWatch() {
  watch.createMonitor(directory,
  {
   'ignoreDotFiles' : true,
  },
  function (monitor) {
    console.log('Watching files in:', directory);
    monitor.on("created", function (f, stat) {
      console.log('File created - only file CHANGES are supported.', f);
    });
    monitor.on("changed", function (f, curr, prev) {
      console.log('File changed - uploading', f);
      executeJsonCmd(util.format("azure mobile script upload %s table%s -f %s", service, f.substring(f.lastIndexOf("/")), f), function(err) {
        if (err) console.error(err);
        else { console.log("Uploaded:", f); }
      });;
    });
    monitor.on("removed", function (f, stat) {
      console.log('File removed - only file CHANGES are supported.', f);
    });
  })
}
