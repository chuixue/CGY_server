/**
 * webServer.js
 */
var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var formidable = require('formidable');
var util = require('util');
var request = require('request');

var Func = require('./lib/public.js'); 
var Database=require('./lib/database.js');
var express = require('express')
var morgan = require('morgan')
var multipart = require('connect-multiparty');

var app = express();
var db=new Database();
var TYPES=getTypes();

app.use(express.static('./public'));
//app.use(morgan('dev'));

app.listen(8000);
cout('Web Server running at ' + Func.PUB_HOST + ':8000');

var P_JOB=0;	//事务服务器是否就绪
post("/hello",{msg:"cinsServer1"},function(err,rst,body){	
	var data=JSON.parse(body);
	if(data.rst==1){ cout(data.msg);P_JOB=1; }
});


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
	if (filePath == './')filePath = './docs/index.html';
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
  var parentPath= 'Files/';
  var filename = req.files.files.originalFilename || path.basename(req.files.files.ws.path);
  out(req.body);
  
  var targetPath = path.dirname(__filename) + "/" + parentPath + filename;
  var name=req.body.name?req.body.name:"";
  var user=req.body.nameUser?req.body.nameUser:"";
  var shopId=req.body.nameShop?req.body.nameShop:"";
  var style=req.body.nameStyle?req.body.nameStyle:0;//2分类 或者 1菜品 或者 3tour图
  
  parentPath += shopId;
  if(shopId!=""){
	  if(!fs.existsSync(parentPath))fs.mkdirSync(parentPath);
	  parentPath += "/";
	  targetPath=path.dirname(__filename) + "/" + parentPath + filename;
  }
  fs.createReadStream(req.files.files.ws.path).pipe(fs.createWriteStream(targetPath));
  var data={
	  url: 'http://' + req.headers.host + "/" + parentPath + filename,
	  name:name,
	  path:parentPath + filename,
	  shopId:shopId,
	  style:style,
	  user:user
  };
  post("/image",data, function(error, response, body){
	  var data=JSON.parse(body);
	  var id=-1;
	  if(!data.error)id= data.id; 
	  data["id"]=id;
	  res.json({code: 200, msg: data});
  });
  
  
  
  cout(req.headers.host + "/" + parentPath + filename);
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


//*************************************************************************
//移交请求至事务服务器·有回调
function post(key,data,callback)
{
   	request.post({
   		url: Func.PUB_URL + ':8006' + key,
   		headers: {
   	    	'Content-Type': 'application/json'
   		},
   		body: JSON.stringify(data)
   	},
   	function(error, response, body){
   		callback(error, response, body);
   	});
}
//移交请求至事务服务器·无回调
function send(key,data)
{
	if(P_JOB!=1){  cout("移交失败，事务服务器未就绪."); return; }
   	var path=arguments[1]?arguments[0]:"/db";
   	var dt=arguments[1]?arguments[1]:arguments[0];
   	request.post({
   		url: Func.PUB_URL + ':8006' + path,
   		headers: {
   	    	'Content-Type': 'application/json'
   		},
   		body: JSON.stringify(dt)
   	},
   	function(error, response, body){
   		cout(body);
   	});
}







function out(txt){ console.dir(txt); }
function cout(txt){ console.log(txt + " - " + new Date().toString()); }

