/**
 * workServer.js
 */

var io = require('socket.io-client');
var Func = require('./lib/public.js'); 
var socket = io.connect(Func.PUB_URL + ':8001', {reconnect: true});
var Database=require('./lib/database.js');

var db=new Database();
var sid;

//连接
socket.on('connect', function(socket) { 
  cout('Connect To The Server:8001');
});
//监听连接反馈
socket.on('conn', function (data,fn) {	
	sid=data.sid;
	cout('Connect Success：' + sid);
	var dt={ key:"cinsServer2", sid:sid };
	socket.emit("workServer", dt);
	cout("已就绪，等待命令!");
	
	socket.on(sid, function(newData){
	   cout("已接收事务：");
	   out(newData);
	   if(newData.workID==1)Work1(newData);
	   else if(newData.workID==2)Work2(newData);
	   else if(newData.workID==3)Work3(newData);
	});
});

//记录每一个元操作·购物车
function Work1(data)
{
	var onlykey=data.onlykey;
	var rst=Func.partOnlykey(onlykey);
	var did=rst.did;			//桌号
	var uid=data.uid;
	var dish=data.dish;
	var num=data.num;
	var help=0;
	var mark=data.mark;
	var shopId=data.shopId;
	var recommend=(data.recommend)?data.recommend:0;
	var type=1;
	var sql="select * from worker where wid='" + uid + "' and sid=" + shopId;
	db.Select(sql,function(error,result,index){
		if(!error){
			var rstData=[];
			if(index==0)rstData=result; else if(index==1)rstData=result[1];
			if(rstData.length!=0)help=1;
			sql="INSERT INTO carinfo (did, uid, onlykey, ocount, ohelp, omark, ostate, obtime,sid, orecommend) VALUES ";
			sql+=Func.fStrs([dish, uid, [onlykey], num, help, [mark], 0, "date", shopId, recommend]);
			//sql+="("+ dish + "," + uid + ",'" + onlykey + "'," + num + ","+ help + ",'" + mark + 
			//		"',0,'" + Func.date() + "',"+ shopId +",)";
			db.Query(sql,function(err,rst){});
		}
	});
}
//点击行为记录
function Work2(data)
{
	var onlykey=data.onlykey;
	var rst=Func.partOnlykey(onlykey);
	var did=rst.did;			//桌号
	var uid=data.uid;
	var dish=data.dish;
	var num=data.num;
	var help=0;
	var shopId=data.shopId;
	var type=1;
	var sql="select * from worker where wid='" + uid + "' and sid=" + shopId;
	db.Select(sql,function(error,result,index){
		if(!error){
			var rstData=[];
			if(index==0)rstData=result; else if(index==1)rstData=result[1];
			if(rstData.length!=0)help=1;
			sql="INSERT INTO actioninfo (did, uid, onlykey, acount, ahelp, astyle, abtime,sid) VALUES ";
			sql+="("+ dish + "," + uid + ",'" + onlykey + "'," + num + ","+ help + ",1,'" + Func.date() + "',"+ shopId +")";
			db.Query(sql,function(err,rst){ });
		}
	});
}
//呼叫记录
function Work3(data)
{
	var uid=data.uid;
	var shopId=data.shopId;
	var onlykey=data.onlykey;
	if(!onlykey || !uid || !shopId)return;
	
	var sql="insert into callinfo (uid, onlykey, sid, cstate, cbtime) VALUES";
	sql += Func.fStrs([uid, [onlykey], shopId, 1, "date" ]);
	db.Query(sql,function(err,rst,index){
		var id=rst[index].inertId;
		cout("呼叫编号: " + id);
		data["id"]=id;
		data["state"]=1;
		socket.emit("callInfo", data);
	});
}


//监听关闭
socket.on('close', function(){
    cout('Connetion Closed.');
});






function out(txt){ console.dir(txt); }
function cout(txt){console.log(txt + "[" +new Date().toString() + "]");}