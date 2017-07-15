var fs = require("fs");
var path = require("path");
var util = require("util");
var interfaceCfg = require("meap_rm_interface_cfg");
var MSG = require('meap_im_msg');
var os = require("os");
var usage = Require("usage");

function parseIP2Arr(ip) {
    var S = [],
        E = [];
    var iparr = ip.split("~");
    if (iparr.length > 1) {
        ca
        var arr = iparr[0].split(".");
        for (var i in arr)
            S[i] = parseInt(arr[i]);
        arr = iparr[1].split(".");
        for (var i in arr)
            E[i] = parseInt(arr[i]);
        return [S, E];
    } else {
        var arr = iparr[0].split(".");
        for (var i in arr) {
            if (arr[i] == "*") {
                S[i] = 0;
                E[i] = 255;
            } else {
                S[i] = E[i] = parseInt(arr[i]);
            }
        }
        return [S, E];
    }
    return null;
}

function parseIP(ip) {
    var arr = ip.split(".");
    var S = [];
    for (var i in arr)
        S[i] = parseInt(arr[i]);
    return S;
}

function compareIp(a, b) {
    //LOG5("[SRVCFG] compareIp : ",a,b);
    LOG3("[meap_rm_service_cfg][compareIp] compareIp : ", a, b);
    try {
        for (var i = 0; i < 4; i++) {
            if (a[i] > b[i])
                return 1;
            else if (a[i] < b[i])
                return -1;
        }
    } catch (e) {
        _ERROR("[meap_rm_service_cfg][compareIp][ERROR] compareIp : ", e.message);
    }
    return 0;
}

function RewriteLog(context) {
    try {
        context.Log.power = parseInt(context.Log.power);

        var LogPublish = function () {
        };

        if (context.Log.power) {
            var logOption = {
                host: context.Log.host || '127.0.0.1',
                port: context.Log.port || 6379,
                db: context.Log.db,
                authpass: context.Log.authpass
            }
            MSG.Init(logOption);
            MSG.Client(function (err, client) {
                if (err != -1) {
                    LogPublish = function (logString) {
                        client.publish("meap_msg_LogPublish", logString);
                    }
                }
                initLogger(context, LogPublish);
            });
        } else {
            initLogger(context);
        }
    } catch (e) {
        if (context.Logstate) {
            global.LOG = global.LOG1 = global.LOG2 = global.LOG3 = global.LOG4 = global.LOG5 = global.LOGP = console.log;
        }
        LOG1("[meap_rm_service_cfg][parseCfg] LogPublish CREATE ERROR ", e);
    }
}

function initLogger(context, LogPublish) {
    console.logFunction = console.log;
    console.log = function () {
        if (context.Log.power) {
            if (util.format.apply(util, arguments).indexOf('meap_im_msg') == -1) {
                LogPublish(JSON.stringify({
                    logInfo: util.format.apply(util, arguments),
                    servicename: context.Options.servicename,
                    date: 'D',
                    type: 'info'
                }));
            }
        }

        if (context.Logstate) {
            if (util.format.apply(util, arguments).indexOf('LogPublish') == -1) {
                console.logFunction(context.hostname, util.format.apply(util, arguments));
            }
        }
    }

    console.warnFunction = console.warn;
    console.warn = function () {
        if (context.Log.power) {
            LogPublish(JSON.stringify({
                logInfo: util.format.apply(util, arguments),
                servicename: context.Options.servicename,
                date: 'D',
                type: 'warn'
            }));
        }
        if (context.Logstate) {
            if (util.format.apply(util, arguments).indexOf('LogPublish') == -1) {
                console.warnFunction(context.hostname, util.format.apply(util, arguments));
            }
        }
    }

    console.errorFunction = console.error;
    console.error = function () {
        if (context.Log.power) {
            LogPublish(JSON.stringify({
                logInfo: util.format.apply(util, arguments),
                servicename: context.Options.servicename,
                date: 'D',
                type: 'warn'
            }));
        }
        if (context.Logstate) {
            console.errorFunction(context.hostname, util.format.apply(util, arguments));
        }
    }

    global.LOG = global.LOG1 = global.LOG2 = global.LOG3 = global.LOG4 = global.LOG5 = global.LOGP = console.log;
    global._INFO = console.info;
    global._WARN = console.warn;
    global._ERROR = console.error;
}

function parseCfg(Context) {
    var context = Context;

    var serviceconfigpath = path.join(context.workpath, "service.json");
    var result = JSON.parse(fs.readFileSync(serviceconfigpath));

    var ips = os.networkInterfaces();
    context.locationIP = null;
    for (var i in ips) {
        if (!context.locationIP && i.indexOf("lo") == -1) {
            context.locationIP = ips[i][0]['address'];
        }
    }

    context.hostname = os.hostname();
    context.Logstate = result.meap.logstate;
    context.Log = result.meap.log;

    context.Options = {};
    context.Options.servicename = result.meap.servicename;

    RewriteLog(context);

    LOG3("[meap_rm_service_cfg][parseCfg] JSON PARSE RESULT ", result, masConf);

    try {
        context.Services = {};
        context.SessionPool = {};
        try {
            process.env.TMP = result.meap.tmpdir ? result.meap.tmpdir : "/tmp";

            var masConf = JSON.parse(fs.readFileSync('/etc/MAS.conf'));
            context.Options.serviceinfo = result.meap.serviceinfo;
            context.Options.cacache = result.meap.cacache;
            context.Cache = result.meap.cache;
            //自定义缓存池
            context.customCache = result.meap.customCache;
            context.Cookie = result.meap.cookie;
            context.InterfaceDir = result.meap.interfacedir;
            context.Globalmonitorchannel = masConf.Globalmonitorchannel;
            context.GlobalmonitorDB = masConf.basicchannel;
            context.CounterPower = result.meap.counterPower;
            context.CountermonitorDB = result.meap.counterMonitor;
            context.AppPolicyPower = result.meap.appPolicyPower;
            context.AppValidTime = result.meap.appValidTime * 1000 || 600000;
            context.IfPolicyPower = result.meap.ifPolicyPower;
            context.ServiceThreshold = result.meap.threshold;

            for (var j in context.ServiceThreshold) {
                context.ServiceThreshold[j] = parseInt(context.ServiceThreshold[j]);
            }

            context.MaxConcurrent = result.meap.maxConcurrent;
            context.MessageThreshold = {
                service: {},
                app: {},
                appuser: {},
                appip: {}
            };
            context.PolicyRDB = masConf.basicpool;
            context.PolicyMDB = masConf.policydb;
            context.BasicMDB = masConf.basicdb;
            context.AuthPoolOption = result.meap.authpool;
            context.Options.Servers = [];
            context.Projects = result.meap.projects;

            if (!result.meap.sessionpool) {
                context.SessionPool.Switch = false;
            } else {
                context.SessionPool.Switch = result.meap.sessionpool["switch"];
                context.SessionPool.Running = result.meap.sessionpool.running ? parseInt(result.meap.sessionpool.running) : 500;
                context.SessionPool.Waitting = result.meap.sessionpool.waiting ? parseInt(result.meap.sessionpool.waiting) : 500;
                context.SessionPool.Timeout = result.meap.sessionpool.Timeout ? parseInt(result.meap.sessionpool.Timeout) : 30;
            }
        } catch (e) {
            _ERROR("[meap_rm_service_cfg][parseCfg][ERROR]: parseCfg " + e.message);
        }

        if (!Array.isArray(result.meap.services)) {
            var temp = result.meap.services;
            result.meap.services = [temp];
        }
        for (var serv in result.meap.services) {
            var settings = result.meap.services[serv];
            var serviceName = settings.name;
            var Service = {
                protocal: "HTTP",
                port: 13000,
                host: "0.0.0.0",
                secure: false,
                ippolicy: null,
                auth: null,
                timeout: 60,
                localhost: "0.0.0.0"
            };
            {
                if (settings.timeout)
                    Service.timeout = parseInt(settings.timeout) ? parseInt(settings.timeout) : 60;
                Service.secure = settings.secure;
                Service["switch"] = settings["switch"] ? settings["switch"] : "open";
                if (settings.host)
                    Service.host = xx.host;
                if (settings.port)
                    Service.port = settings.port;
                if (settings.protocal)
                    Service.protocal = settings.protocal;
                if (Service.protocal == "HTTPS") {
                    var keypath = path.join(context.configpath, settings.certificate.key);
                    var certpath = path.join(context.configpath, settings.certificate.cert);
                    if (settings.certificate.key.indexOf("/") == 0 || settings.certificate.key.indexOf("://") > 0) {
                        keypath = settings.certificate.key;
                    }
                    if (settings.certificate.cert.indexOf("/") == 0 || settings.certificate.cert.indexOf("://") > 0) {
                        certpath = settings.certificate.cert;
                    }
                    Service.cert = {
                        key: keypath,
                        cert: certpath
                    }
                }
                if (settings.secure) {
                    var auth = {
                        type: settings.auth.type
                    };
                    switch (settings.auth.type) {
                        case "basic":
                            auth.username = settings.auth.username;
                            auth.password = settings.auth.password;
                            break;
                        case "ssl":
                            auth.ca = path.join(context.configpath, settings.auth.ca);
                            if (settings.auth.ca.indexOf("/") == 0 || settings.auth.ca.indexOf("://") > 0) {
                                auth.ca = settings.auth.ca;
                            }
                            break;
                        default:
                            break;
                    }
                    Service.auth = auth;
                }
                if (settings["ip-policy"]) {
                    Service.ippolicy = settings["ip-policy"].type;
                    var hosts = settings["ip-policy"].host.split(";");
                    Service.hosts = [];
                    for (var i in hosts) {
                        var iprange = parseIP2Arr(hosts[i]);
                        if (iprange)
                            Service.hosts.push(iprange);
                    }
                }
                Service.subservicename = settings.subservicename;
            }
            if (!context.Services[serviceName])
                context.Services[serviceName] = [];
            context.Services[serviceName].push(Service);
            if (Service["switch"] == "open") {
                context.Options.Servers.push({
                    subservicename: Service.subservicename
                });
            }
            //LOG3("[SRVCFG] SERVICE CONFIG ",Service);
            LOG3("[meap_rm_service_cfg][parseCfg] SERVICE CONFIG ", Service);
        }

        function globalMonitor(context) {
            var option = {
                host: context.GlobalmonitorDB.host,
                port: context.GlobalmonitorDB.port,
                db: context.GlobalmonitorDB.db,
                authpass: context.GlobalmonitorDB.authpass
            }

            LOG1("[meap_rm_service_cfg][parseCfg][globalMonitor][Listener] LISTENER START, OPTION ", option);

            MSG.Init(option);
            MSG.Listener(context.Globalmonitorchannel, function (err, message) {
                try {
                    if (!err) {
                        var msg = JSON.parse(message);
                        if (msg.action == 'changeapprove') {
                            context.VerifyMan.Init();
                        }
                        if (msg.service !== context.Options.servicename)
                            return;
                        switch (msg.action) {
                            case 'startproject':
                                interfaceCfg.loadProject(msg.param, context);
                                break;
                            case 'stopproject':
                                interfaceCfg.deleteProject(msg.param, context);
                                break;
                            case 'startlog':
                                context.Logstate = true;
                                break;
                            case 'stoplog':
                                context.Logstate = false;
                                break;
                            case 'startappapprove':
                                context.AppPolicyPower = 1;
                                break;
                            case 'stopappapprove':
                                context.AppPolicyPower = 0;
                                break;
                            case 'startifapprove':
                                context.IfPolicyPower = 1;
                                break;
                            case 'stopifapprove':
                                context.IfPolicyPower = 0;
                                break;
                            case 'startmonitor':
                                context.counterPower = 1;
                                break;
                            case 'stopmonitor':
                                context.counterPower = 0;
                                break;
                            case 'changejdbc':
                                context.JDBCMan.Init();
                            default :
                                break;
                        }
                    }
                } catch (e) {
                    _ERROR("[meap_rm_service_cfg][parseCfg][globalMonitor][Listener][ERROR]", e.message);
                }
            }, function () {
                LOG1("[meap_rm_service_cfg][parseCfg][globalMonitor][Listener] READY");
            });
        }

        globalMonitor(context);

        var counterOption = {
            host: context.CountermonitorDB.host,
            port: context.CountermonitorDB.port,
            db: context.CountermonitorDB.db,
            authpass: context.CountermonitorDB.authpass
        }
        context.CounterPublish = {};

        var transinfo = {
            maxtime: {},
            mintime: {},
            count: 0,
            err: 0,
            size: 0
        };

        function makeTransSummary(CountObject) {
            var counter = 0;
            var length = 0;
            for (var i in transinfo.maxtime) {
                if (transinfo.maxtime[i] > CountObject.responsetime)
                    counter++;
                length++;
            }
            if (counter < 5) {
                if (transinfo.maxtime[CountObject.cmd] == undefined)
                    transinfo.maxtime[CountObject.cmd] = CountObject.responsetime;
                if (transinfo.maxtime[CountObject.cmd] < CountObject.responsetime)
                    transinfo.maxtime[CountObject.cmd] = CountObject.responsetime;

                if (length >= 5) {
                    var maxitem = null;
                    var maxtime = 0;
                    for (var i in transinfo.maxtime) {
                        if (transinfo.maxtime[i] < maxtime || maxtime == 0) {
                            maxtime = transinfo.maxtime[i];
                            maxitem = i;
                        }
                    }
                    delete transinfo.maxtime[maxitem];
                }
            }
            counter = 0;
            length = 0;
            for (var i in transinfo.mintime) {
                if (transinfo.mintime[i] < CountObject.responsetime)
                    counter++;
                length++;
            }
            if (counter < 5) {
                if (transinfo.mintime[CountObject.cmd] == undefined)
                    transinfo.mintime[CountObject.cmd] = CountObject.responsetime;
                if (transinfo.mintime[CountObject.cmd] > CountObject.responsetime)
                    transinfo.mintime[CountObject.cmd] = CountObject.responsetime;
                if (length >= 5) {
                    var minitem = null;
                    var mintime = 0;
                    for (var i in transinfo.mintime) {
                        if (transinfo.mintime[i] > mintime) {
                            mintime = transinfo.mintime[i];
                            minitem = i;
                        }
                    }
                    delete transinfo.mintime[minitem];
                }
            }
            transinfo.count++;
            CountObject.err != 0 && transinfo.err++;
            transinfo.size += CountObject.size;
        }


        MSG.Init(counterOption);
        MSG.Client(function (err, client) {
            if (err != -1) {
                context.CounterPublish = function (context, CountObject) {
                    try {
                        makeTransSummary(CountObject);
                        Context.Concurrent--;
                        client.publish("meap_msg_globalService_publishCount", JSON.stringify(CountObject), function (err, msg) {
                            if (!err) {
                                //LOG1("[meap_rm_service_cfg][CounterPublish][Publish] Count",CountObject);
                            } else {
                                LOG1("[meap_rm_service_cfg][CounterPublish][Publish] ERR", msg);
                            }
                        });
                    } catch (e) {

                    }
                }
            }
        });

        MSG.Client(function (err, client) {
            if (err != -1) {
                setInterval(function () {
                    usage.lookup(process.pid, {keepHistory: true}, function (err, stat) {
                        transinfo.running = Context.Concurrent;
                        transinfo.incomming = Context.incommingTrans;
                        var processusage = {
                            channel: "PROCESS_MONITOR",
                            data: {
                                os: os.hostname(),
                                servicename: Context.Options.servicename,
                                pid: process.pid,
                                usage: stat,
                                trans: transinfo
                            }
                        };
                        Context.incommingTrans = 0;
                        transinfo = {
                            maxtime: {},
                            mintime: {},
                            count: 0,
                            err: 0,
                            size: 0
                        };
                        client.publish("meap_msg_globalService_trans_monitor", JSON.stringify(processusage));
                        //console.log("SEND PROCESS MESSAGE",new Date());
                    });
                }, 1000);
            }
        });

        MSG.Client(function (err, client) {
            if (err != -1) {
                context.transMonitor = function (channel, object) {
                    try {
                        client.publish("meap_msg_globalService_trans_monitor", JSON.stringify({
                            channel: channel,
                            data: object
                        }), function (err, msg) {
                            if (!err) {

                            } else {
                                LOG1("[meap_rm_service_cfg][trans_monitor][Publish] ERR", msg);
                            }
                        });
                    } catch (e) {
                    }
                }
            }
        });
        MSG.Listener("serviceStatusThreshold", function (err, message) {
            try {
                var msg = JSON.parse(message);
                if (msg.expirationTime && msg.service === context.Options.servicename) {
                    context.MessageThreshold[msg.type][msg.features] = (msg.expirationTime * 1000 + (new Date()).valueOf());
                    //Set expiration time of service/app/appuser/appip
                }
            } catch (e) {
                _ERROR("[meap_rm_service_cfg][parseCfg][serviceStatusThreshold][Listener][ERROR]", e.message);
            }
        }, function () {
            LOG1("[meap_rm_service_cfg][parseCfg][serviceStatusThreshold][Listener] READY");
        });
    } catch (e) {
        _ERROR("[meap_rm_service_cfg][parseCfg][ERROR]: Parse service config fail. " + e.message);
    }
}

exports.Runner = parseCfg;
exports.ParseIP = parseIP;
exports.CompareIP = compareIp;
