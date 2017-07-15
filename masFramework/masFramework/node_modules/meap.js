global.LOG = global.LOG1 = global.LOG2 = global.LOG3 = global.LOG4 = global.LOG5 = global.LOGP = function(){};
global._INFO = console.info;
global._WARN = console.warn;
global._ERROR = console.error;
global.setLoggerState = function(state){
	if(state){
		global.LOG = global.LOG1 = global.LOG2 = global.LOG3 = global.LOG4 = global.LOG5 = global.LOGP = console.log;
	}else{
		global.LOG = global.LOG1 = global.LOG2 = global.LOG3 = global.LOG4 = global.LOG5 = global.LOGP = function(){};
	}
}
global.cluster = 1;
process.argv.forEach(function (val, index, array) {
  var param = val.substr(0,2);
  var value = val.substr(2);
  switch(param=='-c'?param:val)
  {
  	case "-L":
  		global.LOG = global.LOG1 = global.LOG2 = global.LOG3 = global.LOG4 = global.LOG5 = global.LOGP = console.log;
	break;
  	case "-l":
  		global.LOG = console.log;
  	break;
  	case "-l1":
  		global.LOG1 = console.log;
  	break;
  	case "-l2":
  		global.LOG2 = console.log;
  	break;
  	case "-l3":
  		global.LOG3 = console.log;
  	break;
  	case "-l4":
  		global.LOG4 = console.log;
  	break;
  	case "-l5":
  		global.LOG5 = console.log;
  	break;
	case "-s":
		global.single =  1;
	break;
	case "-c":
		global.cluster =  value?value:require('os').cpus().length;
		/*if(global.cluster > require('os').cpus().length)
			global.cluster = require('os').cpus().length;
		*/
	break;
	case "-n":
		global.NORF =  1;
	break;
	case "-p":
		global.LOGP = console.log;
	break;
	case "-d":
		global.DEBUG = true;
	break;
	case "-w":
		global.Worker = true;
	break;
	case "-nomam":
		global.noMAM = true;
	break;
	case "-rl":
		global.RobotLOG = true;
	break;
	case "-re":
		global.RobotERR = true;
	break;
  }
});

try {
	var RM = require("meap_rm");
	exports.ROBOT_MANAGER = RM.ROBOT_MANAGER;
} catch(e) {
	//LOG("[MEAP RM require error]:",e);
	_ERROR("[meap][RM][ERROR]:",e);
}

try {
	var IM = require("meap_im");
	exports.AJAX = IM.AJAX;
	exports.WEBRW = IM.WEBRW;
	exports.PARSER = IM.PARSER;
	exports.GBK = IM.GBK;
	exports.MSG = IM.MSG;
	exports.SFS = IM.SFS;
	exports.SOAP = IM.SOAP;
	exports.REQPOOL = IM.REQPOOL;
	//exports.ODBC = IM.ODBC;
	exports.LDAP = IM.LDAP;
	//exports.MYSQL = IM.MYSQL;
	exports.TMPL = IM.TMPL;
	exports.JAVA = IM.JAVA;
	exports.JDBC = IM.JDBC;
	exports.AXIS = IM.AXIS;
	exports.SFCACHE = IM.SFCACHE;
} catch(e) {
	//LOG("[MEAP IM require error]:",e);
	_ERROR("[meap][IM][ERROR]:",e);
}

try {
	var mqtt = require("meap_mqtt_server");
	exports.MQTT = mqtt;
} catch(e) {
	//LOG("[MEAP RM require error]:",e);
	_ERROR("[meap][MQTT][ERROR]:",e);
}

if(!global.DEBUG){
	process.on('uncaughtException', function(err){
		//LOG("[PROCESS ----- ]Caught exception : ", err);
		_ERROR("[meap][ERROR]:", err);
	});
}

console.log("-----------------------------------------[MAS] VERSION 4.0.4---------------------------------------------");
/*Change LOG*/
/*VERSION 4.0.4
The service starts is set to full path
The distinction between import Service
The revised jar package upload copy mode, disk reads and writes across a problem
JAVA unified JDBC initialization process
*/

/*Change LOG*/
/*VERSION 4.0.3
Add monitoring information display
*/

/*VERSION 4.0.2
Add Tag caching method : savePrivateCacheByUser, savePrivateByUserEXPCache
Adding Backup Interface Engineering
Modify the local log and push logs coexist
*/

/*VERSION 4.0.1
Adding automatic cache
Adding JDBC configuration
Modify the certificate information is stored to mongodb
Modify the application of information is stored to mongodb
Modify the interface authentication information stored in mongodb
*/

/*VERSION 4.0
Adding automatic cache
Adding JDBC configuration
Modify the certificate information is stored to mongodb
Modify the application of information is stored to mongodb
Modify the interface authentication information stored in mongodb
*/
