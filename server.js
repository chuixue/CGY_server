/**
 * webServer.js
 */
var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var formidable = require('formidable');
var util = require('util');


var Func = require('./lib/public.js'); 
var Database=require('./lib/database.js');
var express = require('express')
var morgan = require('morgan')
var fs = require('fs')
var path = require('path')
var multipart = require('connect-multiparty');

var app = express();
var db=new Database();
var TYPES=getTypes();

app.use(express.static('./public'));
//app.use(morgan('dev'));

app.listen(8000);
cout('Web Server running at ' + Func.PUB_HOST + ':8000');

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    next();
});

app.get('*',function(request,response){
	var filePath = '.' + request.url;
	filePath = decodeURIComponent(filePath);
	if (filePath == './')filePath = './index.html';
	var extname = path.extname(filePath);
	var contentType = 'text/html';
	contentType=TYPES[extname];
	cout("Got Request Url:" + request.url);
	
	fs.exists(filePath, function(exists) {
		if (exists) {
			fs.readFile(filePath, function(error, content) {
				if (error) {
					response.writeHead(500);
					response.end();
				}
				else {
					response.writeHead(200, { 'Content-Type': contentType });
					response.end(content, 'utf-8');
				}
			});
		}
		else {
			response.writeHead(404);
			response.end();
		}
	});

});

app.post('/upload', multipart(), function(req, res){
  var parentPath= '/Files/';
  var filename = req.files.files.originalFilename || path.basename(req.files.files.ws.path);
  
  
  out(req.body);
  
  var targetPath = path.dirname(__filename) + parentPath + filename;
  var name=req.body.name?req.body.name:"";
  
  fs.createReadStream(req.files.files.ws.path).pipe(fs.createWriteStream(targetPath));
  var data={
	  url: 'http://' + req.headers.host + parentPath + filename,
	  name:name,
	  path:parentPath + filename
  };
  
  res.json({code: 200, msg: data});
  
  cout(req.headers.host + parentPath + filename);
});


function getTypes(){
	var TYPES={}; 
	TYPES[".css"]= "text/css";
	TYPES[".gif"]= "image/gif";
	TYPES[".html"]= "text/html";
	TYPES[".ico"]= "image/x-icon";
	TYPES[".jpeg"]= "image/jpeg";
	TYPES[".jpg"]= "image/jpeg";
	TYPES[".js"]= "text/javascript";
	TYPES[".json"]= "application/json";
	TYPES[".pdf"]= "application/pdf";
	TYPES[".png"]= "image/png";
	TYPES[".svg"]= "image/svg+xml";
	TYPES[".swf"]= "application/x-shockwave-flash";
	TYPES[".tiff"]= "image/tiff";
	TYPES[".txt"]= "text/plain";
	TYPES[".wav"]= "audio/x-wav";
	TYPES[".wma"]= "audio/x-ms-wma";
	TYPES[".wmv"]= "video/x-ms-wmv";
	TYPES[".xml"]= "text/xml";
	return TYPES;
}



function out(txt){ console.dir(txt); }
function cout(txt){ console.log(txt + " - " + new Date().toString()); }

