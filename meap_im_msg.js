/**
 * @author qinghua.zhao
 */
var REDIS = require("meap_redis");
var host = "127.0.0.1";
var port = 6379;
var db = 0;
var auth_pass;

function sub(channel,callback,ready,timeout)
{
	if(!timeout)
	   timeout = 60;
	var state = false;
	var Client = REDIS.createClient(port, host,{'auth_pass':auth_pass});
	var timeout = setTimeout(function(){
    	callback(-2,"listen msg time out");
    	Client.end();
    },timeout*1000);
    Client.on("ready", function(){
        if(!state)
        { 
          state = true;
          Client.subscribe("meap_msg_"+channel);
        }
    });
    Client.on("error", function(e){
    	clearTimeout(timeout);
			callback(-1,e.message);
    });
    Client.on("subscribe",function (channel, count){
    	if(ready)
    		ready(0,channel,count);
    });
    Client.on("message", function (ch, message){
    	//LOG5("[MEAP MSG] RECV MSG", ch , message);
		LOG3("[meap_im_msg][sub] RECV MSG", ch , message);
    	clearTimeout(timeout);
    	if(("meap_msg_"+channel) === ch)
    	{
    		callback(0,message);
    	}
    	Client.unsubscribe();
    	Client.quit();
    });
    Client.on("end", function(){
    });
    return Client;
}

function listener(channel,callback,ready)
{
    var state = false;
    var Client = REDIS.createClient(port, host,{'auth_pass':auth_pass});
    Client.on("ready", function(){
        if(!state)
        { 
          state = true;
          Client.subscribe("meap_msg_"+channel);
        }
    });
    Client.on("error", function(e){
        if(!state)
            callback(-1,e.message);
    });
    Client.on("subscribe",function (channel, count){
        if(ready)
            ready(0,channel,count);
    });
    Client.on("message", function (ch, message){
        //LOG5("[MEAP MSG] RECV MSG", ch , message);
        LOG3("[meap_im_msg][listener] RECV MSG", ch , message);
        if(("meap_msg_"+channel) === ch)
        {
            callback(0,message);
        }
    });
    Client.on("end", function(){
    });
    return Client;
}

function pub(channel,message,callback)
{
	var Client = REDIS.createClient(port, host,{'auth_pass':auth_pass});
    Client.on("ready", function(){
	//LOG5("[MEAP MSG] PUB READY " ,"meap_msg_"+channel);
	//LOG2("[meap_im_msg][pub] PUB READY " ,"meap_msg_"+channel);
        Client.publish("meap_msg_"+channel,message);
        Client.quit();
    });
    Client.on("error", function(e){
		callback(-1,e.message);
    });
    Client.on("end", function(){
    	callback(0 ,'');
    });
}

function init(option)
{
	host = option.host?option.host:"127.0.0.1";
	port = option.port?option.port:6379;
	db = option.db?option.db:0;
	auth_pass = option.authpass?option.authpass:undefined;
}

function client(callback)
{
	var state = false;
	var Client = REDIS.createClient(port, host,{'auth_pass':auth_pass});
    Client.on("ready", function(){
    	Client.select(db, function(){
    		if(!state){
            	state = true;
            	callback(0,Client);
    		}
        });
    });
    Client.on("error", function(e){
        if(!state)
        	callback(-1,e.message);
    });
}

exports.Subscribe=sub;
exports.Publish=pub;
exports.Client=client;
exports.Listener = listener;
exports.Init=init;