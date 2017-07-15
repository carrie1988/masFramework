var MEAP = require("meap.js");
var mqtt = Require('mqtt');
var os = require("os");
var cluster = require('cluster');
var fs = require("fs");
var path = require('path');
var REDIS = require("meap_redis");
var redisPool = require("meap_redispool").redisPool;

var Publisher = require("meap_mqtt_publisher");
var Mapper = require("meap_mqtt_mapper");

var copyright = require("meap_copyright");

var masConf = JSON.parse(fs.readFileSync('/etc/MAS.conf'));

function run(id, config){
	if(!config.CopyRight && !global.DEBUG){
		return false;
	}
	
    var clientCounter = 0;
    
    var d;
    setInterval(function() {
    	d = new Date();
        console.log(d.toLocaleString(), "Clients conneted to this server : [", os.hostname(), "--", id, "] -- ", clientCounter);
//      mqttConnectionsCounter(0,0,0);
    },10000);
    LOG1("RUNNER", id);

    MEAP.MSG.Init(config.publisher);
    var mapper = new Mapper(config.queue ? config.queue: 2000);
    var publisher = new Publisher(mapper);

    function bindTopic(client, topic) {
        mapper.on(topic, client.eventHandler);
    }
    
//    function mqttConnectionsCounter(appid,send,success){
//    	if(counterRP){
//    		counterRP.countDefault("ANDROID|WORKER",id,os.hostname(),clientCounter,send,success);
//    	}
//    }

    var server = mqtt.createServer(function(client) {
    	var rip=client.stream.remoteAddress,rport=client.stream.remotePort;
        var self = this;
        client.msgId = 0;
        client.msgList = [];
        client.monitor = function() {
            clearTimeout(client.timer);
            if (client.msgList.length > 0) {
                client.timer = setTimeout(function() {
                    LOG1("[CLIENT TIMEOUT] ", client.id,rip,rport,client.msgList.length);
                    client.stream.destroy();
                }, 60000);
            }
        }
        LOG1("[CLIENT]",rip,rport);
        client.on('connect', function(packet) {
            client.connack({
                returnCode: 0
            });
            clientCounter++;
            client.id = packet.clientId;
//            mqttConnectionsCounter(0,0,0);
            LOG1(id, 'connect ', client.id,rip,rport);
            client.topics = [];
            client.eventHandler = function(message) {
                LOG1("[MESSAGE] --- ", message,rip,rport);
//                mqttConnectionsCounter(0,1,0);
                client.msgId++;
                client.msgList.push(message);
                client.monitor();
                client.publish({
                    topic: message[0],
                    payload: message[1],
                    qos: 2,
                    messageId: client.msgId
                });
            }
        });
        client.on('publish', function(packet) {});
        client.on('pubrec', function(packet) {
        	LOG1("pubrec",rip,rport);
            client.pubrel({
                messageId: packet.messageId
            });
        });

        client.on('puback', function(packet) {
            LOG1("[puback] --- ", packet,rip,rport);
            var msg = client.msgList.shift();
            if (msg[3] == 'single') publisher.del(msg[0], msg[2]);
            client.monitor();
        });
        client.on('pubcomp', function(packet) {
            LOG1("[pubcomp] --- ", packet,rip,rport);
            var msg = client.msgList.shift();
//            mqttConnectionsCounter(0,0,1);
            if (msg[3] == 'single') publisher.del(msg[0], msg[2]);
            client.monitor();
        });
        client.on('subscribe',
        function(packet) {
            var granted = [];
            for (var i = 0; i < packet.subscriptions.length; i++) {
                granted.push(packet.subscriptions[i].qos);
                var topic = packet.subscriptions[i].topic;
                if (client.topics.indexOf(topic) == -1) {
                    LOG2("[TOPIC]", i, topic,rip,rport);
                    bindTopic(client, topic);
                    client.topics.push(topic);
                    if (i >= 1) // single push
                    {
                        publisher.query(topic, function(err, msgList) {
                            if (!err && msgList.length) {
                                for (var i in msgList) {
                                    var msg = JSON.parse(msgList[i]);
                                    client.msgId++;
                                    client.msgList.push([msg.routingKey, msg.data, msg.msgId, msg.pushType]);
                                    client.monitor();
                                    LOG2("[PUSH]", msg.routingKey, msg.data, msg.msgId,rip,rport);
                                    client.publish({
                                        topic: msg.routingKey,
                                        payload: msg.data,
                                        qos: 2,
                                        messageId: client.msgId
                                    });
                                }
                            }
                        });
                    }
                }
            }
            client.suback({
                granted: granted,
                messageId: packet.messageId
            });
        });

        client.on('pingreq', function(packet) {
        	LOG1("pingreq",rip,rport);
            client.pingresp();
        });

        client.on('disconnect', function(packet) {
        	LOG1("Client disconnect",rip,rport);
            client.stream.end();
        });

        client.on('close', function(err) {
            clientCounter -= ((clientCounter <= 0) ? 0 : 1);
            LOG1("[CLIENT CLOSE", client.id,rip,rport);
//            mqttConnectionsCounter(0,0,0);
            for (var i in client.topics) {
                try {
                    mapper.removeListener(client.topics[i], client.eventHandler);
                } catch(e) {
                    LOG1("UNBIND ERROR", e.message);
                }
            }
            delete this;
        });

        client.on('error', function(err) {
            client.stream.end();
            LOG1("Client error", err,rip,rport);
        });
    }).listen(config.port ? config.port: 1883);
}

function Cluster(config) {
	if(global.setLoggerState){
		setLoggerState(config.logstate);
	}
	MEAP.MSG.Init({host:masConf.basicchannel.host, port:masConf.basicchannel.port, db:masConf.basicchannel.db});
	MEAP.MSG.Listener(masConf.Globalmonitorchannel, function(err, message) {
		try {
			if(!err) {
				var msg = JSON.parse(message);
				if(msg.service !== config.servicename)
					return;
				switch(msg.action){
					case 'startlog':
						setLoggerState(true);
						break;
					case 'stoplog':
						setLoggerState(false);
						break;
				}
			}
		} catch(e) {
			_ERROR("[MQTT][Listener][ERROR]",e.message);
		}
	}, function() {
		LOG1("[MQTT][Listener] READY");
	});
	
	copyright.checkCopyright(function(err, result) {
        if (err == 1 && !global.DEBUG) {
            var numCPUs = config.cpus;
            if (cluster.isMaster && numCPUs>1) {
                LOG1("[MQTT] INFO: MEAP RM START - WORKERS NUM(", numCPUs, ")");
                for (var i = 0; i < numCPUs; i++) {
                    cluster.fork();
                }
                cluster.on("exit", function(worker, code, singal) {
                    LOG1("[MQTT] WORKER DIED");
                    cluster.fork();
                });
            } else {
                LOG1("[MQTT] INFO: MEAP RM WORKER RUNNING ", (numCPUs>1)?cluster.worker.id:0);
                config.CopyRight = true;
                run((numCPUs>1)?cluster.worker.id:0, config);
            }
        } else {
        		config.CopyRight = false;
        		run(0, config);
        }
    });
}
exports.Runner = Cluster;