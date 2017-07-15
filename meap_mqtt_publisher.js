var events = require("events");
var util = require("util");
var MEAP = require("meap.js");

function Publisher(mapper)
{
  var self = this;
  this.mapper = mapper;
  events.EventEmitter.call(this);
  this.Runner();
  MEAP.MSG.Client(function(err,channel){
    if(!err){
 	LOG("Channel Created");
	self.Channel = channel;
    }
  });
  return this;
}

util.inherits(Publisher,events.EventEmitter);
Publisher.prototype.Runner = function(){
  var self = this;
  var client = MEAP.MSG.Listener("broadcast",function(err,message){
        try{
        	if(!err){
                var msg = JSON.parse(message);
                console.time("PUBLISH");
                var result = self.mapper.emit(msg.routingKey,[msg.routingKey,msg.data,msg.msgId,msg.pushType]);
                console.timeEnd("PUBLISH");
        	}
        }
        catch(e)
        {
            LOG("[PUBLISH ERROR]",e.message);
        }
  },function(){console.log("[READY]")});
}

Publisher.prototype.del = function(key,msgId)
{
  LOG4("REMOVE ",key+"~"+msgId);
  if(this.Channel){
    this.Channel.del(key+"~"+msgId);
  }
}

Publisher.prototype.query = function(key,callback)
{
  var self = this;
  if(this.Channel){
    LOG4("QUERY ",key);
    this.Channel.keys(key+"~*",function(err,msgList){
	LOG4("[KEYS]",err,msgList);
	if(!err	&& msgList.length)
	{
	    self.Channel.mget(msgList,callback);
	}
    });
  }
}

module.exports = Publisher;
