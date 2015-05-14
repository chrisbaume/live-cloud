var connect = require('connect');
var serveStatic = require('serve-static');
var io = require('socket.io').listen(8081);
var fs = require('fs');
var chokidar = require('chokidar');

var DIR='/home/chrisbau/autorecord/all-trans/';
var watcher = chokidar.watch(DIR, {ignored: /^\./, persistent: true});

var process = function(callback)
{
  var words = [];

  // read target directory
  fs.readdir(DIR, function(err, files)
  {
    if (err) throw err;

    // for each file in the directory
    var c=0;
    files.forEach(function(file)
    {
      // read it
      c++;
      fs.readFile(DIR+file, 'utf-8', function(err, content)
      {
        if (err) throw err;

        // extract list of words
        var newWords = JSON.parse(content).words;

        // add each word to the list
        newWords.forEach(function(word)
        {
          words.push(word.name);
        });

        // if all words have been read, send data
        if (0===--c) {
          callback(words);
        }
      });
    });
  });
};

// set up sockets
io.sockets.on('connection', function(socket)
{
  // run initially
  process(function(words) {
    socket.emit('words', words);
  });

  // trigger when new file is added
  watcher.on('add', function(path) {
    process(function(words) {
      socket.emit('words', words);
    });
  });
});


connect().use(serveStatic(__dirname)).listen(8080);
console.log('Listening on port 8080');
