/**
 * others.js
 */
var Database=require('./database.js');
var db=new Database(1);

var shopId=1;
//************************************************插入菜品预设图片
var Img=[];
var imgNames=["菜品一","菜品二","菜品三","菜品四","菜品五","菜品六","菜品七","菜品八"];
for(var i=0;i<imgNames.length;i++){
	var image={}; 
	var filePath="Files/image/" + "img(" + (i+1).toString() + ").jpg";
	image["path"]=filePath;
	image["name"]=imgNames[i];
	image["type"]=2;	//自定义1、系统预设2
	image["class"]=1;	//菜品1、分类2
	image["mark"]="";
	image["pid"]="10001";
	Img.push(image);
}
for(var i=0;i<Img.length;i++){
	var sql="Insert into image (ipath,iname,imark,itype,iclass,ipid,sid) values ('"+ Img[i].path + "','"
		+ Img[i].name + "','" + Img[i].mark +"'," + Img[i].type + "," + Img[i].class + "," + Img[i].pid + ","+ shopId +")";
	db.Query(sql,function(err,rst){});
}
//*/
///*
//************************************************插入分类预设图片
var Ico=[];
var icoNames=[ "热菜","凉菜","分类一","分类二" ];
for(var i=0;i<icoNames.length;i++){
	var image={}; 
	var filePath="Files/image/" + "ico(" + (i+1).toString() + ").ico";
	image["path"]=filePath;
	image["name"]=icoNames[i];
	image["type"]=2;	//自定义1、系统预设2
	image["class"]=2;	//菜品1、分类2
	image["mark"]="";
	image["pid"]="10001";
	Ico.push(image);
}
for(var i=0;i<Ico.length;i++){
	var sql="Insert into image (ipath,iname,imark,itype,iclass,ipid,sid) values ('"+ Ico[i].path + "','"
		+ Ico[i].name + "','" + Ico[i].mark +"'," + Ico[i].type + "," + Ico[i].class + "," + Ico[i].pid + ","+ shopId + ")";
	db.Query(sql);
}
//*/


cout("The End!");



function out(txt){ console.dir(txt); }
function cout(txt){console.log(txt + "[" +new Date().toString() + "]");}