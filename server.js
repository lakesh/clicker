// load http module
var http = require('http');

// load the fs module
var fs = require('fs');

//load the path module
var path = require('path');

    	
var mongodb = require('mongodb');
var server = new mongodb.Server('localhost',27017, {auto_reconnect: true});
var db = new mongodb.Db('clicker', server);

// create http server
var app = http.createServer(handler);
app.listen(8080);

function handler (req, res) {
  if(req.method == 'POST') {
		var body = "";
  	req.on('data', function (chunk) {
    	body += chunk;
  	});
  	
  	req.on('end', function () {
    	console.log('POSTED: ' + body);
    	obj = JSON.parse(body);
    	console.log(obj.feedback);

      db.open(function(err, db) {
				if(!err) {
					db.collection('feedback', function(err, collection) {
						var currentTime = new Date().getTime();
						var feedback = {value:obj.feedback, datetime:currentTime};	
						collection.insert(feedback);
						db.close();
					});
				}      
			});
			res.writeHead(200, {'Content-Type': 'text/plain'});
    	res.write("Testing");
			res.end("Hello, World!\n");
	  });
	  
  } else {
		var filePath = '.' + req.url;
		if(filePath == './') {
			filePath = './html/index.html';
		}  
		var extname = path.extname(filePath);
		var contentType = "text/html";
	 
		switch(extname) {
			case '.js':
				contentType = "text/javascript";
				break;
			case '.css':
				contentType = "text/css";
				break;
		}
		
		path.exists(filePath, function(exists) {
			 
			if (exists) {
				fs.readFile(filePath, function(error, content) {
					if (error) {
						res.writeHead(500);
						res.end();
					} else {
						res.writeHead(200, { 'Content-Type': contentType });
						res.end(content, 'utf-8');
					}
				});
			} else {
				res.writeHead(404);
				res.end();
			}
		});
	}
}
var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
	var currentTime = new Date().getTime();
	var startTime = currentTime - (5*60*1000);
	step = 30*1000;
	
	var stats = {"start":startTime,"end":currentTime,"step":step,"names":["Stats"],"values":[[1, 2, 3, 4, 3, 4, 5, 8, 2, 3, 4, 1]]};
	socket.emit('initial', { stats: stats }); 
	socket.on('echo', function (data) {
		
	}); 
});
 
console.log('Server running on 8080');
