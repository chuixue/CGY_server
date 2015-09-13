/**
 * New node file
 */

exports.PUB_COUNT=4;
exports.PUB_HOST="cins.swpu.edu.cn";
exports.PUB_URL="http://cins.swpu.edu.cn";

//获取二进制信息
function getBinaStr(num)
{
	var data=[];
	var index=0;
	for(var i=0;;i++){
		data[i]=num % 2;                
		num=Math.floor(num / 2);                
		if(num==0)break;
	}
	return data
}
exports.isArray = function(obj) { 
	return Object.prototype.toString.call(obj) === '[object Array]'; 
} 
//获取随机验证码
exports.getKeyRandom =function(len){   
	if(!arguments[0])len=11;
	var value=Math.round(Math.random() * 8) +1 ;
	var txt="9" + value.toString();
	for(var i=0;i<len-1;i++){
		var value=Math.round(Math.random() * 9);
		txt+=value.toString();
	}
	return txt;
}
exports.getKeyRandoms =function(len){
	var key=this.getKeyRandom(len);
	var data=[key];
	key=this.getKeyRandom(len);
	while(data[0]==key)key=this.getKeyRandom(len);
	data.push(key);
	return data;
}
//格式化字符串·[]内需加引号
exports.fStr=function(data){
	var txt="";
	for(var i=0;i<data.length;i++){
		if(!this.isArray(data[i])){
			if(data[i]=="date")
				txt+="'" + this.date() + "'";
			else
				txt+=data[i].toString();
		}else{
			txt+="'" + data[i][0].toString() + "'";
		}
		if(i!=data.length-1)txt+=",";
	}
	return txt;
}
exports.fStrs=function(data){
	var txt="(";
	try{
		for(var i=0;i<data.length;i++){
			if(!this.isArray(data[i])){
				if(data[i]=="date")
					txt+="'" + this.date() + "'";
				else
					txt+=data[i].toString();
			}else{
				txt+="'" + data[i][0].toString() + "'";
			}
			if(i!=data.length-1)txt+=",";
		}
	}catch(e){}
	txt+=")";
	return txt;
}
//时间日期格式化
exports.format = function dateFormat (date, fstr) {
	var utc="get";
	return fstr.replace (/%[YmdHMS]/g, function (m) {
	    switch (m) {
	    case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
	    case '%m': m = 1 + date[utc + 'Month'] (); break;
	    case '%d': m = date[utc + 'Date'] (); break;
	    case '%H': m = date[utc + 'Hours'] (); break;
	    case '%M': m = date[utc + 'Minutes'] (); break;
	    case '%S': m = date[utc + 'Seconds'] (); break;
	    default: return m.slice (1); // unknown code, remove %
	}
	// add leading zero if required
	return ('0' + m).slice (-2);
	});  
}  
//获取日期
exports.date = function(){   
	return this.format(new Date(),"%Y-%m-%d %H:%M:%S");
}
//获取菜品分类信息
exports.getTypeStr =function(num){
	var data=getBinaStr(num);
	var str=""
	for(var i=0;i<data.length;i++){
		var n=Math.pow(2,i) * data[i];
		if(n==0)continue;
		if(str=="")str=n.toString();else str+="," + n.toString();
	}
	return str;
}

//获取验证码·未使用
exports.getKey=function(did,count){
	var rand=Math.round(Math.random() * 9);
	var bias;
	if(!arguments[1])count=4;
	switch(count){
		case 4:bias=Math.pow(rand,2) * count;break;//1-9675
		case 3:bias=rand * count * count ;break;//1-918;
		case 2:bias=rand + count ;break;//1-88;
		case 1:bias=rand + 1 ;break;//1-8;
	}
	var txt=(did+bias).toString();
	while(1){
		if(txt.length<count)txt="0" + txt;else break;
	}
	var newTxt="";
	for(var i=count-1;i>=0;i--)newTxt+=txt.substr(i,1);
	return newTxt + rand.toString();
}
//识别验证码桌号·未使用
exports.getDid=function(key){
	var key=key.toString();
	var count=key.length-1;
	var rand=parseInt(key.substr(count,1));
	var txt=key.substr(0,count);
	var newTxt="";
	for(var i=count-1;i>=0;i--)newTxt+=txt.substr(i,1);
	var rst=parseInt(newTxt);
	var bias;
	switch(count){
		case 4:bias=Math.pow(rand,2) * count;break;
		case 3:bias=rand * count * count ;break;
		case 2:bias=rand + count ;break;
		case 1:bias=rand + 1 ;break;
	}
	return rst-bias;
}

//获取唯一标示码·关键
exports.getOnlykey=function(did,count,rand){
	var tm=new Date();
	var y=tm.getFullYear()-2015;
	var m=tm.getMonth()+1;
	var d=tm.getDate();
	var h=tm.getHours();
	var tp=0;
	if(m>9)tp+=1;if(d>9)tp+=2;if(y>9)tp+=4;if(h>9)tp+=8;//月、日、年、时
	if(tp<10)tp="0" + tp.toString();
	var txtTM=tp + m.toString() + d.toString()+ y.toString() + h.toString(); // 
	if(!arguments[2])rand=Math.round(Math.random() * 9);
	var bias;
	if(!arguments[1])count=4;
	switch(count){
		case 4:bias=Math.pow(rand,2) * count;break;//1-9675
		case 3:bias=rand * count * count ;break;//1-918;
		case 2:bias=rand + count ;break;//1-88;
		case 1:bias=rand + 1 ;break;//1-8;
	}
	var txt=(did+bias).toString();
	while(1){
		if(txt.length<count)txt="0" + txt;else break;
	}
	var newTxt="";
	for(var i=count-1;i>=0;i--)newTxt+=txt.substr(i,1);
	var key1=newTxt + rand.toString();
	var key2=txtTM + did.toString() + rand.toString();
	var data={onlykey:key2,code:key1,rand:rand,did:did };
	return data;
}
//获取唯一标示码·二个
exports.getOnlykeys=function(did,count){
	var rand1=Math.round(Math.random() * 9);
	var rand2=Math.round(Math.random() * 9);
	while(rand1==rand2)rand2=Math.round(Math.random() * 9);
	var key1=this.getOnlykey(did,count,rand1);
	var key2=this.getOnlykey(did,count,rand2);
	return [key1,key2];
}

//识别唯一识别码·关键
exports.partOnlykey=function(key){
	key=key.toString();
	if(key=="")return null;
	try{
		var num=parseInt(key.substr(0,2));
		var rand=parseInt(key.substr(key.length-1,1));
		var bts=getBinaStr(num);
		var rst=key.substr(2,key.length-3);
		var TM=[];
		var index=2;
		for(var i=0;i<bts.length;i++){//月日年时
			var step=bts[i]==0?1:2;
			TM.push(key.substr(index,step));
			index+=step;
		}
		var did=key.substr(index,key.length-1-index);
		var data={year:parseInt(TM[2])+2015,month:TM[0],day:TM[1],hour:TM[3],did:did,rand:rand,key:key};
		return data;
	}
	catch(e){
		return null;
	}
}
//检测onlykey时间
exports.checkKeyTime=function(onlykey){
	var data=this.partOnlykey(onlykey);
	var tm=new Date();
	var y=tm.getFullYear();
	var m=tm.getMonth()+1;
	var d=tm.getDate();
	var h=tm.getHours();
	var rst={};
	if(data.year!=y || data.month!=m || data.day!=d || data.hour!=h){
		var keys=this.getOnlykeys(data.did,this.PUB_COUNT,data.rand);
		rst={rst:0, keys:keys};
	}else{
		rst={rst:1,keys:[]};
	}
	return rst;
} 

//处理菜单请求
function dealDish(data,Dish){
	var onlykey=data.onlykey;
	var rst=this.partOnlykey(onlykey);
	var uid=data.uid;			//人员
	var dish=data.dish.id;					//菜品
	var num=data.dish.num;					//数量
	var help=data.help?data.help:0;			  //代点	
	var mark=data.dish.mark?data.dish.mark:"";//备注
	var rOther=0;
	if(!Dish[onlykey]){		//不存在桌子
		if(num<0)return;
		var users={};
		var dishs={};
		dishs[dish]={ "id":dish,"count":num,"mark":mark };
		users[uid]={ dishList:dishs,"uid":uid,"help":help };
		Dish[onlykey]={ "onlykey":onlykey, "userList":users };
	}else{	//存在桌子
		var user=Dish[onlykey].userList[uid];
		if(!user){//不存在人
			if(num>0){//加人
				var dishs={};
				dishs[dish]={ "id":dish,"count":num,"mark":mark };
				Dish[onlykey].userList[uid]={ dishList:dishs,"uid":uid,"help":help };
			}else{//不加人·减他人菜
				rOther=1;
			}
		}else{//存在人
			if(!user.dishList[dish]){//个人不存在菜
				if(num>0){//加菜
					user.dishList[dish]={ "id":dish,"count":num,"mark":mark};
				}else{//不加菜·减他人菜
					rOther=1;
				}
			}else{//个人存在菜
				var countNow=user.dishList[dish].count + num;
				if(num>0){//加菜
					user.dishList[dish]={ "id":dish,"count":countNow,"mark":mark};
				}else{//减菜
					if(countNow>=0)
						user.dishList[dish].count = countNow;
					else{	//个人不够减·减他人菜
						rOther=1;
					}
				}//End	if num
			}//End	if 个人不存在该菜
		}//End if 不存在该人
	}//End if 不存在该桌
	if(rOther==0)return;
	var value=num;
	for(var e in Dish[onlykey].userList){
		if(e.uid==uid)continue;
		var user=Dish[onlykey].userList[e];
		if(user.dishList[dish]){
			value+= user.dishList[dish].count;
			if(value>0){
				user.dishList[dish].count=value;
				break;
			}else{
				user.dishList[dish].count=0;
			}
		}
	}
	return [value,Dish];
}







function cout(txt){console.log(txt);}
function out(txt){ console.dir(txt); }