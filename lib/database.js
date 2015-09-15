/**
 * New node file
 */

 

function Database(path)
{
	this.useCFG=arguments[0]?1:0;//有参数则为1，默认0
	var dbHost;
	var dbUser;
	var dbPasswd;
	var dbName;
	var pool;
	
	this.constructor();
	
	var mysql= require('mysql');
	
	this.pool=mysql.createPool({
		connectionLimit:100,
		host:this.dbHost, 
		user:this.dbUser, 
		password:this.dbPasswd,
		multipleStatements:true,
		acquireTimeout:0
		});  
	//连接数据库·result:true or false
	this.Connect=function(callback)
	{
		var bk=arguments[0];
		this.connection=mysql.createConnection({
			host:this.dbHost, 
			user:this.dbUser, 
			password:this.dbPasswd,
			multipleStatements:true
		});
		this.connection.connect(function(err, rst) 
		{
			if(err) 
			{
				cout('Connect Error: ' + rst.message);
				if(bk)callback(err,rst);
				return;
		    }
		    cout('Connect Successfully !');
		    if(bk)callback(err,rst);
	    });
	}
	
	//查询
	this.Select=function(sql,callback)
	{
		this.Query(sql,callback);
	}
	
	//执行
	//callback第三个参数说明：-1·执行失败，0·纯数据，1带执行连接数据库结果（数据在第二字段）
	this.Query=function(sql,callback)
	{
		var bk=arguments[1];
		var sqlDB=this.sqlDB;
		var pool=this.pool;
		var dbsql='CREATE DATABASE IF NOT EXISTS ' + this.dbName + ' DEFAULT CHARSET utf8 COLLATE utf8_general_ci';
		//if(this.count++)pool.query(dbsql,function(error,result){});//建数据库);
		pool.query(sql,function(error, result)//执行
		{
			if(error && error.code=='ER_NO_DB_ERROR')//未选择数据库
			{
				pool.query(sqlDB+";"+sql, function(err, rst)//再次执行
				{
					if(bk)callback(err,rst,1);//query执行结果
					if(err){ cout(err.message + '\n:	' + sql);}else{	cout("OK :" + sql );	}
				});
			}
			else
			{
				if(bk)callback(error,result,0);//query执行结果
				if(error){ cout(error.message + '\n:	' + sql);}else{	cout("OK :" + sql );	}
			}
		});//End query
	}
	
	//存储过程
	//多sql操作同时进行，有失败则回滚
	this.queryAll=function(sql,callback,lastID){
		var bk=arguments[1];
		var sqlDB=this.sqlDB;
		var pool=this.pool;
		this.pool.getConnection(function (err, connection){
			connection.query(sqlDB,function(){
				connection.beginTransaction(function() {
					connection.query(sql, function(errs, rsts) {
						var insertId =-1;
						if(!errs)insertId = rsts[1].insertId;
						if(bk)callback(errs,rsts,insertId);
						if (errs){
							connection.rollback();
						}
						if(errs){ cout(errs.message + '\n:	' + sql);}else{	cout("OK :" + sql );	}
						connection.commit(function(errc){
							if (errc){
					            connection.rollback();
							}
						});
					});
					connection.release();
				});
			});
		});
	}
	
	

	this.CreateDB=function(dbName,callback)
	{
		var dbn = arguments[0] ? arguments[0] : this.dbName;
		var bk=arguments[1];
		var sql='CREATE DATABASE IF NOT EXISTS ' + dbn + ' DEFAULT CHARSET utf8 COLLATE utf8_general_ci';
		this.Query(sql,function(err,rst)
		{
			var txt=err?rst.message:'OK :' + sql;
			cout(txt);
			if(bk)callback(err,rst);
		});
	}	
	
	cout=function(txt)
	{
		if(1)console.log(txt);
	}
	
	//********************************************************
	
	this.run=function(callback){
		this.Query(this.sqlDB,function(){callback();});
	}
}

//异常处理console.log(err.stack);
//process.on('uncaughtException', function (err) {	console.log(err.toString());	});


//构造函数
Database.prototype.constructor=function()
{
	var Config=require('./config.js');
	var cfg=(this.useCFG==0)?new Config():new Config(1);
	this.count=0;
	this.dbHost=cfg.dbHost;
	this.dbUser=cfg.dbUser;
	this.dbPasswd=cfg.dbPasswd;
	this.dbName=cfg.dbName;
	//this.dbHost='127.0.0.1';
	//this.dbPasswd='cns';
	this.dbName=cfg.dbName;
	this.sqlDB='use '+ this.dbName;
}


//var db=new Database();
//db.CreateDB();
/*
db.Query(sql,function(err, rst){
	if(err)cout('error');
});
*/

//db.Connect(function(err,rst){});

	

//setTimeout(function(){console.log(db.connection.state);},5000);

//db.cout(db.connection.state);
//db.connection.state='disconnected'
function cout(txt){console.log(txt);}
function out(txt){console.dir(txt);}
module.exports = Database;
