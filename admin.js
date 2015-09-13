/**
 * admin.js
 */

var io = require('socket.io-client');
var socket = io.connect('http://127.0.0.1:8001', {reconnect: true});
//连接
socket.on('connect', function(socket) { 
  cout('Connect To The Server:8001');
});
//监听连接反馈
socket.on('conn', function (data,fn) {	
	cout('Connect Success：' + data.sid);
	process.stdout.write("请输入命令：");
});
//监听返回消息
socket.on('admin', function(data){
    cout(data);
    process.stdout.write("\r\r请输入命令：");
});
//监听关闭
socket.on('close', function(){
    cout('Connetion Closed.');
});


//响应输入输出
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {	
	var chunk = process.stdin.read();
	if (chunk !== null) {
		RunCommand(chunk);
	}
});

process.stdin.on('end', function() {
	process.stdout.write('end');
});

//处理命令
function RunCommand(command)
{
	process.stdout.write("执行结果： ");
	command=command.substring(0,command.length-2);
	command=command.replace(/^\s+|\s+$/g,'');
	while(1){
		if(command.indexOf("  ")==-1)break;
		command=command.replace("  "," ");
	}
	var data=command.split(" ");
	var cmd=data[0];
	var ptn=data[1];
	
	socket.emit('admin', { cmd:cmd, ptn:ptn });
		
}




function cout(txt){console.log(txt);}