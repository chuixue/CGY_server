/**
 * ajaxServerEx.js
 */
var http = require('http');
var util = require('util');
var url = require('url');
var path = require('path');
var Database=require('./lib/database.js');
var Func = require('./lib/public.js'); 
var request = require('request');

var db=new Database();

var P_JOB=0;	//事务服务器是否就绪
post("/hello",{msg:"cinsServer1"},function(err,rst,body){	
	var data=JSON.parse(body);
	if(data.rst==1){ cout(data.msg);P_JOB=1; }
});


http.createServer(function (request, response) {
	cout('Request received: ');
    var params = url.parse(request.url, true);  
    var key = params.pathname;
    cout(key);
    //操作控制
    var PV={};	//数据提交
    var PV_D={};//服务员请求桌号验证码
    var PV_C={};//审核验证码
    var CK_K={};//验证码状态变更
    var PV_B={};//结算
    var PV_P={};//打印
    
     //单个请求
    if(key=="/keyNow"){ //返回已有桌子
	  	var data={};
	  	var id=params.query.did;
	  	var shopId=params.query.shopId;
	  	if(!PV_D[id])PV_D[id]=0;
	  	if(PV_D[id]!=0){
	  		data["error"]=2; cout("冲突");
	  		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
	  	}else{
	  		PV_D[id]=1;
	  		var del="delete from onlykey where okey not in (select * from (select min(okey) as col1 from onlykey where ostate=1 group by tid) as temp)";
	  		var sql="select distinct tid,okey,ostate,onlykey from onlykey where (ostate=1 or ostate=2) and sid=" + shopId;	  		
	  		getData(sql,function(txt){
	  			PV_D[id]=0;
	  			response.end(params.query.callback+'(' + txt + ')');
	    		cout("request: " + sql + " ,return: " + txt );
	    	});
	  	}
	 }//**************************************************************************************************
    /*·冲突
     *·使用中
     *·未使用
     *·未使用已过期 
     */
	 else if(key=="/keyCheck"){ //验证码审查
	  	var data={};
	  	var code=params.query.key;
	  	var shopId=params.query.shopId;
	  	if(!PV_C[code])PV_C[code]=0;
	  	if(PV_C[code]!=0){
	  		data["error"]=2;//冲突
	  		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
	  	}else{
	  		PV_C[code]=1;
	  		var sql="select onlykey,ostate from onlykey where sid="+ shopId +" and (ostate=1 or ostate=2) and okey=" + code + " order by okey";
	  		db.Select(sql,function(err,rst,index){
	  			if(err){
	  				PV_C[code]=0;
	  	     		data={ "error":1};
	  	     		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
	  	     	}else{
	  	     		var rstData={};
	    			if(index==0)rstData=rst; else if(index==1)rstData=rst[1];
	    			if(rstData.length==0){//无记录
	    				data={rst:0, onlykey:""};
	    				PV_C[code]=0;
	    				response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
	    			}else{
	    				var onlykey=rstData[0].onlykey;
	    				if(rstData[0].ostate==2){//验证通过·使用中
	    					data={ rst:1, onlykey:onlykey };
		    				PV_C[code]=0;
		    				response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
	    				}else{
	    					var ckt=Func.checkKeyTime(onlykey);
		    				if(ckt.rst==0){//超时
		    					var newKeys=ckt.keys;
		    					sql="UPDATE onlykey SET onlykey='"+ newKeys[0].key +"',ostate=2 WHERE sid="+ shopId +" and onlykey='" + onlykey + "'";
		    					db.Select(sql,function(error,result,index){
		    						PV_C[code]=0;
		    						if(error){
		    							data={ rst:0, onlykey:"" };
		    						}else{
		    							data={ rst:1, onlykey:newKeys[0].key };
		    						}
		    						response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
		    					});
		    				}else{//正常
		    					data={rst:1, onlykey:onlykey};//验证通过·未使用
		    					PV_C[code]=0;
			    				response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
			    				sql="UPDATE onlykey SET ostate=2 WHERE sid="+ shopId +" and onlykey='" + onlykey + "'";
			    				deal(sql);
		    				}//End if 超时
	    				}//End if ostate=2
	    			}//End if []
	  	     	}//End if err
	  		});//End Select
	  	}
	 }//**************************************************************************************************
	/*·第一次尝试
	 *·第二次尝试
	 */
     else if(key=="/key"){  //请求验证码·工作人员
     	var data={};
     	var id=params.query.did;
     	var shopId=params.query.shopId;
     	getKey(id,shopId);
     }//**************************************************************************************************
     else if(key=="/keyInfo"){  //请求店方验证状态：1-桌号，2-开启，3-无需桌号
    	var data={};
  		var shopId=params.query.shopId;
  		var noUser=params.query.noUser?parseInt(params.query.noUser):0;
  		var sql="select ccheck from configShop where sid='" + shopId + "'";
  		getData(sql,function(txt){
   	 		var rstData=JSON.parse(txt);
  			var cfg=1;
  			//var rstData=[];
  			//if(index==0)rstData=rst; else if(index==1)rstData=rst[1];
  			if(rstData.length!=0)cfg=rstData[0].ccheck;
  			setNewUser(function(userId){
  				data['uid']=userId;
  				if(cfg==3){//随机验证码
  					var keys=Func.getKeyRandoms();//一次请求两个验证码
  					var sql="INSERT INTO onlykey (onlykey, ostate, otime, sid) VALUES ";
  					sql+=sql+=Func.fStrs([[keys[0]], 1, "date", shopId]);
  					//var sql1=sql + "('"+ keys[0] + "',1,'" + Func.date() + "')";
  					db.Select(sql1,function(err,rst,index){
  						if(err){//第二个验证码
  							var sql2=sql + "('"+ keys[1].key + "',1,'" + Func.date() + "')";
  				     		db.Select(sql2,function(error,result,index){
  				     			if(error){
  				     				data={ "error":1}; data={ "message":error.message}; 
  				     				response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
  			 	     			}else{
  			 	     				data['check']=cfg; data['onlykey']=keys[1]; 
  			 	     				response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
  			 	     			}
  			 	     		});
  			 			}else{//第一个验证码
  			 				data['check']=cfg; data['onlykey']=keys[0]; 
  			 				response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
  			 			}
  			 		});
  				}else{
  					data['check']=cfg;
  					response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
  				}
  			});
  		});
  		
    }//**************************************************************************************************   
    else if(key=="/getKey"){  //请求验证码·关闭验证状态
    	var data={};
    	var id=parseInt(params.query.did);
    	var shopId=params.query.shopId;
    	if(id>0)
    	{
    	  	if(!PV_D[id])PV_D[id]=0;
    	  	if(PV_D[id]!=0){
    	  		data["error"]=2; cout("冲突");
    	  		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
    	  	}else{
    	  		PV_D[id]=1;
    	  		var sql="select distinct tid,okey,ostate,onlykey from onlykey where sid="+ shopId +" and (ostate=1 or ostate=2) and tid=" + id;	  		
    	  		db.Select(sql,function(error,result,index){//查询
 	     			if(error){
 	     				data={ "error":1}; data={ "message":error.message}; PV_D[id]=0;
 	     				response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
 	     			}else{
 	     				var rstData=[];
 		   	 			if(index==0)rstData=result; else if(index==1)rstData=result[1];
 		   	 			if(rstData.length==0){//不存在
 		   	 				getKey(id,shopId);
 		   	 			}else{//存在该桌号验证码
 		   	 				var index=-1;
 		   	 				for(var i=0;i<rstData.length;i++){ //查找该桌号使用中验证码
 		   	 					if(rstData[i].ostate==2){ index=i; break; }
 		   	 				}
 		   	 				if(index==-1){//无使用中
 		   	 					index=0;out(rstData[index]);
 		   	 					sql="update onlykey set ostate=2 where sid="+ shopId +" and onlykey='" + rstData[index].onlykey + "'";
 		   	 					subData(sql,function(txt){
 		   	 						data=rstData[index]; PV_D[id]=0;
 		   	 						response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
 		   	 					});
 		   	 				}else{//有使用中
 		   	 					data=rstData[index]; PV_D[id]=0;
 		   	 					response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
 		   	 				}//End index
 		   	 			}//End length
 	     			}//End error
 	     		});
 		   	}//End PV
    	}//End id
    }//**************************************************************************************************
     else if(key=="/dishclass"){
    	 var shopId=params.query.shopId;
    	 var sql="select did,ddescribe from dishclass where sid=" + shopId;
    	 db.Select(sql,function(err,rst,index){
    		 if(err){
    			 cout(err.message);
    		 }
    		 else{
    			 var data=[];
    			 var rstData=[];
    			 if(index==0)rstData=rst; else if(index==1)rstData=rst[1];
    			 for(var i=0;i<rstData.length;i++){
    				 data[i]={id:rstData[i].did, name:rstData[i].ddescribe};
    			 }
    			 var str=params.query.callback+'(' + JSON.stringify(data) + ')';
    			 cout(sql + " ,return: " + str );
    			 response.end(str);
    		 }
    	 });
     }//**************************************************************************************************
     else if(key=="/dish"){
    	 var shopId=params.query.shopId;
    	 var sql="select did,dname,dstyle,dimage,dprice,ddescribe,dcount,dreduce from dish where sid=" + shopId;	
    	 db.Select(sql,function(err,rst,index){
    	 	 if(err){
    	 		cout(err.message);
    	 	 }
    	 	 else{
    	 		 var data=[];
    	 		 var rstData=[];
    	 		 if(index==0)rstData=rst; else if(index==1)rstData=rst[1];
    	 		 for(var i=0;i<rstData.length;i++){
    	 			 var style=Func.getTypeStr(rstData[i].dstyle);
    	 			 data[i]={id:rstData[i].did, name:rstData[i].dname, type:style, describe:rstData[i].ddescribe,
    	 			          price:rstData[i].dprice, img:rstData[i].dimage,saleCount:rstData[i].dcount,reduce:rstData[i].dreduce};
    	 		 }
    	 		var str=params.query.callback+'(' + JSON.stringify(data) + ')';
    	 		cout("request: " + sql + " ,return: " + str );
    	 		response.end(str);
    	 	 }
    	 });
     }//**************************************************************************************************
    /*·冲突
     *·提交
     */
     else if(key=="/orderSub"){
    	 //验证key
    	 var onlykey=params.query.onlykey;
    	 var shopId=params.query.shopId;
    	 var uid=params.query.uid;
    	 var data={};
    	 if(!PV[onlykey])PV[onlykey]=0;
    	 if(PV[onlykey]!=0){
    		data["error"]=2; cout("冲突");
    		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
    	 }else{
    		 PV[onlykey]=1;
        	 var menu=JSON.parse(params.query.menusset);
        	 var isHelp=params.query.help;
        	 var sql="INSERT INTO orderinfo (did, uid, onlykey, ocount, ohelp, omark, ostate, obtime, sid) VALUES "; 
        	 for(var i=0;i<menu.length;i++){
        		 var did=menu[i].id;
        		 var count=menu[i].num;
        		 var mark="";
        		 if(menu[i].mark)mark=menu[i].mark;
        		 sql+=Func.fStrs([did, uid, [onlykey], count, isHelp, [mark], 0, "date", shopId ]);
        		 //sql+="("+ did + "," + uid + "," + onlykey + "," + count + "," + isHelp + ",'" + mark + "',0,'" + Func.date() + "')";
        		 if(i!=menu.length-1)sql+=",";
        	 }
        	 cout(sql);
        	 db.Query(sql,function(err,rst,index){
        		 if(err){
        			 cout(err.message);
        			 data["error"]=1;
        			 data["message"]=err.message;
        		 }
        		 else{
        			data["result"]=rst;
        			data["count"]=menu.length;
        		 }
        		 PV[onlykey]=0;
        		 response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
        	 });//End Query
    	 }
     }//**************************************************************************************************
    /*·冲突
     *·查询购物车
     *·更新购物车 
     *· 
     */
     else if(key=="/carSub"){//提交购物车
    	 //验证key
    	 var data={};
    	 var onlykey=params.query.onlykey;
    	 var shopId=params.query.shopId;
    	 var uid=params.query.uid;
    	 if(!PV[onlykey])PV[onlykey]=0;
    	 if(PV[onlykey]!=0){
    		data["error"]=2; 
    		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
    	 }else{
    		 PV[onlykey]=1;
    		 var st=(params.query.type==1)?" and uid=" + uid:"";//个人？全部
    		 var sql="select oid,did,uid,sum(ocount)as socount,ohelp,omark from carinfo where sid="+ shopId +" and onlykey='" + onlykey + "' and ostate=0" +st + " group by did";	
        	 db.Select(sql,function(err,rst,index){
        	 	 if(err){
        	 		cout(err.message);
        	 		data["error"]=1;
        	 	 }
        	 	 else{
        	 		 var rstData=[];
        	 		 var sql1="UPDATE carinfo SET ostate = 1 WHERE sid="+ shopId +" and onlykey='" + onlykey + "' and ostate=0" +st;	
        	 		 var sql2="INSERT INTO orderinfo (did, uid, onlykey, ocount, ohelp, omark, ostate, obtime, sid) VALUES ";
        	 		 if(index==0)rstData=rst; else if(index==1)rstData=rst[1];
        	 		 for(var i=0;i<rstData.length;i++){
        	 			 var mark=rstData[i].mark?rstData[i].mark:"";
        	 			 sql2+=Func.fStrs([rstData[i].did, rstData[i].uid, [onlykey], rstData[i].socount, rstData[i].ohelp, [mark],0, "date", shopId ]);   	 
        	 			 //sql2+="("+ rstData[i].did + "," + rstData[i].uid + "," + onlykey + "," + 
						//		rstData[i].ocount + ","+ rstData[i].ohelp + ",'" + mark + "',0,'" + Func.date() + "')";
						if(i!=rstData.length-1)sql2+=",";
        	 		 }//End for
        	 		 if(rstData.length==0){//购物车为空
        	 			 cout("购物车为空");
        	 			 data["result"]="购物车为空";
        	 			 data["count"]=0;
        	 			 PV[onlykey]=0;
        	 			 response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
        	 		 }else{
        	 			 db.queryAll(sql1 + ";" + sql2,function(errs,rsts,index){
		               		 if(errs){
		               			 cout(errs.message);
		               			 data["error"]=1;
		               			 data["message"]=errs.message;
		               		 }
		               		 else{
		               			data["result"]=rsts;
		               			data["count"]=rstData.length;
		               		 }
		               		 PV[onlykey]=0;
		                   	 response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
        	 			 });//End Query
	               	}
        	 	 }//End if
        	 });//End select
    	 }//End if PV
    }//**************************************************************************************************
    else if(key=="/order"){
    	//var sql="select oid,did,uid,onlykey,ocount,ostate,ohelp,omark,obtime,optime from orderinfo";
    	var onlykey=params.query.onlykey;
    	var uid=params.query.uid;
    	var shopId=params.query.shopId;
    	var st=(params.query.type==1)?" and uid=" + uid:"";//个人？全部
    	var sql="select * from orderinfo where sid="+ shopId +" and onlykey='" + onlykey + "'" + st;
    	getData(sql,function(txt){
    		response.end(params.query.callback+'(' + txt + ')');
    	 	cout("request: " + sql + " ,return: " + txt );
    	});
    }//**************************************************************************************************
    else if(key=="/car"){
    	//var sql="select oid,did,uid,onlykey,ocount,ostate,ohelp,omark,obtime,optime from orderinfo";
    	var onlykey=params.query.onlykey;
    	var uid=params.query.uid;
    	var shopId=params.query.shopId;
    	var st=(params.query.type==1)?" and uid=" + uid:"";//个人？全部
    	var sql="select * from carinfo where sid="+ shopId +" and onlykey='" + onlykey + "'" + st;
    	getData(sql,function(txt){
    		response.end(params.query.callback+'(' + txt + ')');
    		cout("request: " + sql + " ,return: " + txt );
    	});
    }//**************************************************************************************************
    else if(key=="/sql"){
    	if(!params.query.sql)return;
    	var sql=params.query.sql;
    	if(sql=='')return;
    	if(sql.substr(0, 6)!='select' && sql.substr(0, 6)!='SELECT' && sql.substr(0, 6)!='Select'){
    		response.end(params.query.callback+'(' + "未取得执行权限" + ')');	
    		return;
    	}
    	getData(sql,function(txt){
    		response.end(params.query.callback+'(' + txt + ')');
    	 	cout("request: " + sql + " ,return: " + txt );
    	});
    }
  //添加菜·请求
    else if(key=="/addDish"){
    	var RST={};
    	var shopId=params.query.shopId;
    	var sql="select did,ddescribe from dishclass where sid=" + shopId;
   	 	db.Select(sql,function(err,rst,index){
   	 		if(err){
   	 			cout(err.message);
   	 		}
   	 		else{
   	 			var data=[];
   	 			var rstData=[];
   	 			if(index==0)rstData=rst; else if(index==1)rstData=rst[1];
   	 			for(var i=0;i<rstData.length;i++){
   	 				data[i]={id:rstData[i].did, name:rstData[i].ddescribe};
   	 			}
   	 			RST["dishClass"]=data;
   	 		}
   	 		//请求图片
   	 		var sql="select * from image where iclass=1 and (itype=2 or sid=" + shopId + ")";
   	 		db.Select(sql,function(error,result,index){
   	 			if(!error){
	   	 			var rstData=[];
	   	 			if(index==0)rstData=result; else if(index==1)rstData=result[1];
	   	 			RST["imageDish"]=rstData;
	   	 		}
   	 			response.end(params.query.callback+'(' + JSON.stringify(RST) + ')');
   	 			cout("request: " + key + " ,return: " + JSON.stringify(RST) );
   	 		});
   	 	});
    }    
    //添加菜·提交
    else if(key=="/dishSub"){
    	var query=JSON.parse(params.query.data);
    	var dname=query.dname;
    	var dprice=parseFloat(query.dprice);
    	var dreduce=parseFloat(query.dreduce);
    	var dstate=query.dstate;
    	var dstyle=query.dstyle;
    	var wid=query.wid;
    	var ddescribe=query.ddescribe;
    	var dimage=query.dimage;
    	var data={};
    	var opid=query.user;
    	var shopId=query.shopId;
    	if(dname!="" && dprice>0){
    		var sql="INSERT INTO dish (dname, dprice, dreduce, dstate, dstyle, wid, ddescribe, dimage,opid,optime, sid) VALUES ";
    		sql+=Func.fStrs([[dname], dprice, dreduce, dstate, dstyle, [wid], [ddescribe], [dimage], [opid],"date",shopId]);
    		subData(sql,function(txt){
       	 		response.end(params.query.callback+'(' + txt + ')');
       	 		cout("sub data: " + sql + " ,return: " + txt );
       	 	});
    	}else{
    		data["error"]=1;
    		data["message"]="信息不全";
    		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
    	}
    }
    //添加分类·请求
    else if(key=="/addClass"){
    	var shopId=params.query.shopId;
   	 	var sql="select * from image where iclass=2 and (itype=2 or sid=" + shopId + ")";
   	 	getData(sql,function(txt){
   	 		response.end(params.query.callback+'(' + txt + ')');
   	 		cout("request: " + sql + " ,return: " + txt );
   	 	});
    }
    //添加分类·提交
    else if(key=="/classSub"){
    	var query=JSON.parse(params.query.data);
    	var ddescribe=query.ddescribe;
    	var dmark=query.dmark;
    	var dimage=query.dimage;
    	var shopId=query.shopId;
    	var opid=query.user;    	
    	var data={};
    	if(ddescribe!=""){
    		var sql1="select did from dishclass where sid=" + shopId + " order by did";
    		getData(sql1,function(txt){
    			var rst=JSON.parse(txt);
    			var ls={};
    			for(var i=0;i<rst.length;i++)ls[rst[i].did]=1;
    			var index=0;
    			while(true){
    				var tp=Math.pow(2,index++);
    				if(!ls[tp])break;
        		}
       	 		var newId=Math.pow(2,index-1);
	       	 	var sql="INSERT INTO dishclass (did,ddescribe, dmark, dimage, opid, optime, sid) VALUES ";
	    		sql+=Func.fStrs([newId, [ddescribe], [dmark], [dimage], [opid], "date", shopId]);
	    		cout(sql);
	    		subData(sql,function(txt){
	       	 		response.end(params.query.callback+'(' + txt + ')');
	       	 		cout("sub data: " + sql + " ,return: " + txt );
	       	 	});
       	 	});
    	}else{
    		data["error"]=1;
    		data["message"]="信息不全";
    		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
    	}
    }
    else if(key=="/orderList"){
    	var RST={};
    	var shopId=params.query.shopId;//join worker on dish.wid=worker.wid 
   	 	var sql="select * from orderinfo join dish on orderinfo.did=dish.did where orderinfo.ostate=0 and orderinfo.sid=" + shopId;
   	 	getData(sql,function(txt){
   	 		response.end(params.query.callback+'(' + txt + ')');
	 		cout("get data: " + sql + " ,return: " + txt );
   	 	});
    }
    else if(key=="/balance"){
    	var RST={};
    	var shopId=params.query.shopId;
    	var onlykey=params.query.onlykey;
   	 	var sql="select * from orderinfo join dish on orderinfo.did=dish.did where orderinfo.onlykey='" + onlykey + "' and orderinfo.sid=" + shopId;
   	 	getData(sql,function(txt){
   	 		response.end(params.query.callback+'(' + txt + ')');
	 		cout("get data: " + sql + " ,return: " + txt );
   	 	});
    }
    else if(key=="/balanceSub"){
    	var data={};
    	var RST={};
    	var query=JSON.parse(params.query.data);
    	var shopId=query.shopId;
    	var onlykey=query.onlykey;
    	var ids=query.ids;
    	var opid=query.pid;
    	if(!PV_B[onlykey])PV_B[onlykey]=0;
	  	if(PV_B[onlykey]!=0){
	  		data["error"]=2; cout("冲突");
	  		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
	  	}else{
	  		PV_B[onlykey]=1;
	   	 	var sql="select * from orderinfo join dish on orderinfo.did=dish.did where orderinfo.onlykey='" + onlykey + "' and orderinfo.sid=" + shopId;
	   	 	getData(sql,function(txt){
	   	 		var rst=JSON.parse(txt);
	   	 		var tp=[];
	   	 		var dCount=0;
	   	 		var money=0.0;
	   	 		if(!rst.error){
	   	 			for(var i=0;i<rst.length;i++){
	   	 				var id=parseInt(rst[i].oid);
	   	 				if(ids.indexOf(id)==-1)break;
	   	 				var price=parseFloat(rst[i].dprice) * parseFloat(rst[i].ocount);
	   	 				tp.push({id:id, price:price});
	   	 				money +=price;
	   	 				dCount+=parseInt(rst[i].ocount);
	   	 			}//End For
		   	 		var tpTxt1="";
		   	 		var tpTxt2="(";
		   	 		for(var i=0;i<tp.length;i++){
		   	 			tpTxt1+= "when " + tp[i].id + " then " + tp[i].price + " ";
		   	 			tpTxt2+=tp[i].id;
		   	 			if(i!=tp.length-1)tpTxt2+= ",";
		   	 		}//End For
		   	 		tpTxt2+=")";
		   	 		var sql1="update orderinfo set omoney=1,oprice=case oid " + tpTxt1 + "end where sid=" + shopId + " and oid in" + tpTxt2;
		   	 		var tid=-1;
		   	 		if(onlykey.substr(0,1)!="9")tid=Func.partOnlykey(onlykey).did;
		   	 		var pstate=rst.length==tp.length?3:2;
		   	 		var sql2="insert into paybill (onlykey,tid,pstate,optime,pdish,pall,opid,sid) VALUES ";
		   	 		sql2+=Func.fStrs([[onlykey], tid, pstate, "date", dCount, money, [opid], shopId]);
		   	 		if(tp.length>0){
		   	 			db.queryAll(sql1 + ";" + sql2,function(errs,rsts,index){
		              		 if(errs){
		              			 cout(errs.message);
		              			 data["error"]=1;
		              			 data["message"]=errs.message;
		              		 }
		              		 else{
		              			data["money"]=money;
		              			data["count"]=rst.length;
		              		 }
		              		 PV_B[onlykey]=0;
		                  	 response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
			 			 });//End Query
		   	 			
		   	 		}else{
		   	 			PV_B[onlykey]=0;
		   	 			data["error"]=1;
		   	 			data["message"]="清单为空";
		   	 			response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
		   	 		}//End tp
	   	 		}else{
	   	 			PV_B[onlykey]=0;
	   	 			response.end(params.query.callback+'(' + txt + ')');
	   	 			cout("get data: " + sql + " ,return: " + txt );
	   	 		}//End rst
	   	 	});//End getData
	   	}//End PV
    }
    else if(key=="/balanceCancel"){
    	var data={};
    	var RST={};
    	var query=JSON.parse(params.query.data);
    	var shopId=query.shopId;
    	var onlykey=query.onlykey;
    	var ids=query.ids;
    	var opid=query.pid;
    	if(!PV_B[onlykey])PV_B[onlykey]=0;
	  	if(PV_B[onlykey]!=0){
	  		data["error"]=2; cout("冲突");
	  		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
	  	}else{
	  		PV_B[onlykey]=1;
	  		var tpTxt1="";
	    	var tpTxt2="(";
	    	for(var i=0;i<ids.length;i++){
	    		tpTxt1+= "when " + ids[i] + " then -1 ";
				tpTxt2+=ids[i];
				if(i!=ids.length-1)tpTxt2+= ",";
	    	}
		 	tpTxt2+=")";
		 	var sql="update orderinfo set ostate=case oid " + tpTxt1 + "end where sid="+ shopId +" and oid in" + tpTxt2;
		 	if(ids.length>0){
			 	subData(sql,function(txt){
					PV_P[shopId]=0;
					response.end(params.query.callback+'(' + txt + ')');
				});
			 }else{
				PV_P[shopId]=0;
	   	 		data["error"]=1;
	   	 		data["message"]="清单为空";
	   	 		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
			 }
	   	}//End PV
    }
    else if(key=="/print"){
    	var data={};
    	var query=JSON.parse(params.query.data);
    	var shopId=query.shopId;
    	var ids=query.ids;
    	if(!PV_P[shopId])PV_P[shopId]=0;
	  	if(PV_P[shopId]!=0){
	  		data["error"]=2; cout("冲突");
	  		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
	  	}else{
	  		PV_P[shopId]=1;
	    	var tpTxt1="";
	    	var tpTxt2="(";
	    	for(var i=0;i<ids.length;i++){
	    		tpTxt1+= "when " + ids[i] + " then 1 ";
				tpTxt2+=ids[i];
				if(i!=ids.length-1)tpTxt2+= ",";
	    	}
		 	tpTxt2+=")";
		 	var sql="update orderinfo set oprint=case oid " + tpTxt1 + "end where sid="+ shopId +" and oid in" + tpTxt2;
		 	if(ids.length>0){
			 	subData(sql,function(txt){
					PV_P[shopId]=0;
					response.end(params.query.callback+'(' + txt + ')');
				});
			 }else{
				PV_P[shopId]=0;
	   	 		data["error"]=1;
	   	 		data["message"]="清单为空";
	   	 		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
			 }
		 }//End if
    }
    else if(key=="/dealOrder"){
    	var data={};
    	var shopId=params.query.shopId;
    	var id=params.query.id;
    	var type=params.query.type;
    	var opid=params.query.user;
    	if(!PV_P[shopId])PV_P[shopId]=0;
	  	if(PV_P[shopId]!=0){
	  		data["error"]=2; cout("冲突");
	  		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
	  	}else{
	  		PV_P[shopId]=1;
		 	var sql="update orderinfo set ostate="+ type +" where oid =" + id;
		 	if(type==-2)sql="update canceldish set ostate=3,opid='"+ opid +"',optime='"+ Func.date() +"' where oid =" + id + " and sid=" + shopId;
		 	subData(sql,function(txt){
				PV_P[shopId]=0;
				response.end(params.query.callback+'(' + txt + ')');
			});
	   	}//End PV
    }
    else if(key=="/checkUser"){
    	var userName=params.query.userName;
    	var sql="select * from worker where wname='" + userName + "'";
		getData(sql,function(txt){
			response.end(params.query.callback+'(' + txt + ')');
			cout("request: " + sql + " ,return: " + txt );
		});
    }
    else if(key=="/signin"){
    	var data={};
        var type=parseInt(params.query.type);
        var userName=params.query.userName;
        var passwd=params.query.passwd;
        var sql="";
        switch(type)
        {
        case 1:
	        var province=params.query.province;
	        var city=params.query.city;
	        var sName=params.query.shop;
	        var addr=params.query.addr;
	        var tel=params.query.tel;
   	 		var sql1="insert into worker (wid,wpasswd,wtel,wpower,wtime) VALUES ";
   	 		sql1 +=Func.fStrs([[userName], [passwd], [tel], 8, "date" ]);
   	 		var sql2="insert into shop (wid,sname,sprovince,scity,saddr,scode,stime) VALUES ";
	 		sql2 +=Func.fStrs([[userName], [sName], [province], [city], [addr], [""], "date" ]);   	 		
   	 		db.queryAll(sql1 + ";" + sql2,function(errs,rsts,insertID){
   	 			if(errs){
   	 				cout(errs.message);
   	 				data["error"]=1;
   	 				data["message"]=errs.message;
   	 			}else{
   	 				data["rst"]="OK";
   	 				sql="update worker set sid=" + insertID + " where wid='" + userName + "'";
   	 				deal(sql);
   	 			}
   	 			response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
   	 		});
        	break;
        case 2:
        	var shop=params.query.shop;
        	sql1="insert into worker (wid,wpasswd,sid,wtime) VALUES ";
        	sql1+=Func.fStrs([[userName], [passwd], shop,"date" ]);
        	subData(sql,function(txt){
        		response.end(params.query.callback+'(' + txt + ')');
			});
        	break;
        case 3:
        	var tel=params.query.tel;	
        	sql="select * from user where uname='" + userName + "' or utel='" + tel + "'";
        	sql1="insert into user (uname,upasswd,utel,utime) VALUES ";
	    	sql1+=Func.fStrs([[userName], [passwd], tel,"date" ]);
        	db.Select(sql,function(err,rst,index){
        		var rstData=[];
        		if(!err){ if(index==0)rstData=rst; else if(index==1)rstData=rst[1]; }
        		if(!err && rstData.length==0){
       				subData(sql,function(txt){
       		    		response.end(params.query.callback+'(' + txt + ')');
       				});
       			}else{
       				data['error']=1;
       				data['rst']='已被注册';
       				response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
       			}
       		});
        	break;
        }
      }
      else if(key=="/login"){
    	var data={};
    	var userName=params.query.userName;	
    	var passwd=params.query.passwd;
      	sql="select * from worker where wid='" + userName + "' and wpasswd='" + passwd + "'";
      	db.Select(sql,function(err,rst,index){
     		if(!err){
     			var rstData=[];
        		if(index==0)rstData=rst; else if(index==1)rstData=rst[1]; 
        		if(rstData.length==0)
        			data['error']=1;
        		else
        			data['shop']=rstData[0]['sid'];
     			response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
     		}else{
     			data['error']=3;
     			response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
     		}
     	});
        
      }
      else if(key=="/search"){
    	  var data=[];
    	  var shopId=params.query.shopId;
    	  var key=params.query.key;
    	  if(shopId && key){
    		  var sql="select * from dish where sid=" + shopId + "";
	    	  getData(sql,function(txt){
	    		  var rst=JSON.parse(txt);
	    		  var list=new Array();
	    		  for(var i=0;i<rst.length;i++){
	    			  list.push(rst[i].dname);
	    		  }
	    		  var lsSM=Func.getSearchByList(key,list);
	    		  for(var i=0;i<lsSM.length;i++){
	    			  var index=lsSM[i].index;
	    			  data[i]={id:rst[index].did, name:rst[index].dname, describe:rst[index].ddescribe, keys:lsSM[i].keys,
	    	 			          price:rst[index].dprice, img:rst[index].dimage,saleCount:rst[index].dcount,reduce:rst[index].dreduce};
	    		  }
	    		  response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
	    		  cout("request: " + sql + " ,return: " + JSON.stringify(data) );
	    	  });
    	  }
      }
      else if(key=="/callServer"){
    	  var data=[];
    	  var shopId=params.query.shopId;
    	  var onlykey=params.query.onlykey;
    	  var uid=params.query.uid;
    	  if(shopId && onlykey && uid){
    		  var sql="select * from callInfo where sid=" + shopId +" and onlykey='" + onlykey + "' and uid=" + uid + " order by cbtime limit 5";
    		  getData(sql,function(txt){
	    		  var rst=JSON.parse(txt);
	    		  for(var i=0;i<rst.length;i++){
	    			  data[i]={ id:rst[i].cid, state:rst[i].cstate, time:rst[i].cbtime };
	    		  }
	    		  response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
	    		  cout("request: " + sql + " ,return: " + JSON.stringify(data) );
    		  });
    	  }
      }    
      else if(key=="/view"){
    	  var data=[];
    	  var shopId=params.query.shopId;
    	  var sql="select * from image where sid=" + shopId +" and iclass=3";
		  getData(sql,function(txt){
    		  var rst=JSON.parse(txt);
    		  for(var i=0;i<rst.length;i++){
    			  data[i]={ url:rst[i].ipath, id:rst[i].iid };
    		  }
    		  response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
    		  cout("request: " + sql + " ,return: " + JSON.stringify(data) );
		  });
      }
      else if(key=="/**"){
        	

      }    
      else if(key=="/****"){
        	

      }      

    //通用获取数据过程
    function getData(sql,callback){
	   	db.Select(sql,function(err,rst,index){
	   		 if(err){
	   			var data={};
	   			data['error']=1;
	   			data['message']=err.message;
	   			callback(JSON.stringify(data));
	   		 }
	   		 else{
	   			 var rstData=[];
	   			 if(index==0)rstData=rst; else if(index==1)rstData=rst[1];
	   			 
	   			 callback(JSON.stringify(rstData));
	   		}
	   	});
    }
  //通用提交数据过程
  function subData(sql,callback){
	  db.Select(sql,function(error,result,index){
	 	if(error){
	 		data["error"]=2;
	 		data["message"]="更新数据错误";
	 		callback(JSON.stringify(data));
 	 	}else{
 	 		callback(JSON.stringify(result));
 	 	}
	 });
  }

  function setNewUser(callback){
	  var sql="insert into user (utime) values ";
	  sql+=Func.fStrs(["date"]);
	  db.Select(sql,function(error,result,index){
		 	if(error){
		 		callback(-1);
		 	}else{
		 		var rstData=[];
	   			if(index==0)rstData=result; else if(index==1)rstData=result[1];
		 		callback(rstData.insertId);
		 	}
		 });
	}
  //请求验证码
  function getKey(id,shopId){
	  id=parseInt(id);
	  if(id>0){
   		var keys=Func.getOnlykeys(id);//一次请求两个验证码
   		var sql="INSERT INTO onlykey (sid,onlykey,okey,tid,ostate,otime) VALUES ";   		
   		var sql1=sql + Func.fStrs([shopId, [keys[0].onlykey], keys[0].code, keys[0].did, 1, "date" ]);
   		//var sql1=sql + "('"+ keys[0].onlykey + "'," + keys[0].code + "," + keys[0].did + ",1,'" + Func.date() + "')";
   		db.Select(sql1,function(err,rst,index){
   			if(err){
   				var sql2=sql + Func.fStrs([shopId, [keys[1].onlykey], keys[1].code, keys[1].did, 1, "date" ]);
   				//var sql2=sql + "('"+ keys[1].onlykey + "'," + keys[1].code + "," + keys[1].did + ",1,'" + Func.date() + "')";
   	     		db.Select(sql2,function(error,result,index){
   	     			if(error){
   	     				data={ "error":1}; data={ "message":error.message}; PV_D[id]=0;
   	     				response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
   	     			}else{
   	     				data=keys[1]; PV_D[id]=0;
   	     				response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
   	     			}
   	     		});
   			}else{
   				data=keys[0]; PV_D[id]=0;
   				response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
   			}
   		});
   	}else{
   		data={ "error":2}; PV_D[id]=0;
   		response.end(params.query.callback+'(' + JSON.stringify(data) + ')');
   	}
  }    
}).listen(8003,Func.PUB_HOST);//cins.swpu.edu.cn:localhost:10.10.1.120
console.log('Server running on port http://cins.swpu.edu.cn:8003/');

//*************************************************************************
//移交请求至事务服务器·有回调
function post(key,data,callback)
{
   	request.post({
   		url: Func.PUB_URL + ':8006' + key,
   		headers: {
   	    	'Content-Type': 'application/json'
   		},
   		body: JSON.stringify(data)
   	},
   	function(error, response, body){
   		callback(error, response, body);
   	});
}
//移交请求至事务服务器·无回调
function send(key,data)
{
   	var path=arguments[1]?arguments[0]:"/db";
   	var dt=arguments[1]?arguments[1]:arguments[0];
   	request.post({
   		url: Func.PUB_URL + ':8006' + path,
   		headers: {
   	    	'Content-Type': 'application/json'
   		},
   		body: JSON.stringify(dt)
   	},
   	function(error, response, body){
   		cout(body);
   	});
}
//移交数据库操作
function sendEx(sql)
{
   	var path="/sql";
   	var dt={sql:sql};
   	send(path,dt);
}
//处理事务
function deal(sql){
	if(P_JOB==1){
		sendEx(sql);
	}else{
		db.Query(sql);
	}
}



//*************************************************************************

function cout(txt){ console.log(txt + "[" + Func.date() + "]"); }
function out(txt){ console.dir(txt); }
