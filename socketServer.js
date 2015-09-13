/**
 * socketServer.js
 */

var http = require('http');
var app=http.createServer().listen(8001);
var Func = require('./lib/public.js'); 
cout('Socket Server running at ' + Func.PUB_HOST + ':8001');
var	io = require('socket.io').listen(app);
var Database=require('./lib/database.js');

var db=new Database();


var userList = {};//用户表
var group={};//组信息
var userKey=[];//索引信息
var Dish={};//菜单信息

userList["10086"]={group:"group101",uid:"101",uname:"lily",socket:{id:"10086"}};
userList["10087"]={group:"group102",uid:"102",uname:"lucy",socket:{id:"10087"}};
userList["10088"]={group:"group103",uid:"103",uname:"david",socket:{id:"10088"}};
userList["10089"]={group:"group104",uid:"104",uname:"simis",socket:{id:"10089"}};
userList["10080"]={group:"group103",uid:"105",uname:"hanmei",socket:{id:"10080"}};
group["group101"]=["10086"];
group["group102"]=["10087"];
group["group103"]=["10088","10080"];
group["group104"]=["10089"];


var testPsn,testGrp;
var workServer;

io.sockets.on('connection', function (socket){	
	cout('一个连接连上[' + socket.id + ']-');
	
	//反馈连接·客户端连接后发送欢迎信息
	socket.emit('conn', { sid: 'socketId:' + socket.id });
	
	//响应客户端登陆请求
	socket.on('login', function (data,fn) {
		if(!data.onlykey || !data.uid || !data.shopId)return;

		var pk=Func.partOnlykey(data.onlykey);//识别标识符
		if(!pk){cout("bad onlykey");return; }
		
		var groupKey="group" + data.shopId.toString() + "d" + pk.did.toString();
		if(!group[groupKey]){
			group[groupKey]=[socket.id];
		}else{
			group[groupKey].push(socket.id);
		}
		//socket.emit("group",{ sid:socket.id, groupKey:groupKey});//·方案一
		userList[socket.id] ={ uid:data.uid,
		                       did:pk.did,
		                       socket:socket,
		                       group:groupKey};
		cout("用户已登录：" + data.uid + "," + groupKey);
		
	});
	
	//***************************************************************
	//等待处理程序连接
	socket.on('workServer', function(data){
		if(data.key=="cinsServer2")workServer=data.sid;
		cout("事务服务器I已就绪");
		send("Work Hard ,Please");
	});
	//移交事务处理
	function send(data){
		if(workServer){
			io.sockets.emit(workServer, data);
			cout("事务已移交:" + workServer);
		}
		else cout("事务服务器I未就绪");
	}
	//***************************************************************
	//分组发送消息
	function sendGroup(groupKey,data){
		var users=group[groupKey];
		if(!users)return;
		for(var i=0;i<users.length;i++){
			if(!userList[users[i]])continue;
			var socket=userList[users[i]].socket;
			socket.emit("update",data);
		}
	}
	//删除群组
	function delGroup(groupKey){
		for(var e in userList){
			if(userList[e].group==groupKey){
				delete userList[e];
			}
		}
		delete group[groupKey];
	}
	//删除用户
	function delUser(socketID){
		socketID=socketID.toString();
		if(!userList[socketID])return;
		cout('用户退出[' + socketID + ']-');
		var users=group[userList[socketID].group];
		remove(users,socketID);
		if(users.length==0)delete users;
		delete userList[socketID];
	}
	//***************************************************************
	
	socket.on('test', function(){
		cout("get request");
		//发送私人信息
		//socket.emit(testPsn,"Hello,this is Personnal Message");
		//发送分组信息
		//socket.emit(testGrp,"Hello,this is Group Meessage");
		//io.sockets.emit("group","Hello,this is Group Meessage");
		sendGroup("group8","group msg");
		cout("已发送");
	});

	
	//监听断线
	socket.on('disconnect', function(){
		cout('一个连接断开[' + socket.id + ']-');
		delUser(socket.id);
	});

	//消息1
	socket.on('msg', function (data) {
		cout(data);
		io.sockets.emit('msg', "server get it: " + data);
	});	
	//接收点击数据
	socket.on('click', function (data) {
		//验证key
		var onlykey=data.onlykey;
		var rst=Func.partOnlykey(onlykey);
		if(!rst){cout("bad onlykey");return;}
		
		var did=rst.did;			//桌号
		var uid=data.uid;			//人员
		var dish=data.dish.id;		//菜品
		var num=1;					//数量		
		var shopId=data.shopId;
		
		if(!onlykey || !uid)return;
		
		var newData={ workID:2,onlykey:onlykey,did:did,uid:uid,dish:dish,num:num,shopId:shopId};
		send(newData);
	});

	//接收客户端发来
	socket.on('update', function (data) {
		//验证key
		var onlykey=data.onlykey;
		var rst=Func.partOnlykey(onlykey);
		if(!rst){cout("bad onlykey");return;}
		
		var did=rst.did;			//桌号
		var uid=data.uid;			//人员
		var dish=data.dish.id;					//菜品
		var num=data.dish.num;					//数量	
		var mark=data.dish.mark?data.dish.mark:"";//备注	
		var shopId=data.shopId;
		if(!onlykey || !uid)return;
		
		data["car"]=1;//标明购物车消息
		cout("shopId:" + shopId + "," + uid + " 发来点菜信息");
		
		var newData={ workID:1,onlykey:onlykey,did:did,uid:uid,dish:dish,num:num,mark:mark,shopId:shopId};
		send(newData);
		
		var groupKey="group" + shopId.toString() + "d" + did.toString();
		cout("即将群发至分组：" + groupKey);
		sendGroup(groupKey, data);
	});
	















	//*************************************管理员请求*******************************************
	socket.on('admin', function (data) {
		cout("command:" + data.cmd + ",pattern:" + data.ptn);
		var txt="";
		switch(data.cmd)
		{
			case "ls":
				var G=new Array();//组信息+用户列表
				var T=new Array();//组信息
				userKey=[];//用户表索引
				txt="Group List:\n";
				//整理数据
				for(var e in userList){
					var temp=userList[e].group;
					var index=T.indexOf(temp);
					if(index==-1){
						index=T.length;
						T[index]=temp;
						G[index]={gid:temp,users:[e]};
					}else{
						G[index].users.push(e);
					}
				}
				//输出
				for(var i=0;i<G.length;i++){
					txt+=G[i].gid + " :\n";
					for(var j=0;j<G[i].users.length;j++){
						var id=G[i].users[j];
						userKey.push(userList[id].socket.id);
						txt+="\tpid:"+ userKey.length;
						txt+="\tuid:"+ userList[id].uid;
						txt+="\tname:"+ userList[id].uname;
						txt+="\tsocket:"+ userList[id].socket.id;
						txt+="\n";
					}
				}
				break;
			case "kill":
				var ptn;
				ptn=data.ptn;
				if(ptn=="")break;
				if(ptn.length>5 && ptn.substring(0,5)=="group"){//删除组
					delGroup(ptn);
				}else{//删除单个用户
					var id=parseInt(ptn);
					if(userKey.length>=id && id>0){
						var sid=userKey[id-1];out(userKey);
						delUser(sid);
					}
				}
				txt="kill " + ptn + " OK";
				break;
			case "ls":
				cout("1");
				break;
			default:
				txt="未识别的命令:" + data.cmd; 
				txt+="命令列表：ls kill ..";
				break;
		}
		
		



		cout(txt);
		//发送查询结果
		socket.emit('admin', txt);
	});

	
	
	
});
//*************************************End·管理员请求*****************************************
/** 
 *删除数组指定下标或指定对象 
*/ 
function remove(array,obj){ 
	for(var i =0;i <array.length;i++){ 
		if(array[i] == obj){ 
			for(var j = i;j <array.length;j++){ 
				array[j]=array[j+1]; 
			} 
			array.length = array.length-1;
			break;
		}
	} 
}
		
function out(txt){ console.dir(txt); }
function cout(txt){ console.log(txt + "[ " + new Date().toString() + " ]"); }
