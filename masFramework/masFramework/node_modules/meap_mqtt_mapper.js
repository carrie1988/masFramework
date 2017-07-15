var events = require("events");
var util = require("util");
var crc16 = require("meap_mqtt_crc16");

function Queue(n)
{
    events.EventEmitter.call(this);
    this.setMaxListeners(n?n:1000000);
    return this;
}
util.inherits(Queue,events.EventEmitter);

function Mapper(n,m)
{
    this.Queues = {};
    this.Size = n;
    for(var i=0;i<n;i++)
    {
        this.Queues[i] = new Queue(m);
    }
    return this;
}
Mapper.prototype.calculateIndex = function(name)
{
    return parseInt(crc16(name)%this.Size);
}
Mapper.prototype.on = function(name,handler)
{
    var d = this.calculateIndex(name);
    this.Queues[d].on(name,handler);
}

Mapper.prototype.emit = function(name,data)
{
    var d = this.calculateIndex(name);
    return this.Queues[d].emit(name,data);
}
Mapper.prototype.removeListener = function(name,handler)
{
    var d = this.calculateIndex(name);
    this.Queues[d].removeListener(name,handler);

}

module.exports = Mapper;
