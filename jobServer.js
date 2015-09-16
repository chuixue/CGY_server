/**
 * jobServer.js
 */

var Database=require('./lib/database.js');
var Func = require('./lib/public.js'); 
var express = require('express');

var app = express();
var db=new Database();

var bodyParser = require('body-parser'); 
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/hello', function(req,res){  
	var rst={rst:1,msg:"事务服务器II已就绪！"};
	if(req.body.msg=="cinsServer1")res.send(rst);
});  

app.post('/db', function(req,res){  
	out(req.body);

});  
app.post('/sql', function(req,res){  
	out(req.body.sql);
	db.Query(req.body.sql);
	//res.send("nimeia");
});
app.post('/image', function(req,res){  
	out(req.body.name);
	out(req.body.path);
	out(req.body.shopId);
	out(req.body.style);

	//db.Query(req.body.sql);
//res.send("nimeia");
});

app.listen(8006,Func.PUB_HOST);
cout('Server running on port ' + Func.PUB_HOST + ':8006/');




function cout(txt){ console.log(txt + "[" + Func.date() + "]"); }
function out(txt){ console.dir(txt); }