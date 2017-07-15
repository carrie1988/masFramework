//var AJAX = require('meap_im_req_ajax');
var JAVA = require('meap_im_java');
var Config = require("meap_rm_service_cfg");
var IFConfig = require("meap_rm_interface_cfg");
var RBTContext = require("meap_rm_robot_context").RBTContext;
var p = require('path');
var os = require("os");
var url = require("url");
var q = require("querystring");
var CookieMan = require("meap_cookieman").CookieMan;
var CacheMan = require("meap_cacheman").CacheMan;
//增加自定义缓存池
var CacheManCustom = require("meap_cacheman_custom").CacheMan;
var redisPool = require("meap_redispool").redisPool;
var jdbcPool = require("meap_jdbcpool").jdbcPool;
var REDIS = require("meap_redis");
var crypto = require('crypto');
var mongoose = Require("mongoose");
var SCHEMA = require('meap_policy_schema');
var proParser = require('meap_xml').parseproperties;
var async = Require("async");
var http = require("http");
var fs = require("fs");

function JDBCMan(Context) {
    this.Context = Context;

    this.BasicCon = mongoose.createConnection('mongodb://' + this.Context.BasicMDB.user + ':' + this.Context.BasicMDB.pass + '@' + this.Context.BasicMDB.host + ":" + this.Context.BasicMDB.port + '/' + this.Context.BasicMDB.db, {
        server: {
            poolSize: 1
        }
    });
    this.jdbcModel = this.BasicCon.model('mas_javas', SCHEMA.jdbcSchema);

    this.Context.JDBC = {};
    this.Context.JDBCPOOLMAN = {};
}

JDBCMan.prototype.Init = function () {
    var self = this;

    self.jdbcModel.find({
        service: self.Context.Options.servicename,
        type: 'jdbc'
    }, '-_id', function (err, data) {
        if (!err && data[0]) {
            for (var i in data) {
                switch (data[i]['conf']['jdbcDrive']) {
                    case "oracle11g":
                        self.Context.JDBC[data[i]['javaExtEnName']] = {
                            drivername: 'oracle.jdbc.driver.OracleDriver',
                            url: 'jdbc:oracle:thin:@' + data[i]['conf']['jdbcHost'] + ':' + data[i]['conf']['jdbcPort'] + '/' + data[i]['conf']['jdbcDatabase'],
                            user: data[i]['conf']['jdbcUser'],
                            password: data[i]['conf']['jdbcPass']
                        };
                        break;
                    case "mysql":
                        self.Context.JDBC[data[i]['javaExtEnName']] = {
                            drivername: 'com.mysql.jdbc.Driver',
                            url: 'jdbc:mysql://' + data[i]['conf']['jdbcHost'] + ':' + data[i]['conf']['jdbcPort'] + '/' + data[i]['conf']['jdbcDatabase'] + '?useUnicode=true&characterEncoding=utf-8',
                            user: data[i]['conf']['jdbcUser'],
                            password: data[i]['conf']['jdbcPass']
                        };
                        break;
                    case "sqlserver2005":
                        self.Context.JDBC[data[i]['javaExtEnName']] = {
                            drivername: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
                            url: 'jdbc:sqlserver://' + data[i]['conf']['jdbcHost'] + ':' + data[i]['conf']['jdbcPort'] + ';DatabaseName=' + data[i]['conf']['jdbcDatabase'],
                            user: data[i]['conf']['jdbcUser'],
                            password: data[i]['conf']['jdbcPass']
                        };
                        break;
                    case "sqlserver2008":
                        self.Context.JDBC[data[i]['javaExtEnName']] = {
                            drivername: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
                            url: 'jdbc:sqlserver://' + data[i]['conf']['jdbcHost'] + ':' + data[i]['conf']['jdbcPort'] + ';DatabaseName=' + data[i]['conf']['jdbcDatabase'],
                            user: data[i]['conf']['jdbcUser'],
                            password: data[i]['conf']['jdbcPass']
                        };
                        break;
                }
                self.Context.JDBCPOOLMAN[data[i]['javaExtEnName']] = jdbcPool(self.Context.JDBC[data[i]['javaExtEnName']]);
            }
        }
        LOG1("[meap_rm_robot_manager_context][RMContext]loadJDBC END", err, self.Context.JDBC, self.Context.JDBCPOOLMAN);
    });
}
function VerifyManager(Context) {
    this.Context = Context;

    this.policyCon = mongoose.createConnection('mongodb://' + this.Context.PolicyMDB.user + ':' + this.Context.PolicyMDB.pass + '@' + this.Context.PolicyMDB.host + ":" + this.Context.PolicyMDB.port + '/' + this.Context.PolicyMDB.db, {
        server: {
            poolSize: 1
        }
    });
    this.appModel = this.policyCon.model('MAM_APP_KEY_POOL', SCHEMA.appSchema);
    this.certModel = this.policyCon.model('MAM_APP_PEM_POOL', SCHEMA.certSchema);
    this.interfModel = this.policyCon.model('MAM_APP_POLICY_POOL', SCHEMA.interfSchema);
    this.accessModel = this.policyCon.model('MAM_APP_ACCESS_POOL', SCHEMA.accessSchema);

    this.appKeys = {};
    this.fingerPrint = {};
    this.appPolicy = {};
    this.appAccess = {};
}

VerifyManager.prototype.Init = function () {
    var self = this;
    var policies = ['appKeys', 'fingerPrint', 'appPolicy', 'appAccess'];
    async.mapSeries(policies, function (item, cb) {
        switch (item) {
            case 'appKeys':
                self.appModel.find({}, '-_id', function (err, data) {
                    LOG1("[meap_rm_robot_manager_context][RMContext]VerifyMan INIT MAM_APP_KEY_POOL", err);
                    if (!err) {
                        for (var i in data) {
                            self.appKeys[data[i]['appid']] = data[i]['appkey'];
                        }
                    }
                    cb(0);
                });
                break;
            case 'fingerPrint':
                self.certModel.find({}, '-_id', function (err, data) {
                    LOG1("[meap_rm_robot_manager_context][RMContext]VerifyMan INIT MAM_APP_PEM_POOL", err);
                    if (!err) {
                        for (var i in data) {
                            self.fingerPrint[data[i]['pem']] = data[i];
                        }
                    }
                    cb(0);
                });
                break;
            case 'appPolicy':
                self.interfModel.find({}, '-_id', function (err, data) {
                    LOG1("[meap_rm_robot_manager_context][RMContext]VerifyMan INIT MAM_APP_POLICY_POOL", err);
                    if (!err) {
                        for (var i in data) {
                            self.appPolicy[data[i]['appid']] = data[i]['services'];
                        }
                    }
                    cb(0);
                });
                break;
            case 'appAccess':
                self.accessModel.find({}, '-_id', function (err, data) {
                    LOG1("[meap_rm_robot_manager_context][RMContext]VerifyMan INIT MAM_APP_ACCESS_POOL", err);
                    if (!err) {
                        for (var i in data) {
                            self.appAccess[data[i]['appid']] = data[i]['services'];
                        }
                    }
                    cb(0);
                });
                break;
        }
    }, function (err, result) {
        LOG1("[meap_rm_robot_manager_context][RMContext]VerifyMan END", self.appKeys, self.appPolicy, self.appAccess);
    });
}

VerifyManager.prototype.CheckCert = function (fp, id) {
    var pem = this.fingerPrint[fp];
    if (!pem)
        return false;
    var ts = (new Date()).valueOf();
    if (pem.appId == id && pem.status && pem.deadlineAt.time > ts) {
        return true;
    }
    return false;
}

VerifyManager.prototype.CheckApp = function (appid, code, ts, appValidTime) {
    try {
        var appkey = this.appKeys[appid];
        if (appkey) {
            var md5 = crypto.createHash('md5');
            md5.update(appid + ":" + appkey + ":" + ts);
            var md5Data = md5.digest("hex");
            var currentTime = Date.now();
            if (md5Data == code && ts >= currentTime - appValidTime && ts <= currentTime + appValidTime) {
                return true;
            }
        }
        return false;
    } catch (e) {
        _ERROR("[meap_rm_robot_manager_context][VerifyManager][CheckApp][ERROR] APPID NOT FOUND");
        return false;
    }
}

VerifyManager.prototype.CheckIfPolicy = function (appid, servicename, subservice, i_f) {
    //var appif = this.appPolicy[appid+"~"+servicename];
    var appif = this.appPolicy[appid];
    try {
        if (appif) {
            if (appif[servicename][subservice][i_f.type][i_f.name]['checked'] == true)
                return true;
        }
        return false;
    } catch (e) {
        _ERROR("[meap_rm_robot_manager_context][VerifyManager][CheckIfPolicy][ERROR] CheckIfPolicy error", e.message);
        return false;
    }
}
function RMContext(path) {
    LOG1("[meap_rm_robot_manager_context][RMContext] CREATE RMCONTEXT");
    this.workpath = path;
    this.Concurrent = 0;
    this.incommingTrans = 0;
    this.Filter = [];
    this.configpath = p.join(path, "CA");
    this.authPool = {};
    this.interfaceTypeNames = [];
    this.interfaces = [];
    Config.Runner(this);
    //if(!global.Worker) return;
    IFConfig.Runner(this);
    //LOG("Support Interface ",this.interfaces);
    this.VerifyMan = new VerifyManager(this);
    this.VerifyMan.Init();
    this.CookieMan = new CookieMan(this);
    this.CacheMan = new CacheMan(this);
    //加载自定义缓存库
    this.CacheManCustom = new CacheManCustom(this);
    JAVA.Init(path);
    this.JDBCMan = new JDBCMan(this);
    this.JDBCMan.Init();

    this.POOL = redisPool(this.AuthPoolOption.db ? this.AuthPoolOption.db : 1, this.AuthPoolOption.poolsize, this.AuthPoolOption.host, this.AuthPoolOption.port, this.AuthPoolOption.authpass);
    this.AuthPoolOption.slaveHost && this.AuthPoolOption.slavePort && (this.POOLS = redisPool(this.AuthPoolOption.db ? this.AuthPoolOption.db : 1, this.AuthPoolOption.poolsize, this.AuthPoolOption.slaveHost, this.AuthPoolOption.slavePort, this.AuthPoolOption.authpass));


    //加载属性文件(格式为properties文件):同一个服务下多个工程可能出现同名属性变量被覆盖的现象!!
    try {
        var propertiesPath;
        var propertiesFile;
        var reg = new RegExp("(\\.properties)$");
        for (var i = 0; i < this.Projects.length; i++) {
            propertiesPath = this.workpath + "/interface/" + this.Projects[i];
            var files = fs.readdirSync(propertiesPath);
            files.forEach(function (filename) {
                //判断如果文件名为.properties格式，则加载应用环境配置
                if (reg.test(filename)) {
                    //加载properties文件
                    propertiesFile = propertiesPath + '/' + filename;
                    var keyValues = proParser(propertiesFile);
                    _INFO("[meap_rm_robot_manager_context][RMContext][Load Properties file][" + propertiesFile + "]");
                    for (var field in keyValues) {
                        global[field] = keyValues[field];
                        _INFO("[meap_rm_robot_manager_context][RMContext][Load Properties file][" + field + "][" + global[field] + "]");
                    }
                }
            });

        }
    } catch (e) {
        _ERROR("[meap_rm_robot_manager_context][RMContext][ERROR] Load properties ." + e.message);
    }

    //加载Initialize.js文件:
    try {
        var INIT;
        var initFilePath;
        for (var i = 0; i < this.Projects.length; i++) {
            initFilePath = this.workpath + "/interface/" + this.Projects[i] + "/Initialize.js";
            INIT = global.Require(p.join(initFilePath));
            _INFO("[meap_rm_robot_manager_context][RMContext][execute Initialize.js file][" + initFilePath + "]");
            INIT.Runner(this);
        }
    } catch (e) {
        _ERROR("[meap_rm_robot_manager_context][RMContext][ERROR] No Customer Init FUNCTION DEFINED." + e.message);
    }
}

RMContext.prototype.authPush = function (obj, expire, cb) {
    this.POOL.Runner(function (Client) {
        if (Client) {
            Client.HMSET("auth~" + obj.sid, "DATA", JSON.stringify(obj), "STATUS", "1");
            Client.EXPIRE("auth~" + obj.sid, expire ? expire : (global.liveTime ? global.liveTime : 86400), function (err, data) {
                Client.Release();
                if (cb)
                    cb(0);
            });
        } else {
            if (cb)
                cb(-1);
        }
    });
}

RMContext.prototype.authPop = function (obj, cb) {
    this.POOL.Runner(function (Client) {
        if (Client) {
            Client.DEL("auth~" + obj.sid, function (err, data) {
                Client.Release();
                if (cb)
                    cb(0);
            });
        } else {
            if (cb)
                cb(-1);
        }
    });
}

RMContext.prototype.BuildRobot = function (appid, sid, cb, pub) {
    var self = this;
    if (pub) {
        cb(new RBTContext(null, self, null));
        return;
    }
    this.POOL.Runner(function (Client) {
        Client ? Client.MULTI().HGETALL("auth~" + sid, function (err, data) {
            if (!err && data && data.STATUS == '1') {
                try {
                    var obj = JSON.parse(data.DATA);
                    cb(new RBTContext(obj, self, data));
                } catch (e) {
                    _ERROR("[meap_rm_robot_manager_context][RMContext][BuildRobot][ERROR] BUILDROBOT ERROR ", e.message);
                    cb(null);
                }
            } else
                cb(null);
        }).EXPIRE("auth~" + sid, global.liveTime ? global.liveTime : 86400, function (err, data) {
        }).EXEC(function (err, replies) {
            Client.Release();
        }) : 0;
    });
}

RMContext.prototype.RobotSet = function (appid, sid, key, value) {
    this.POOL.Runner(function (Client) {
        if (Client) {
            Client.HMSET("auth~" + sid, "STORE" + key, value, function (err, data) {
                Client.Release();
            });
        }
    });
}

RMContext.prototype.RobotGet = function (appid, sid, key, cb) {
    this.POOLS ? this.POOLS.Runner(function (Client) {
        if (Client) {
            Client.HMGET("auth~" + sid, key, function (err, data) {
                if (!err && data) {
                    cb(data);
                } else {
                    cb(null);
                }
                Client.Release();
            });
        }
    }) : this.POOL.Runner(function (Client) {
        if (Client) {
            Client.HMGET("auth~" + sid, key, function (err, data) {
                if (!err && data) {
                    cb(data);
                } else {
                    cb(null);
                }
                Client.Release();
            });
        }
    });
}

RMContext.prototype.Set = function (key, value, expire) {
    this.POOL.Runner(function (Client) {
        if (Client) {
            Client.SET("TMP" + key, value);
            Client.EXPIRE("TMP" + key, expire ? expire : 30, function (err, data) {
                Client.Release();
            });
        }
    });
}

RMContext.prototype.Get = function (key, cb) {
    this.POOLS ? this.POOLS.Runner(function (Client) {
        if (Client) {
            Client.GET("TMP" + key, function (err, data) {
                cb(err ? -1 : 0, data);
                Client.Release();
            });
        }
    }) : this.POOL.Runner(function (Client) {
        if (Client) {
            Client.GET("TMP" + key, function (err, data) {
                cb(err ? -1 : 0, data);
                Client.Release();
            });
        }
    });
}

RMContext.prototype.ExistRobot = function (appid, sid, cb) {
    var self = this;
    this.POOLS ? this.POOLS.Runner(function (Client) {
        Client ? Client.HGETALL("auth~" + sid, function (err, data) {
            if (!err && data && data.STATUS == '1') {
                cb(true);
            } else
                cb(false);
            Client.Release();
        }) : 0;
    }) : this.POOL.Runner(function (Client) {
        Client ? Client.HGETALL("auth~" + sid, function (err, data) {
            if (!err && data && data.STATUS == '1') {
                cb(true);
            } else
                cb(false);
            Client.Release();
        }) : 0;
    });
}

RMContext.prototype.checkIP = function (ServiceName, ip, index) {
    if (!index)
        index = 0;
    var service = this.Services[ServiceName][index];
    if (service) {
        if (!service.ippolicy)
            return true;

        var ipaddr = Config.ParseIP(ip);
        var result = false;
        for (var i in service.hosts) {
            var start = service.hosts[i][0];
            var end = service.hosts[i][1];
            if (Config.CompareIP(start, ipaddr) <= 0 && Config.CompareIP(end, ipaddr) >= 0) {
                result = true;
                break;
            }
        }

        if (service.ippolicy == "white")
            return result;
        else if (service.ippolicy == "black")
            return !result;
        else
            return false;
    } else
        return false;
}

RMContext.prototype.checkBasic = function (ServiceName, request, index) {
    if (!index)
        index = 0;
    var service = this.Services[ServiceName][index];
    if (service) {
        if (service.secure && service.auth.type == "basic") {
            return (request.getHeader("Authorization") == ("Basic " + new Buffer((service.auth.username + ':' + service.auth.password) || '').toString('base64')));
        } else
            return true;
    } else
        return false;
}

RMContext.prototype.handleReqURL = function (param, request) {
    //LOG2("[meap_rm_robot_manager_context][RMContext][handleReqURL]:",param);
    try {
        var nameSpace = global.nameSpace;
        if (nameSpace && param && (param.indexOf(nameSpace) > 0)) {
            param = param.replace(nameSpace + "/", "");
        } else {
            //_WARN("[meap_rm_robot_manager_context][RMContext][handleReqURL][WARNING]:nameSpace or param is not valid");
        }
        var urlobj = url.parse(param);
        var path = urlobj.pathname.split("/");
        //[ '', 'fullGoal', 'Service_time' ]
        var res = {
            appid: path[1],
            sid: path[2],
            type: path[3],
            //从第4个元素开始截取
            cmd: path.slice(3).join("/"),
            params: q.parse(urlobj.query),
            path: path.slice(4).join("/"),
            tree: path.slice(4)
        };
        if (!this.interfaces[res.type]) {
            res.appid = "";
            res.sid = "public";
            res.type = path[1];                 //fullGoal
            res.cmd = path.slice(1).join("/");  //  fullGoal/Service_time/1.1
            res.path = path.slice(2).join("/");//   Service_time/1.1
            res.params = q.parse(urlobj.query);
            res.tree = path.slice(2);        //     ["Service_time","1.1"]
        }
        return this.matchInterface(res, request);
    } catch (e) {
        return null;
    }
    return null;
}
RMContext.prototype.matchInterface = function (res, request) {
    var ifs = this.interfaces[res.type];
    var method = request.method.toLowerCase();
    if (ifs) {
        if (ifs[method + "~" + res.path]) {
            res.i_f = ifs[method + "~" + res.path];
            return res;
        } else if (ifs["all~" + res.path]) {
            res.i_f = ifs["all~" + res.path];
            return res;
        }
        for (var i in ifs) {
            var ipath = ifs[i].tree;
            var baas = {};
            var i_f = ifs[i];
            if (i_f.method != method && i_f.method != "all")
                continue;
            if (res.tree.length != ipath.length)
                continue;
            for (var j in res.tree) {
                try {
                    if (res.tree[j] == ipath[j])
                        continue;
                    if (ipath[j][0] == '$') {
                        var param = ipath[j].match(/\$\{(.+)\}$/)
                        baas[param[1]] = res.tree[j];
                        continue;
                    }
                } catch (e) {
                }
                i_f = null;
                break;
            }
            if (i_f) { //I_F is undefined
                res.i_f = i_f;
                res.baas = baas;
                return res;
            }
        }
        res.i_f = (ifs["get~default"] || ifs["post~default"] || ifs["all~default"]);
    } else {
        return {};
    }
    return res;
}

RMContext.prototype.CallInterface = function (type, path, method, Param, Robot, Request, callback) {
    var i_f = this.interfaces[type][method.toLowerCase() + "~" + path];
    if (!i_f) return callback(JSON.stringify({status: -1, message: "No Such Function"}));
    var stream = new http.OutgoingMessage();
    stream.end = function (data) {
        callback(data);
    }
    i_f.handle.Runner(Param, Robot, Request, stream, i_f);
}
exports.Context = RMContext;
