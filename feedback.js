// load http module
var http = require('http');

// load the fs module
var fs = require('fs');

//load the path module
var path = require('path');

// create http server
var app = http.createServer(handler);
app.listen(8081);

function handler (req, res) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
    	res.write("Testing");
			res.end("Hello, World!\n");

}
 
console.log('Server running on 8081');
