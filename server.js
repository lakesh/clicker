// load http module
var http = require('http');

// load the fs module
var fs = require('fs');

//load the path module
var path = require('path');

    	
var mongodb = require('mongodb');
var async = require('async');


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

			var server = new mongodb.Server('localhost',27017, {auto_reconnect: true}, {safe:true});
			var db = new mongodb.Db('clicker', server);
			
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
	var startTime = currentTime - (10*60*1000);
	step = 60000;
	var values = new Array();
	var positives = new Array();
	var negatives = new Array();
	
	var server1 = new mongodb.Server('localhost',27017, {auto_reconnect: true}, {safe:true});
	var db1 = new mongodb.Db('clicker', server1);	
	
	db1.open(function(err, db) {
		if(!err) {

			db1.collection('feedback', function(err, collection) {
				var queries = [];
				var END = 10;
				// Build up queries:
				for (var i=0;i <END; i++) {
					queries.push((function(j){
						return function(callback) {
							collection.find(
								{value:1},
								{created_on: 
									{       
										$gte:startTime + (j*60*1000 - 30*1000),
										$lt: startTime + (j*60*1000 + 30*1000)
									}
								},
								function(err_positive, result_positive) {
									result_positive.count(function(err, count){
										console.log("Total matches: " + count);
										positives[j] = count;          
										callback();
									});
								}
				
							);
						}
					})(i));
					queries.push((function(j){
						return function(callback) {
							collection.find(
								{value:0},
								{created_on: 
									{
										$gte:startTime + (j*60*1000 - 30*1000),
										$lt: startTime + (j*60*1000 + 30*1000)
									}
								},
								function(err_negative, result_negative) {
									result_negative.count(function(err, count){
										console.log("Total matches: " + count);
										negatives[j] = count;
										callback();
									});
								}   
							);
						}
					})(i));  
				}
				
				// Now execute the queries:
				async.parallel(queries, function(){
					// This function executes after all the queries have returned
					// So we have access to the completed positives and negatives:
				
					// For example, we can dump the arrays in Firebug:
					for (var i=0;i <END; i++) {
						values[i] = positives[i] - negatives[i];
					}
					
					console.log(values);
					var stats = {"start":startTime,"end":currentTime,"step":step,"names":["Stats"],"values":[[5,7,4,8,3,9,19,25,2,36]]};
					db1.close();
					socket.emit('initial', { stats: stats }); 
				});
			});

		} else {
			console.log('Error connecting to the database');
		}      
	
	});

	socket.on('update', function (data) {
		console.log('Update request received');
		var currentTime = new Date().getTime();
		var server = new mongodb.Server('localhost',27017, {auto_reconnect: true}, {safe:true} );
		var db = new mongodb.Db('clicker', server);	
		var values = new Array();
		
		db.open(function(err, db) {
			if(!err) {
				db.collection('feedback', function(err, collection) {
					var queries = [];
					var END = 1;
					// Build up queries:
					for (var i=0;i <1; i++) {
						queries.push((function(j){
							return function(callback) {
								collection.find(
									{value:"1"},
									{datetime: 
										{       
											$gte:currentTime + (j*60*1000 - 30*1000),
											$lt: currentTime + (j*60*1000 + 30*1000)
										}
									},
									function(err_positive, result_positive) {
										result_positive.count(function(err, count){
											console.log("Total matches: " + count);
											positives[j] = count;          
											callback();
										});
									}
					
								);
							}
						})(i));
						
						queries.push((function(j){
							return function(callback) {
								collection.find(
									{value:"0"},
									{datetime: 
										{
											$gte:startTime + (j*60*1000 - 30*1000),
											$lt: startTime + (j*60*1000 + 30*1000)
										}
									},
									function(err_negative, result_negative) {
										result_negative.count(function(err, count){
											console.log("Total matches: " + count);
											negatives[j] = count;
											callback();
										});
									}   
								);
							}
						})(i));  
					}
					
					// Now execute the queries:
					async.parallel(queries, function(){
						// This function executes after all the queries have returned
						// So we have access to the completed positives and negatives:
					
						// For example, we can dump the arrays in Firebug:
						for (var i=0;i <END; i++) {
							values[i] = positives[i] - negatives[i];
						}
						
						console.log(values);
						db.close();
						socket.emit('newstats', { stats: values }); 
					});
						
				});		

			}
		});
		
	}); 
});
 
console.log('Server running on 8080');
