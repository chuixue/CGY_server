/**
 * New node file
 */

 

var Database=require('../lib/database.js');
var Config=require('../lib/config.js');
var Func = require('./public.js'); 

var db=new Database();
var cfg=new Config();

//创建数据库
/*
for(var i=0;i<cfg.tbList.length;i++)
{
	var sql=cfg.tbList[i].GetSql();
	db.Query(sql);
}
*/
var sql="select * from carinfo";
/*
db.Select(sql,function(error,result){
	var data = JSON.stringify(result[1]);
    cout(data);
    
});
*/
sql="select did,ddescribe from dishclass";
sql="select did,dname,dstyle,dimage,dprice,ddescribe,dcount,dreduce from dish"	

db.Select(sql,function(err,rst){
	 if(err){
		 
	 }
	 else{
		 var data=[];
		 cout(rst[1]);
		 for(var i=0;i<rst[1].length;i++){
			 var style=Func.getTypeStr(rst[1][i].dstyle)
			 data[i]={id:rst[1][i].did, name:rst[1][i].dname, type:style, describe:rst[1][i].ddescribe,
			          price:rst[1][i].dprice, img:rst[1][i].dimage,saleCount:rst[1][i].dcount,reduce:rst[1][i].dreduce};
		 }
		 var str=JSON.stringify(data);
		 cout("request: " + sql + " ,return: " + str );
		 //response.end(str);
	 }
})
//*/
cout(Func.getTypeStr(9));


function cout(txt){console.log(txt);}
