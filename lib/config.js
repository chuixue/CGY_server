/**
 * config.js
 */

function Config(path)
{
	this.useCFG=arguments[0]?1:0;//有参数则为1，默认0
	var xmlPath=(this.useCFG==0)?"./config/database.xml":"../config/database.xml";
	var dbHost;
	var dbUser;
	var dbPasswd;
	var dbName;
	
	//获取数据库配置信息
	this.GetConfigDB=function()
	{
		//var xmlPath="./config/database.xml";
		var xml=rf.readFileSync(xmlPath,"utf-8");  
		var doc = new dom().parseFromString(xml);
		//获取xml节点值
		function GetNodeValue(nodeName)
		{
			try
			{
				var path = arguments[1] ? arguments[1] : "/database/mysql"; 
				path += "/" + nodeName;
				return select(doc, path)[0].firstChild.data;
			}
			catch(exception)
			{
				return "";
			}
		}
		
		this.dbHost=GetNodeValue("dbhost");
		this.dbUser=GetNodeValue("dbuser");
		this.dbPasswd=GetNodeValue("dbpasswd");
		this.dbName=GetNodeValue("dbname");
	}
	//获取表信息
	this.GetConfigTB=function()
	{
		//var xmlPath="./config/database.xml";
		var xml=rf.readFileSync(xmlPath,"utf-8");  
		var doc = new dom().parseFromString(xml);
		//获取xml节点值
		var dt=select(doc, "/database/table");//[0].firstChild.data;
		this.tbList=new Array();
		var attrs=new Array('colName','type','length','primary','increment','default','null','charset');
		for(var i=0;i<dt.length;i++)
		{
			var xmltb=dt[i];
			var tb=new Table();
			tb.tbName=xmltb.getAttribute('tbName');
			var xmlcol=xmltb.getElementsByTagName('column');
			for(var j=0;j<xmlcol.length;j++)
			{
				var index=0;
				var col=new Column();
				var temp=xmlcol[j].getAttribute(attrs[index++]);
				col.colName=temp;	temp=xmlcol[j].getAttribute(attrs[index++]);
				col.type=temp;	temp=xmlcol[j].getAttribute(attrs[index++]);
				col.length=temp==''?'-1':temp;	temp=xmlcol[j].getAttribute(attrs[index++]);
				col.primary=temp==''?'0':temp;	temp=xmlcol[j].getAttribute(attrs[index++]);
				col.increment=temp==''?'0':temp;	temp=xmlcol[j].getAttribute(attrs[index++]);
				col.dfValue=temp;		temp=xmlcol[j].getAttribute(attrs[index++]);
				col.canNull=temp==''?'1':temp;	temp=xmlcol[j].getAttribute(attrs[index++]);
				col.charset=temp;
				tb.colList.push(col);
			}
			this.tbList.push(tb);
		}
	}
	
	//****************************************************
	//构造函数
	var select = require('xpath.js');
	var dom = require('xmldom').DOMParser;
	var rf=require("fs");
	this.GetConfigDB();
	this.GetConfigTB();
}

function Column()
{
	this.colName='';
	this.type='';
	this.length='-1';
	this.primary='0';
	this.increment='0';
	this.dfValue='';
	this.canNull='1';
	this.charset='';
}
function Table()
{
	this.tbName='';
	this.colList=new Array();
	
	this.GetSql=function()
	{
		var pkey=new Array();
		var sql='create table ';
		if(this.tbName=='')return '';
		sql+=this.tbName + '(';
		for(var i=0;i<this.colList.length;i++)
		{
			var col=this.colList[i];
			if(col.colName=='' || col.type=='')return '';
			sql+=col.colName + ' ' + col.type;
			if(col.length!='-1')sql+='(' + col.length + ')';
			if(col.canNull=='0')sql+=' not null';
			if(col.dfValue!='')sql+=" default '" + col.dfValue + "'";
			if(col.increment=='1')sql+=' auto_increment';
			if(col.primary=='1')pkey.push(col.colName);
			if(i!=this.colList.length-1)sql+=',';
		}
		if(pkey.length>0)
		{
			sql+=',primary key('
			for(var i=0;i<pkey.length;i++)
			{	
				sql+=pkey[i];
				if(i!=pkey.length-1)sql+=',';
			}
			sql+=')';
		}
		sql+=')ENGINE=InnoDB DEFAULT CHARSET utf8 COLLATE utf8_general_ci';
		return sql;
	}
}





function cout(txt){console.log(txt);}

module.exports = Config;


//example
/*
	var Config=require('./config.js');
	var cfg=new Config();
	console.log(cfg.dbHost);
	console.log(cfg.dbName);
*/