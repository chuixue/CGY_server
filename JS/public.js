// JavaScript Document

function $$(id){ return document.getElementById(id); };
function EnterPress(e){ //传入 event 
	var e = e || window.event; 
	if(e.keyCode == 13)return true;
	return false;
}

//判断上传文件格式是否满足条件
function isPicture(fileName){
	if(fileName!=null && fileName !=""){
  		if (fileName.lastIndexOf(".")!=-1) {//lastIndexOf如果没有搜索到则返回为-1
			var fileType = (fileName.substring(fileName.lastIndexOf(".")+1,fileName.length)).toLowerCase();
			var suppotFile = new Array();
			suppotFile[0] = "jpg";
			suppotFile[1] = "gif";
			suppotFile[2] = "bmp";
			suppotFile[3] = "png";
			suppotFile[4] = "jpeg";
			for (var i =0;i<suppotFile.length;i++) {
				if (suppotFile[i]==fileType) {
					return true;
				} else{
 					continue;
				}
			}
			alert("文件类型不合法,只能是jpg、gif、bmp、png、jpeg类型！");
			return false;
		} else{
			alert("文件类型不合法,只能是 jpg、gif、bmp、png、jpeg 类型！");
			return false;
		}
	}
} 
function getRadioValue(radioName){ 
	var obj = document.getElementsByName(radioName); 
	for(i=0; i<obj.length;i++){
		if(obj[i].checked) return obj[i].value; 
	}         
	return "undefined";       
} 
function getCheckValue(checkName){ 
	var obj = document.getElementsByName(checkName);
	var data=[];
	for(i=0; i<obj.length;i++){
		if(obj[i].checked)data.push(obj[i].value);
	}
	return data;       
} 
function getSelectValue(selID){
	var obj=document.getElementById("slPeople");
	var index = obj.selectedIndex; 
	var value = obj.options[index].value; // 选中值
	return value;
}
function getUser(){
	var uName="";
	var uId=10001;
	var uShop="10086";
	var uPower="1";
	var user={
		name:uName,
		id:uId,
		shop:uShop,
		power:uPower
	};
	return user;
}
function getConfig2(){
	var srvURL="http://10.10.1.120";
	var srvIP="10.10.1.120";
	var ajaxPORT="8003";
	var socketPORT="8001";
	var webPORT="8000";
	var webURL=srvURL + ":" + webPORT;
	var ajaxURL=srvURL + ":" + ajaxPORT;
	
	var cfg={
		srvURL: srvURL,
		srvIP: srvIP,
		ajaxPORT: ajaxPORT,
		socketPORT: socketPORT,
		webPORT: webPORT,
		webURL: webURL,
		ajaxURL: ajaxURL
	};
	
	return cfg;
}

function getConfig(){
	var srvURL="http://cins.swpu.edu.cn";
	var srvIP="cins.swpu.edu.cn";
	var ajaxPORT="8003";
	var socketPORT="8001";
	var webPORT="8000";
	var webURL=srvURL + ":" + webPORT;
	var ajaxURL=srvURL + ":" + ajaxPORT;
	
	var cfg={
		srvURL: srvURL,
		srvIP: srvIP,
		ajaxPORT: ajaxPORT,
		socketPORT: socketPORT,
		webPORT: webPORT,
		webURL: webURL,
		ajaxURL: ajaxURL
	};
	
	return cfg;
}