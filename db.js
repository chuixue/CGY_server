/**
 *This line is used for test..
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


//cout(Func.getSearchByList("问题",["哈问5","哈问喽问题","sdadf"]));


//return;
//创建数据库
for(var i=0;i<cfg.tbList.length;i++)
{
	
	var sql=cfg.tbList[i].GetSql();
	if(cfg.tbList[i].tbName!="money")continue;
	db.Query(sql);
}


function cout(txt){console.log(txt);}
