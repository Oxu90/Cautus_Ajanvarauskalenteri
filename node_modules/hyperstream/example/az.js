var hyperstream = require('../');
var fs = require('fs');
var Stream = require('stream');

var hs = hyperstream({
    '#a': createAzStream(),
    '#b': fs.createReadStream(__dirname + '/az/b.html')
});
var rs = fs.createReadStream(__dirname + '/az/index.html');
rs.pipe(hs).pipe(process.stdout);

function createAzStream () {
    var rs = new Stream;
    rs.readable = true;
    var ix = 0;
    var iv = setInterval(function () {
        rs.emit('data', String.fromCharCode(97+ix));
        if (++ix === 26) {
            clearInterval(iv);
            rs.emit('end');
        }
    }, 50);
    return rs;
}
