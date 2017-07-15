
var GP = require('meap_pool');
var util = require("util");
var events = require("events");
function Session(taskfun,Response,Parent)
{
	
	var self = this;
	self.checktime = (new Date()).valueOf()+Parent.option.timeout*1000;
	LOG2("[meap_sessionpool][Session] SESSION CREATE ",self.checktime);
	self.Response = Response;
	self.TaskFun = taskfun;
	self.Parent = Parent;
	return self;
}
Session.prototype.Runner = function()
{
	var self = this;
	LOG1("[meap_sessionpool][Session][Runner] SESSION RUNNING");
	self.Response.MEAPEnd = self.Response.end;
	self.Response.end =function(param)
	{
		self.Parent.Next();
		self.Response.MEAPEnd(param);
	}
	self.TaskFun();
}
Session.prototype.timeout = function()
{
	var self = this;
	LOG1("[meap_sessionpool][Session][timeout] SESSION TIMEOUT");
	self.Response.statusCode = "503";
	self.Response.write(JSON.stringify({
		status : 14509,
		msg : "Session Wait Timeout",
		src : "Session Pool"
	}));
	self.Response.end();
}
function sessionPool(option)
{		
	if (this instanceof sessionPool) {
		var self = this;
		self.running = 0;
		self.option={};
		self.option.runmax = option.runmax?option.runmax:100;
		self.option.waitmax = option.waitmax?option.waitmax:0;
		self.option.timeout = option.timeout?option.timeout:30;
		self.option.sampling = self.option.waitmax?parseInt(Math.pow(self.option.waitmax,1/3)):0;
		self.Waiting = [];
		LOG2("[meap_sessionpool][sessionPool] CREATE REQ POOL", self.option);
		events.EventEmitter.call(self);	
		self.on("NEXT",function(){
			var check = (new Date()).valueOf();
			do
			{
				if(self.running >= self.option.runmax)
				{
					break;
				}
				var s = self.Waiting.shift();
				if (s) {
					if (s.checktime < check) 
					{
						s.timeout();
					}	
					else {
						self.running++;
						s.Runner();
					}
				}
			}while(self.Waiting.length>0)
			LOG2("[meap_sessionpool][sessionPool] NEXT ",self.running,self.Waiting.length);
		});		
		return self;
	}
	return new sessionPool(option);
}
util.inherits(sessionPool, events.EventEmitter);
sessionPool.prototype.Clear = function()
{
	var self = this;
	LOG2("[meap_sessionpool][sessionPool][Clear] CLEAR WAITING REQ POOL", self.Waiting.length);
	var sampling = self.option.sampling;
	if(sampling == 0)
		sampling = parseInt(self.Waiting.length / 3);
	if(sampling == 0)
		return;
	var check = (new Date()).valueOf();
	for(var i=sampling;i<self.Waiting.length;i+=sampling)
	{
		
		if(self.Waiting[i].checktime < check)
		{
			var sub = self.Waiting.splice(0,i+1);
			if(sub)
			{
				for(var n in sub)
				{
					sub[n].timeout();
				}				
			}
			break;
		}
	}
	LOG1("[meap_sessionpool][sessionPool][Clear] CLEAR WAITING REQ POOL END");
}
sessionPool.prototype.Next = function()
{
	this.running--;
	this.emit("NEXT", {});
}
sessionPool.prototype.Push = function(taskfun,Response){
	
	var self=this;
	LOG1("[meap_sessionpool][sessionPool][Push] PUSH NEW REQ");

	LOG2("[meap_sessionpool][sessionPool][Push] SESSIONPOOL INFO ",self.running , self.Waiting.length);
	if(self.Waiting.length >= self.option.waitmax && self.option.waitmax != 0)
	{
		LOG1("[meap_sessionpool][sessionPool][Push] POOL FULL");
		Response.statusCode = "503";
		Response.write(JSON.stringify({
								status : 14510,
								msg : "Session Pool is Full",
								src : "Session Pool"
							}));
		Response.end();
		return;
	}
	
	var s = new Session(taskfun,Response,this);
			
	if(self.running < self.option.runmax)
	{
		self.running++;
		LOG2("[meap_sessionpool][sessionPool][Push] RUN DIRECT ",self.running,self.Waiting.length);
		s.Runner();
	}
	else
	{
		LOG2("[meap_sessionpool][sessionPool][Push] WAIT RUN SESSION ",self.Waiting.length);
		self.Waiting.push(s);
		//self.Clear();
	}
}
exports.sessionPool = sessionPool;
