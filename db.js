/**
 * New node file
 */
/**
 * New node file
 */

var Database=require('./lib/database.js');
var Config=require('./lib/config.js');
var Func = require('./lib/public.js'); 

var db=new Database();
var cfg=new Config();

function getPartCount(str,all){
	var sum=0;
	var max=(all.length>str.length)?str.length:all.length;
	for(var l=1;l<max+1;l++){
		var data={};
		for(var i=0;i<all.length-l+1;i++){
			data[all.substr(i,l)]=1;
		}
		cout(data);
		for(var i=0;i<str.length;i++){
			var tp=str.substr(i,1);
			//if(data[tp])cout(tp);
			
		}
	}
	
	cout(data['34']);

}
getPartCount("哈问2","哈喽问题");


cout("33");

return;
//创建数据库
for(var i=0;i<cfg.tbList.length;i++)
{
	
	var sql=cfg.tbList[i].GetSql();
	if(cfg.tbList[i].tbName!="actioninfo")continue;
	//db.Query(sql);
}


function cout(txt){console.log(txt);}
